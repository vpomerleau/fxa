/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { RouteComponentProps } from '@reach/router';
import { usePageViewEvent } from '../../lib/metrics';
import { Localized } from '@fluent/react';
import InputText from '../../components/Settings/InputText';
import HeaderContinueTo from '../../components/App/HeaderContinueTo';
import ResetPasswordWarning from '../../components/App/ResetPasswordWarning';

type AccountRecoveryConfirmKeyProps = {
  isLinkExpired?: boolean;
  serviceName?: string;
};

const AccountRecoveryConfirmKey = ({
  isLinkExpired = false,
  serviceName,
}: AccountRecoveryConfirmKeyProps & RouteComponentProps) => {
  usePageViewEvent('settings.account-recovery-confirm-key', {
    entrypoint_variation: 'react',
  });

  const ftlId: string = 'pw-reset-account-recovery-confirm-key-';

  return (
    <>
      {/* {isLinkExpired && <ResetPasswordLinkExpired />} */}

      {!isLinkExpired && (
        <>
          <HeaderContinueTo
            ftlId={ftlId}
            headingText="Reset password with account recovery key"
            serviceName={serviceName}
          />

          <form noValidate>
            <Localized id="pw-reset-account-recovery-confirm-key-instructions">
              <p className="text-sm">
                Please enter the one time use account recovery key you stored in
                a safe place to regain access to your Firefox account.
              </p>
            </Localized>
            <ResetPasswordWarning
              ftlId={ftlId}
              warningType="Note:"
              warningMessage="If you reset your password and don't have account recovery key saved, some of your data will be erased (including synced server data like history and bookmarks)."
            />
            {/* TODO: localization, controlled value, test, key validation? */}
            <InputText
              //   id="recovery-key"
              className="my-4"
              type="text"
              label="Account Recovery Key"
              placeholder="Enter account recovery key"
              autoFocus
            />
            {/* TODO: Add button action */}
            <Localized id="pw-reset-account-recovery-confirm-key-confirm-btn">
              <button
                id="submit-btn"
                type="submit"
                className="cta-primary cta-base-p flex-1 w-full"
              >
                Confirm account recovery key
              </button>
            </Localized>
            {/* TODO: Add button action */}
            <Localized id="pw-reset-account-recovery-confirm-key-no-key-btn">
              <button className="link-blue text-sm mt-4">
                Don't have an account recovery key?
              </button>
            </Localized>
          </form>
        </>
      )}
    </>
  );
};

export default AccountRecoveryConfirmKey;
