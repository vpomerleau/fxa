/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const sinon = require('sinon');
const assert = { ...sinon.assert, ...require('chai').assert };
const { StatsD } = require('hot-shots');
const { AccountEventsManager } = require('../../lib/account-events');
const { default: Container } = require('typedi');
const { AppConfig, AuthFirestore } = require('../../lib/types');

const UID = 'uid';

describe('Account Events', () => {
  let usersDbRefMock;
  let firestore;
  let accountEventsManager;
  let addMock;
  let statsd;

  beforeEach(() => {
    addMock = sinon.stub();
    usersDbRefMock = {
      doc: sinon.stub().returns({
        collection: sinon.stub().returns({
          add: addMock,
        }),
      }),
    };
    firestore = {
      collection: sinon.stub().returns(usersDbRefMock),
    };
    const mockConfig = {
      authFirestore: {
        enabled: true,
        ebPrefix: 'fxa-eb-',
      },
      accountEvents: {
        enabled: true,
      },
    };
    Container.set(AppConfig, mockConfig);
    Container.set(AuthFirestore, firestore);
    statsd = { increment: sinon.spy() };
    Container.set(StatsD, statsd);

    accountEventsManager = new AccountEventsManager();
  });

  afterEach(() => {
    Container.reset();
  });

  it('can be instantiated', () => {
    assert.ok(accountEventsManager);
  });

  describe('email events', function () {
    it('can record email event', async () => {
      const message = {
        template: 'verifyLoginCode',
        deviceId: 'deviceId',
        flowId: 'flowId',
        service: 'service',
      };
      await accountEventsManager.recordEmailEvent(UID, message, 'emailSent');

      const assertMessage = {
        ...message,
        eventType: 'emailEvent',
        name: 'emailSent',
      };
      assert.calledOnceWithMatch(addMock, assertMessage);
      assert.calledOnceWithExactly(usersDbRefMock.doc, UID);

      assert.isAtLeast(Date.now(), addMock.firstCall.firstArg.createdAt);
      assert.calledOnceWithExactly(
        statsd.increment,
        'accountEvents.recordEmailEvent.write'
      );
    });

    it('logs and does not throw on failure', async () => {
      usersDbRefMock.doc = sinon.stub().throws();
      const message = {
        template: 'verifyLoginCode',
        deviceId: 'deviceId',
        flowId: 'flowId',
        service: 'service',
      };
      await accountEventsManager.recordEmailEvent(UID, message, 'emailSent');
      assert.isFalse(addMock.called);
      assert.calledOnceWithExactly(
        statsd.increment,
        'accountEvents.recordEmailEvent.error'
      );
    });

    it('strips falsy values', async () => {
      const message = {
        template: null,
        deviceId: undefined,
        flowId: '',
      };
      await accountEventsManager.recordEmailEvent(UID, message, 'emailSent');
      assert.isTrue(addMock.called);
      assert.isUndefined(addMock.firstCall.firstArg.template);
      assert.isUndefined(addMock.firstCall.firstArg.deviceId);
      assert.isUndefined(addMock.firstCall.firstArg.flowId);
    });
  });
});
