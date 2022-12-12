/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ResetPasswordWarning from '.';
import AppLayout from '../../AppLayout';
import { Meta } from '@storybook/react';

export default {
  title: 'components/App/ResetPasswordWarning',
  component: ResetPasswordWarning,
} as Meta;

const mockComponentId = 'pw-reset-mock';
const mockWarningType = 'Beware:';
const mockWarningMessage =
  'If you eat too many cookies, you might feel very sick.';

export const Default = () => (
  <AppLayout>
    <ResetPasswordWarning
      componentId={mockComponentId}
      warningType={mockWarningType}
      warningMessage={mockWarningMessage}
    />
  </AppLayout>
);
