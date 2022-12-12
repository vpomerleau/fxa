import React from 'react';
import { Localized } from '@fluent/react';

type ResetPasswordWarningProps = {
  ftlId: string;
  warningType: string;
  warningMessage: string;
};

const ResetPasswordWarning = ({
  ftlId,
  warningType,
  warningMessage,
}: ResetPasswordWarningProps) => {
  return (
    <div className="my-4 text-sm" data-testid="reset-password-warning">
      <Localized id={`${ftlId}-warning-type`}>
        <p className="inline text-red-600 font-semibold uppercase">
          {warningType}&nbsp;
        </p>
      </Localized>
      <Localized id={`${ftlId}-warning-message`}>
        <p className="inline">{warningMessage}</p>
      </Localized>
    </div>
  );
};

export default ResetPasswordWarning;
