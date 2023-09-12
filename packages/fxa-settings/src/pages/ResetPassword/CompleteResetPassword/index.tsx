/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useCallback, useState, useEffect, ReactElement } from 'react';
import { Link, useLocation, useNavigate } from '@reach/router';
import { useForm } from 'react-hook-form';
import { logPageViewEvent } from '../../../lib/metrics';
import {
  IntegrationType,
  useAccount,
  isOAuthIntegration,
  useFtlMsgResolver,
} from '../../../models';
import WarningMessage from '../../../components/WarningMessage';
import LinkRememberPassword from '../../../components/LinkRememberPassword';
import FormPasswordWithBalloons from '../../../components/FormPasswordWithBalloons';
import { REACT_ENTRYPOINT } from '../../../constants';
import CardHeader from '../../../components/CardHeader';
import AppLayout from '../../../components/AppLayout';
import Banner, { BannerType } from '../../../components/Banner';
import {
  FtlMsg,
  hardNavigateToContentServer,
  hardNavigate,
} from 'fxa-react/lib/utils';
import { LinkStatus } from '../../../lib/types';
import useNavigateWithoutRerender from '../../../lib/hooks/useNavigateWithoutRerender';
import { notifyFirefoxOfLogin } from '../../../lib/channels/helpers';
import {
  clearOAuthData,
  clearOriginalTab,
  isOriginalTab,
} from '../../../lib/storage-utils';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import {
  CompleteResetPasswordFormData,
  CompleteResetPasswordLocationState,
  CompleteResetPasswordProps,
  CompleteResetPasswordSubmitData,
} from './interfaces';
import {
  AuthUiErrors,
  getLocalizedErrorMessage,
} from '../../../lib/auth-errors/auth-errors';

// The equivalent complete_reset_password mustache file included account_recovery_reset_password
// For React, we have opted to separate these into two pages to align with the routes.
//
// Users should only see the CompleteResetPassword page on /complete _reset_password if
//   - there is no account recovery key for their account
//   - there is an account recovery key for their account, but it was reported as lost
//
// If the user has an account recovery key (and it is not reported as lost),
// navigate to /account_recovery_confirm_key
//
// If account recovery was initiated with a key, redirect to account_recovery_reset_password

export const viewName = 'complete-reset-password';

