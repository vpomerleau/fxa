/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider'; // import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
// import { FluentBundle } from '@fluent/bundle';
import { usePageViewEvent } from '../../lib/metrics';
import { viewName } from '.';
import { MozServices } from '../../lib/types';
import { REACT_ENTRYPOINT } from '../../constants';
import {
  BEGIN_SIGNUP_HANDLER_RESPONSE,
  Subject,
  createMockSignupOAuthIntegration,
  createMockSignupSyncDesktopIntegration,
} from './mocks';
import {
  MOCK_EMAIL,
  MOCK_KEY_FETCH_TOKEN,
  MOCK_PASSWORD,
  MOCK_UNWRAP_BKEY,
} from '../mocks';
import { newsletters } from '../../components/ChooseNewsletters/newsletters';

jest.mock('../../lib/metrics', () => ({
  usePageViewEvent: jest.fn(),
  logViewEvent: jest.fn(),
}));

const mockSearchParams = {
  email: MOCK_EMAIL,
};

const search = new URLSearchParams(mockSearchParams);

const mockLocation = () => {
  return {
    pathname: `/signup`,
    search: '?' + search,
  };
};

const mockNavigate = jest.fn();
jest.mock('@reach/router', () => ({
  ...jest.requireActual('@reach/router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
}));

describe('Signup page', () => {
  beforeEach(cleanup);
  // TODO: enable l10n tests when they've been updated to handle embedded tags in ftl strings
  // TODO: in FXA-6461
  // let bundle: FluentBundle;
  // beforeAll(async () => {
  //   bundle = await getFtlBundle('settings');
  // });

  it('renders as expected', async () => {
    renderWithLocalizationProvider(<Subject />);

    // testAllL10n(screen, bundle);
    await screen.findByRole('heading', { name: 'Set your password' });
    screen.getByRole('link', { name: 'Change email' });
    screen.getByLabelText('Password');
    screen.getByLabelText('Repeat password');
    screen.getByLabelText('How old are you?');
    screen.getByRole('link', { name: /Why do we ask/ });
    expect(
      screen.getByRole('button', { name: 'Create account' })
    ).toBeDisabled();
    const firefoxTermsLink: HTMLElement = screen.getByRole('link', {
      name: 'Terms of Service',
    });
    const firefoxPrivacyLink: HTMLElement = screen.getByRole('link', {
      name: 'Privacy Notice',
    });
    // Checkboxes have their own test
    expect(firefoxTermsLink).toHaveAttribute('href', '/legal/terms');
    expect(firefoxPrivacyLink).toHaveAttribute('href', '/legal/privacy');
  });

  it('allows users to show and hide password input', async () => {
    renderWithLocalizationProvider(<Subject />);

    const newPasswordInput = await screen.findByLabelText('Password');

    expect(newPasswordInput).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByTestId('new-password-visibility-toggle'));
    expect(newPasswordInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByTestId('new-password-visibility-toggle'));
    expect(newPasswordInput).toHaveAttribute('type', 'password');
  });

  it('does not allow the user to change their email with oauth integration', async () => {
    renderWithLocalizationProvider(
      <Subject integration={createMockSignupOAuthIntegration()} />
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Change email' })
      ).not.toBeInTheDocument();
    });
  });

  it('shows an info banner and Pocket-specific TOS when client is Pocket', async () => {
    renderWithLocalizationProvider(
      <Subject
        integration={createMockSignupOAuthIntegration(MozServices.Pocket)}
      />
    );

    const infoBannerLink = await screen.findByRole('link', {
      name: /Find out here/,
    });
    await waitFor(() => {
      expect(infoBannerLink).toBeInTheDocument();
    });

    // info banner is dismissible
    const infoBannerDismissButton = screen.getByRole('button', {
      name: 'Close',
    });
    fireEvent.click(infoBannerDismissButton);
    await waitFor(() => {
      expect(infoBannerLink).not.toBeInTheDocument();
    });

    // Pocket links should always open in a new window (announced by screen readers)
    const pocketTermsLink = screen.getByRole('link', {
      name: 'Terms of Service Opens in new window',
    });
    const pocketPrivacyLink = screen.getByRole('link', {
      name: 'Privacy Notice Opens in new window',
    });

    expect(pocketTermsLink).toHaveAttribute(
      'href',
      'https://getpocket.com/tos/'
    );
    expect(pocketPrivacyLink).toHaveAttribute(
      'href',
      'https://getpocket.com/privacy/'
    );
  });

  it('shows options to choose what to sync when CWTS is enabled', async () => {
    renderWithLocalizationProvider(
      <Subject integration={createMockSignupSyncDesktopIntegration()} />
    );

    await screen.findByText('Choose what to sync');

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
  });

  it('renders and handles newsletters', async () => {
    renderWithLocalizationProvider(<Subject />);

    await screen.findByText('Get more from Mozilla:');

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('emits a metrics event on render', async () => {
    renderWithLocalizationProvider(<Subject />);

    await waitFor(() => {
      expect(usePageViewEvent).toHaveBeenCalledWith(viewName, REACT_ENTRYPOINT);
    });
  });

  describe('handles submission', () => {
    async function fillOutForm(age = '13') {
      const passwordInput = await screen.findByLabelText('Password');
      const repeatPasswordInput = screen.getByLabelText('Repeat password');
      const ageInput = screen.getByLabelText('How old are you?');

      fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: MOCK_PASSWORD },
      });
      fireEvent.blur(passwordInput);
      fireEvent.input(screen.getByLabelText('Repeat password'), {
        target: { value: MOCK_PASSWORD },
      });
      fireEvent.blur(repeatPasswordInput);
      fireEvent.input(ageInput, {
        target: { value: age },
      });
      fireEvent.blur(ageInput);

      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: 'Create account',
          })
        ).toBeEnabled();
      });
    }

    function submit() {
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    }

    describe('cookies', () => {
      // todo: do we need this cleanup?

      // const originalCookie = document.cookie;

      // beforeAll(() => {
      //   // @ts-ignore
      //   delete document.cookie;
      //   document.cookie = originalCookie;
      // });

      // beforeEach(() => {
      //   document.cookie = originalCookie;
      // });

      // afterEach(() => {
      //   jest.restoreAllMocks();
      // });

      // afterAll(() => {
      //   document.cookie = originalCookie;
      // });

      it('with user under 13, adds cookie and redirects', async () => {
        let cookieJar = '';
        jest.spyOn(document, 'cookie', 'set').mockImplementation((cookie) => {
          cookieJar = cookie;
        });
        jest
          .spyOn(document, 'cookie', 'get')
          .mockImplementation(() => cookieJar);
        expect(document.cookie).toBe('');

        renderWithLocalizationProvider(<Subject />);
        await fillOutForm('12');

        submit();
        await waitFor(() => {
          expect(document.cookie).toBe('tooyoung=1;');
        });
        expect(mockNavigate).toHaveBeenCalledWith('/cannot_create_account');
      });
    });

    it('passes newsletter subscription options to the next screen', async () => {
      const mockBeginSignupHandler = jest
        .fn()
        .mockResolvedValue(BEGIN_SIGNUP_HANDLER_RESPONSE);

      renderWithLocalizationProvider(
        <Subject beginSignupHandler={mockBeginSignupHandler} />
      );
      await fillOutForm();

      // select all newsletters
      const checkboxes = screen.getAllByRole('checkbox');
      // We expect three newsletter options
      expect(checkboxes).toHaveLength(3);
      act(() => {
        newsletters.forEach((newsletter, i) => {
          fireEvent.click(checkboxes[i]);
        });
      });

      submit();

      await waitFor(() => {
        // expect navigation to have been called with newsletter slugs
        expect(mockNavigate).toHaveBeenCalledWith(
          `/confirm_signup_code${mockLocation().search}`,
          {
            state: {
              email: MOCK_EMAIL,
              keyFetchToken: MOCK_KEY_FETCH_TOKEN,
              // we expect three newsletter options, but 4 slugs should be passed
              // because the first newsletter checkbox subscribes the user to 2 newsletters
              selectedNewsletterSlugs: [
                'security-privacy-news',
                'mozilla-accounts',
                'test-pilot',
                'take-action-for-the-internet',
              ],
              unwrapBKey: MOCK_UNWRAP_BKEY,
            },
            replace: true,
          }
        );
      });
    });

    it('on success with non-Sync integration', async () => {
      const mockBeginSignupHandler = jest
        .fn()
        .mockResolvedValue(BEGIN_SIGNUP_HANDLER_RESPONSE);

      renderWithLocalizationProvider(
        <Subject beginSignupHandler={mockBeginSignupHandler} />
      );

      await fillOutForm();
      submit();

      await waitFor(() => {
        expect(mockBeginSignupHandler).toHaveBeenCalledWith(
          MOCK_EMAIL,
          MOCK_PASSWORD,
          {}
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        `/confirm_signup_code${mockLocation().search}`,
        {
          state: {
            email: MOCK_EMAIL,
            keyFetchToken: MOCK_KEY_FETCH_TOKEN,
            selectedNewsletterSlugs: [],
            unwrapBKey: MOCK_UNWRAP_BKEY,
          },
          replace: true,
        }
      );
    });

    it.skip('on success with Sync integration', () => {
      renderWithLocalizationProvider(
        <Subject integration={createMockSignupSyncDesktopIntegration()} />
      );
      // check boxes for CWTS, check notifyFirefoxOfLogin is called
    });
    it.skip('on success with OAuth integration', () => {
      renderWithLocalizationProvider(
        <Subject integration={createMockSignupOAuthIntegration()} />
      );
      // test 'options' in beginSignupHandlerCall includes serviceName
      // expect(mockBeginSignupHandler).toHaveBeenCalledWith(
      //   MOCK_EMAIL,
      //   MOCK_PASSWORD,
      //   {service: MOCK_SERVICE}
      // );
      // finish other checks here in the OAuth ticket
    });
    it.skip('on fail', () => {
      // const mockBeginSignupHandler = jest
      //   .fn()
      //   .mockResolvedValue(BEGIN_SIGNUP_HANDLER_RESPONSE);
      //
      // ^ we probably want a `createBeginSignupHandlerResponse` function (instead of
      //  directly referencing BEGIN_SIGNUP_HANDLER_RESPONSE) that takes in params
    });
  });
});
