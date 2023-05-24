/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { SubscribePage } from '../pages/products';
import { expect } from '../lib/fixtures/standard';

// language and time added downstream in the request handler
// planId, productId, transformed downstream to snake_case
// type transformed downstream to event_type
const P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS = [
  'flow_id',
  // 'language',
  'planId',
  'productId',
  // 'time',
  'type',
];

// checkoutType transformed downstream to snake_case
const P1_SUBSCRIPTION_CREATE_REQUIRED_FIELDS = ['checkoutType'];

// paymentProvider, previousPlanId, previousProductId, subscriptionId transformed downstream to snake_case
// uid transformed downstream to user_id
const P1_SUBSCRIPTION_PLAN_CHANGE_REQUIRED_FIELDS = [
  'paymentProvider',
  'previousPlanId',
  'previousProductId',
  'subscriptionId',
  'uid',
];

const REQUIRED_FIELDS_BY_EVENT_TYPE_MAP = {
  // subscription create
  'amplitude.subPaySetup.view': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_CREATE_REQUIRED_FIELDS,
  ],
  'amplitude.subPaySetup.engage': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_CREATE_REQUIRED_FIELDS,
  ],
  'amplitude.subPaySetup.submit': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_CREATE_REQUIRED_FIELDS,
    'paymentProvider',
  ],
  'amplitude.subPaySetup.success': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_CREATE_REQUIRED_FIELDS,
    'paymentProvider',
    'country_code_source',
  ],
  'amplitude.subPaySetup.fail': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_CREATE_REQUIRED_FIELDS,
    'paymentProvider',
    'error_id',
  ],
  // subscription plan change
  'amplitude.subPaySubChange.view': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_PLAN_CHANGE_REQUIRED_FIELDS,
  ],
  'amplitude.subPaySubChange.engage': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_PLAN_CHANGE_REQUIRED_FIELDS,
  ],
  'amplitude.subPaySubChange.submit': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_PLAN_CHANGE_REQUIRED_FIELDS,
  ],
  'amplitude.subPaySubChange.success': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_PLAN_CHANGE_REQUIRED_FIELDS,
  ],
  'amplitude.subPaySubChange.fail': [
    ...P1_PAYMENTS_GLOBAL_REQUIRED_FIELDS,
    ...P1_SUBSCRIPTION_PLAN_CHANGE_REQUIRED_FIELDS,
    'error_id',
  ],
};

export class MetricsObserver {
  public rawEvents: (Object & { type: string })[];
  private subscribePage: SubscribePage;

  constructor(subscribePage: SubscribePage) {
    this.subscribePage = subscribePage;
    this.rawEvents = [];
  }

  startTracking() {
    this.subscribePage.page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/metrics')) {
        const requestBody = request.postDataJSON();

        for (const eventBase of requestBody.events) {
          const eventProperties = structuredClone(requestBody.data);
          const rawEvent = { ...eventBase, ...eventProperties };

          if (rawEvent.type in REQUIRED_FIELDS_BY_EVENT_TYPE_MAP) {
            for (const field of REQUIRED_FIELDS_BY_EVENT_TYPE_MAP[
              rawEvent.type
            ]) {
              expect(rawEvent[field]).not.toBeNull();
              expect(rawEvent[field], `${field} is required`).toBeDefined();
            }

            // If this is an existing user checkout flow or a plan change event, uid is required
            if (
              rawEvent.checkoutType === 'with-account' ||
              rawEvent.type.startsWith('amplitude.subPaySubChange')
            ) {
              expect(
                rawEvent.uid,
                'uid is required for existing accounts'
              ).toBeDefined();
            }

            this.rawEvents.push(rawEvent);
          }
        }
      }
    });
  }
}
