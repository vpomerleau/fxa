/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import 'mutationobserver-shim';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import ResetPasswordWarning from '.';

const mockWarningTypeId = 'pw-reset-mock-warning-type';
const mockWarningType = 'note';
const mockWarningMessageId = 'pw-reset-mock-warning-message';
const mockWarningMessage =
  'If you eat too many cookies, you might feel very sick.';

describe('ResetPasswordWarning', () => {
  it('renders as expected', async () => {
    render(
      <ResetPasswordWarning
        warningTypeId={mockWarningTypeId}
        warningType={mockWarningType}
        warningMessageId={mockWarningMessageId}
        warningMessage={mockWarningMessage}
      />
    );
    expect(screen.getByTestId('reset-password-warning')).toBeInTheDocument();
  });
});
