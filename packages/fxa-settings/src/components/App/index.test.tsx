/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render, act } from '@testing-library/react';
import App from '.';
import * as Metrics from '../../lib/metrics';

jest.mock('../../models', () => ({
  ...jest.requireActual('../../models'),
  useInitialState: jest.fn().mockReturnValue({ loading: true }),
}));

const appProps = {
  flowQueryParams: {
    deviceId: 'x',
    flowBeginTime: 1,
    flowId: 'x',
  },
  navigatorLanguages: ['en'],
  config: { metrics: { navTiming: { enabled: false, endpoint: '' } } },
};

beforeEach(() => {
  window.location.replace = jest.fn();
});

it('renders', async () => {
  await act(async () => {
    render(<App {...appProps} />);
  });
});

it('Initializes metrics flow data when present', async () => {
  const DEVICE_ID = 'yoyo';
  const BEGIN_TIME = 123456;
  const FLOW_ID = 'abc123';
  const flowInit = jest.spyOn(Metrics, 'init');
  const updatedAppProps = Object.assign(appProps, {
    flowQueryParams: {
      deviceId: DEVICE_ID,
      flowBeginTime: BEGIN_TIME,
      flowId: FLOW_ID,
    },
  });

  await act(async () => {
    render(<App {...updatedAppProps} />);
  });

  expect(flowInit).toHaveBeenCalledWith({
    deviceId: DEVICE_ID,
    flowId: FLOW_ID,
    flowBeginTime: BEGIN_TIME,
  });
  expect(window.location.replace).not.toHaveBeenCalled();
});
