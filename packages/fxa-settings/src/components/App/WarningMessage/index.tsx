import React from 'react';
import { Localized } from '@fluent/react';

type WarningMessageProps = {
  componentId: string;
  warningType: string;
  warningMessage: string;
};

const WarningMessage = ({
  componentId,
  warningType,
  warningMessage,
}: WarningMessageProps) => {
  return (
    <div className="my-4 text-sm" data-testid={`${componentId}-warning`}>
      <Localized id={`${componentId}-warning-type`}>
        <p className="inline text-red-600 font-semibold uppercase">
          {warningType}&nbsp;
        </p>
      </Localized>
      <Localized id={`${componentId}-warning-message`}>
        <p className="inline">{warningMessage}</p>
      </Localized>
    </div>
  );
};

export default WarningMessage;