const CompleteResetPassword = ({
  linkModel,
  setLinkStatus,
  integration,
  finishOAuthFlowHandler,
}:
  CompleteResetPasswordProps) => {
  const [bannerMessage, setBannerMessage] = useState<
    undefined | string | ReactElement
  >();
  /* Show a loading spinner until all checks complete. Without this, users with a
   * recovery key set or with an expired or damaged link will experience some jank due
   * to an immediate redirect or rerender of this page. */
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true);
  const navigate = useNavigate();
  const navigateWithoutRerender = useNavigateWithoutRerender();
  const account = useAccount();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: CompleteResetPasswordLocationState;
  };
  const ftlMsgResolver = useFtlMsgResolver();

  const { handleSubmit, register, getValues, errors, formState, trigger } =
    useForm<CompleteResetPasswordFormData>({
      mode: 'onTouched',
      criteriaMode: 'all',
      defaultValues: {
        newPassword: '',
        confirmPassword: '',
      },
    });

  /* When the user clicks the confirm password reset link from their email, we check
   * the status of the link. If the link is valid, we check if a recovery key is enabled.
   * If there is a recovery key, we navigate to the `account_recovery_confirm_key` page.
   * If there isn't, we stay on this page and continue a regular password reset.
   * If users clicked the link leading back to this page from `account_recovery_confirm_key`,
   * we assume the user has lost the key and pass along a `lostRecoveryKey` flag
   * so we don't perform the check and redirect again.
   * If the link is -not- valid, we render link expired or link damaged.
   */
  useEffect(() => {
    const checkPasswordForgotToken = async (token: string) => {
      try {
        const isValid = await account.resetPasswordStatus(token);
        if (isValid) {
          setLinkStatus(LinkStatus.valid);
          handleRecoveryKeyStatus();
        } else {
          setLinkStatus(LinkStatus.expired);
        }
      } catch (e) {
        setLinkStatus(LinkStatus.damaged);
      }
    };

    const handleRecoveryKeyStatus = async () => {
      if (!location.state?.lostRecoveryKey) {
        await checkForRecoveryKeyAndNavigate(linkModel.email);
      }
      renderCompleteResetPassword();
    };

    const checkForRecoveryKeyAndNavigate = async (email: string) => {
      try {
        const hasRecoveryKey = await account.hasRecoveryKey(email);
        if (hasRecoveryKey) {
          navigate(`/account_recovery_confirm_key${location.search}`, {
            replace: true,
            state: { ...{ email } },
          });
        }
      } catch (error) {
        // If checking for an account recovery key fails,
        // we provide the user with the option to manually navigate to the account recovery flow
        setBannerMessage(
          <>
            <FtlMsg id="complete-reset-password-recovery-key-error-v2">
              <p>
                Sorry, there was a problem checking if you have an account
                recovery key.
              </p>
            </FtlMsg>
            <FtlMsg id="complete-reset-password-recovery-key-link">
              <Link
                to={`/account_recovery_confirm_key${location.search}`}
                className="link-white underline-offset-4"
              >
                Reset your password with your account recovery key.
              </Link>
            </FtlMsg>
          </>
        );
      }
    };

    const renderCompleteResetPassword = () => {
      setShowLoadingSpinner(false);
      logPageViewEvent(viewName, REACT_ENTRYPOINT);
    };
    checkPasswordForgotToken(linkModel.token);
  }, [
    account,
    navigate,
    location.search,
    location.state?.lostRecoveryKey,
    linkModel.email,
    linkModel.token,
    setLinkStatus,
    setShowLoadingSpinner,
  ]);

  const alertSuccessAndNavigate = useCallback(() => {
    setBannerMessage('');
    navigateWithoutRerender(
      `/reset_password_verified${window.location.search}`,
      { replace: true }
    );
  }, [navigateWithoutRerender]);

  const onSubmit = useCallback(
    async ({
      newPassword,
      token,
      code,
      email,
      emailToHashWith,
    }: CompleteResetPasswordSubmitData) => {
      try {
        // The `emailToHashWith` option is returned by the auth-server to let the front-end
        // know what to hash the new password with. This is important in the scenario where a user
        // has changed their primary email address. In this case, they must still hash with the
        // account's original email because this will maintain backwards compatibility with
        // how account password hashing works previously.
        const emailToUse = emailToHashWith || email;

        const accountResetData = await account.completeResetPassword(
          token,
          code,
          emailToUse,
          newPassword
        );

        /* NOTE: Session check/totp check must come after completeResetPassword since those
         * require session tokens that we retrieve in PW reset. We will want to refactor this
         * later but there's a `mustVerify` check getting in the way (see Account.ts comment).
         *
         * We may also want to consider putting a different error message in place for when
         * PW reset succeeds, but one of these fails. At the moment, the try/catch in Account
         * just returns false for these if the request fails. */
        const [sessionIsVerified, hasTotp] = await Promise.all([
          account.isSessionVerifiedAuthClient(),
          account.hasTotpAuthClient(),
        ]);

        let isHardNavigate = false;
        switch (integration.type) {
          // NOTE: SyncBasic check is temporary until we implement codes
          // See https://docs.google.com/document/d/1K4AD69QgfOCZwFLp7rUcMOkOTslbLCh7jjSdR9zpAkk/edit#heading=h.kkt4eylho93t
          case IntegrationType.SyncDesktop:
          case IntegrationType.SyncBasic:
            notifyFirefoxOfLogin({
              authAt: accountResetData.authAt,
              email,
              keyFetchToken: accountResetData.keyFetchToken,
              sessionToken: accountResetData.sessionToken,
              uid: accountResetData.uid,
              unwrapBKey: accountResetData.unwrapBKey,
              verified: accountResetData.verified,
            });
            break;
          case IntegrationType.OAuth:
            // allows a navigation to a "complete" screen or TOTP screen if it is setup
            // TODO: check if relier has state
            if (hasTotp) {
              // finishing OAuth flow occurs on this page after entering TOTP
              // TODO: probably need to pass some params
              hardNavigateToContentServer(
                `/signin_totp_code${location.search}`
              );
              isHardNavigate = true;
            } else if (sessionIsVerified && isOAuthIntegration(integration)) {
              // todo use type guard, FXA-8111
              const { redirect } = await finishOAuthFlowHandler(
                integration.data.uid || account.uid,
                accountResetData.sessionToken,
                accountResetData.keyFetchToken,
                accountResetData.unwrapBKey
              );

              // Clear local / session storage
              clearOAuthData();

              // If the user is on the same tab throughout the process, then
              // just send them back to the relying party. Otherwise log them in
              // behind the scenes and show a success message.
              if (isOriginalTab()) {
                clearOriginalTab();
                hardNavigate(redirect);
                return;
              }
            }
            break;
          case IntegrationType.Web:
            if (hasTotp) {
              // take users to Settings after entering TOTP
              hardNavigateToContentServer(
                `/signin_totp_code${location.search}`
              );
              isHardNavigate = true;
            }
            // TODO: if no TOTP, navigate users to /settings with the alert bar message
            // for now, just navigate to reset_password_verified
            break;
          default:
          // TODO: run unpersistVerificationData in FXA-7308
        }

        if (!isHardNavigate) {
          alertSuccessAndNavigate();
        }
      } catch (err) {
        // if the link expired or the reset was completed in another tab/browser
        // between page load and form submission
        // on form submission, redirect to link expired page to provide a path to resend a link
        if (err.errno === AuthUiErrors.INVALID_TOKEN.errno) {
          setLinkStatus(LinkStatus.expired);
        } else {
          const localizedBannerMessage = getLocalizedErrorMessage(
            ftlMsgResolver,
            err
          );
          setBannerMessage(localizedBannerMessage);
        }
      }
    },
    [
      account,
      integration,
      location.search,
      alertSuccessAndNavigate,
      finishOAuthFlowHandler,
      ftlMsgResolver,
      setLinkStatus,
    ]
  );

  if (showLoadingSpinner) {
    return (
      <LoadingSpinner className="bg-grey-20 flex items-center flex-col justify-center h-screen select-none" />
    );
  }
  return (
    <AppLayout>
      <CardHeader
        headingText="Create new password"
        headingTextFtlId="complete-reset-pw-header"
      />

      {bannerMessage && (
        <Banner type={BannerType.error}>{bannerMessage}</Banner>
      )}

      <WarningMessage
        warningMessageFtlId="complete-reset-password-warning-message-2"
        warningType="Remember:"
      >
        When you reset your password, you reset your account. You may lose some
        of your personal information (including history, bookmarks, and
        passwords). That’s because we encrypt your data with your password to
        protect your privacy. You’ll still keep any subscriptions you may have
        and Pocket data will not be affected.
      </WarningMessage>

      {/* Hidden email field is to allow Fx password manager
          to correctly save the updated password. Without it,
          the password manager tries to save the old password
          as the username. */}
      <input type="email" value={linkModel.email} className="hidden" readOnly />
      <section className="text-start mt-4">
        <FormPasswordWithBalloons
          {...{
            formState,
            errors,
            trigger,
            register,
            getValues,
          }}
          email={linkModel.email}
          passwordFormType="reset"
          onSubmit={handleSubmit(({ newPassword }) =>
            onSubmit({
              newPassword,
              token: linkModel.token,
              code: linkModel.code,
              email: linkModel.email,
              emailToHashWith: linkModel.emailToHashWith,
            })
          )}
          loading={false}
          onFocusMetricsEvent={`${viewName}.engage`}
        />
      </section>
      <LinkRememberPassword email={linkModel.email} />
    </AppLayout>
  );
};

export default CompleteResetPassword;
