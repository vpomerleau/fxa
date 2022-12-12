/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { RouteComponentProps } from '@reach/router';
import { Localized } from '@fluent/react';

type HeaderContinueToProps = {
  ftlId: string;
  headingText: string;
  serviceName?: string;
};

const HeaderContinueTo = ({
  ftlId,
  headingText,
  serviceName,
}: HeaderContinueToProps & RouteComponentProps) => {
  return (
    <header className="mb-4">
      <Localized id={`${ftlId}-heading`}>
        <h1 className="text-xl mb-2">{headingText}</h1>
      </Localized>
      {!serviceName && (
        <Localized id="header-continue-to-subheading-default">
          <h2>{`to continue to account settings`}</h2>
        </Localized>
      )}
      {serviceName && (
        <Localized id="header-continue-to-subheading-custom">
          <h2>{`to continue to ${serviceName}`}</h2>
        </Localized>
      )}
    </header>
  );
};

export default HeaderContinueTo;
