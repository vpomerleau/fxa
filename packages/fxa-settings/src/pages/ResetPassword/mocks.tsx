/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MOCK_ACCOUNT } from '../../models/mocks';
import { Account, IntegrationType } from '../../models';
import {
  ResetPasswordBaseIntegration,
  ResetPasswordOAuthIntegration,
} from './interfaces';
import { MozServices } from '../../lib/types';
import { MOCK_REDIRECT_URI, MOCK_SERVICE } from '../mocks';

// No error message on submit
export const mockDefaultAccount = { MOCK_ACCOUNT } as any as Account;

mockDefaultAccount.resetPassword = () =>
  Promise.resolve({ passwordForgotToken: 'mockPasswordForgotToken' });

// Mocked localized throttled error (not localized in storybook)
export const mockAccountWithThrottledError = {
  MOCK_ACCOUNT,
} as unknown as Account;

const throttledErrorObj = {
  errno: 114,
  retryAfter: 500,
  retryAfterLocalized: 'in 15 minutes',
};

mockAccountWithThrottledError.resetPassword = () =>
  Promise.reject(throttledErrorObj);

export const mockAccountWithUnexpectedError = {
  MOCK_ACCOUNT,
} as unknown as Account;

mockAccountWithThrottledError.resetPassword = () =>
  Promise.reject('some error');

export function createMockResetPasswordWebIntegration(): ResetPasswordBaseIntegration {
  return {
    type: IntegrationType.Web,
    getServiceName: () => Promise.resolve(MozServices.Default),
  };
}

export function createMockResetPasswordOAuthIntegration(
  serviceName = MOCK_SERVICE
): ResetPasswordOAuthIntegration {
  return {
    type: IntegrationType.OAuth,
    getRedirectUri: () => MOCK_REDIRECT_URI,
    saveOAuthState: () => {},
    getService: () => serviceName,
    getServiceName: () => Promise.resolve(serviceName),
  };
}
