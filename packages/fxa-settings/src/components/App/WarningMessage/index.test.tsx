/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import 'mutationobserver-shim';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import WarningMessage from '.';

const mockComponentId = 'pw-reset-mock';
const mockWarningType = 'Note: ';
const mockWarningMessage =
  'If you eat too many cookies, you might feel very sick.';

describe('WarningMessage', () => {
  it('renders as expected', async () => {
    render(
      <WarningMessage
        componentId={mockComponentId}
        warningType={mockWarningType}
        warningMessage={mockWarningMessage}
      />
    );

    const testId: string = `${mockComponentId}-warning`;

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
