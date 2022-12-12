/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render } from '@testing-library/react';
import AccountRecoveryConfirmKey from '.';
import { usePageViewEvent } from '../../lib/metrics';

jest.mock('../../lib/metrics', () => ({
  logViewEvent: jest.fn(),
  usePageViewEvent: jest.fn(),
}));

describe('AccountRecoveryConfirmKey', () => {
  it('renders Ready component as expected', () => {
    render(<AccountRecoveryConfirmKey />);
  });

  it('emits the expected metrics on render', async () => {
    render(<AccountRecoveryConfirmKey />);
    expect(usePageViewEvent).toHaveBeenCalledWith(
      'settings.account-recovery-confirm-key',
      {
        entrypoint_variation: 'react',
      }
    );
  });
});
