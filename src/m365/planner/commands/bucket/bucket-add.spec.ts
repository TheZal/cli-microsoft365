import * as assert from 'assert';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import request from '../../../../request';
import { accessToken } from '../../../../utils/accessToken';
import { sinonUtil } from '../../../../utils/sinonUtil';
import commands from '../../commands';
const command: Command = require('./bucket-add');

describe(commands.BUCKET_ADD, () => {
  const bucketAddResponse: any = {
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#planner/buckets/$entity",
    "@odata.etag": "W/\"JzEtQnVja2V0QEBAQEBAQEBAQEBAQEBARCc=\"",
    "name": "Test",
    "planId": "iVPMIgdku0uFlou-KLNg6MkAE1O2",
    "orderHint": "8585768959120203639",
    "id": "pjd65fbVYU-CbrkG9fnQZMkAOnHH"
  };

  const groupByDisplayNameResponse: any = {
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#groups",
    "value": [
      {
        "id": "0d0402ee-970f-4951-90b5-2f24519d2e40",
        "deletedDateTime": null,
        "classification": null,
        "createdDateTime": "2021-06-08T11:04:45Z",
        "creationOptions": [],
        "description": "My Planner Group",
        "displayName": "My Planner Group",
        "expirationDateTime": null,
        "groupTypes": [
          "Unified"
        ],
        "isAssignableToRole": null,
        "mail": "MyPlannerGroup@contoso.onmicrosoft.com",
        "mailEnabled": true,
        "mailNickname": "My Planner Group",
        "membershipRule": null,
        "membershipRuleProcessingState": null,
        "onPremisesDomainName": null,
        "onPremisesLastSyncDateTime": null,
        "onPremisesNetBiosName": null,
        "onPremisesSamAccountName": null,
        "onPremisesSecurityIdentifier": null,
        "onPremisesSyncEnabled": null,
        "preferredDataLocation": null,
        "preferredLanguage": null,
        "proxyAddresses": [
          "SPO:SPO_e13f6193-fb01-43e8-8e8d-557796b82ebf@SPO_cc6fafe9-dd93-497c-b521-1d971b1471c7",
          "SMTP:MyPlannerGroup@contoso.onmicrosoft.com"
        ],
        "renewedDateTime": "2021-06-08T11:04:45Z",
        "resourceBehaviorOptions": [],
        "resourceProvisioningOptions": [],
        "securityEnabled": false,
        "securityIdentifier": "S-1-12-1-218366702-1230083855-573552016-1076796785",
        "theme": null,
        "visibility": "Private",
        "onPremisesProvisioningErrors": []
      }
    ]
  };

  const plansInOwnerGroup: any = {
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#planner/plans",
    "@odata.count": 2,
    "value": [
      {
        "@odata.etag": "W/\"JzEtUGxhbiAgQEBAQEBAQEBAQEBAQEBASCc=\"",
        "createdDateTime": "2021-06-08T12:24:57.3312829Z",
        "owner": "f3f985d0-a4e0-4891-83f6-08d88bf44e5e",
        "title": "My Planner Plan",
        "id": "iVPMIgdku0uFlou-KLNg6MkAE1O2",
        "createdBy": {
          "user": {
            "displayName": null,
            "id": "73829066-5f0a-4745-8f72-12a17bacadea"
          },
          "application": {
            "displayName": null,
            "id": "09abbdfd-ed25-47ee-a2d9-a627aa1c90f3"
          }
        }
      },
      {
        "@odata.etag": "W/\"JzEtUGxhbiAgQEBAQEBAQEBAQEBAQEBASCc=\"",
        "createdDateTime": "2021-06-08T12:25:09.3751058Z",
        "owner": "f3f985d0-a4e0-4891-83f6-08d88bf44e5e",
        "title": "Sample Plan",
        "id": "uO1bj3fdekKuMitpeJqaj8kADBxO",
        "createdBy": {
          "user": {
            "displayName": null,
            "id": "73829066-5f0a-4745-8f72-12a17bacadea"
          },
          "application": {
            "displayName": null,
            "id": "09abbdfd-ed25-47ee-a2d9-a627aa1c90f3"
          }
        }
      }
    ]
  };

  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    auth.service.connected = true;
    auth.service.accessTokens[(command as any).resource] = {
      accessToken: 'abc',
      expiresOn: new Date()
    };
    commandInfo = Cli.getCommandInfo(command);
  });

  beforeEach(() => {
    sinon.stub(accessToken, 'isAppOnlyAccessToken').returns(false);
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/buckets` &&
        JSON.stringify(opts.data) === JSON.stringify({
          "name": "My Planner Bucket",
          "planId": "iVPMIgdku0uFlou-KLNg6MkAE1O2"
        })) {
        return Promise.resolve(bucketAddResponse);
      }
      return Promise.reject('Invalid Request');
    });
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '${encodeURIComponent('My Planner Group')}'`) {
        return Promise.resolve(groupByDisplayNameResponse);
      }
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/0d0402ee-970f-4951-90b5-2f24519d2e40/planner/plans`) {
        return Promise.resolve(plansInOwnerGroup);
      }
      return Promise.reject('Invalid Request');
    });
    log = [];
    logger = {
      log: (msg: string) => {
        log.push(msg);
      },
      logRaw: (msg: string) => {
        log.push(msg);
      },
      logToStderr: (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogSpy = sinon.spy(logger, 'log');
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.post,
      accessToken.isAppOnlyAccessToken
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent
    ]);
    auth.service.connected = false;
    auth.service.accessTokens = {};
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.BUCKET_ADD), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['id', 'name', 'planId', 'orderHint']);
  });

  it('fails validation if neither the planId nor planTitle are provided.', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when both planId and planTitle are specified', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket',
        planId: 'iVPMIgdku0uFlou-KLNg6MkAE1O2',
        planTitle: 'My Planner'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when planTitle is specified without ownerGroupId or ownerGroupName', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket',
        planTitle: 'My Planner Plan',
        orderHint: ' a!'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when planTitle is specified with both ownerGroupId and ownerGroupName', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket',
        planTitle: 'My Planner Plan',
        ownerGroupId: '0d0402ee-970f-4951-90b5-2f24519d2e40',
        ownerGroupName: 'My Planner Group',
        orderHint: ' a!'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when valid name and planId specified', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket',
        planId: 'iVPMIgdku0uFlou-KLNg6MkAE1O2'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid name, planTitle, and ownerGroupId are specified', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket',
        planTitle: 'My Planner Plan',
        ownerGroupId: '0d0402ee-970f-4951-90b5-2f24519d2e40',
        orderHint: ' a!'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid name, planTitle, and ownerGroupName are specified', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket',
        planTitle: 'My Planner Plan',
        ownerGroupName: 'My Planner Group',
        orderHint: ' a!'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if the ownerGroupId is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        name: 'My Planner Bucket',
        planTitle: 'My Planner Plan',
        ownerGroupId: 'not-c49b-4fd4-8223-28f0ac3a6402'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('correctly adds planner bucket with name and planId', async () => {
    const options: any = {
      debug: false,
      name: 'My Planner Bucket',
      planId: 'iVPMIgdku0uFlou-KLNg6MkAE1O2'
    };

    await command.action(logger, { options: options } as any);
    assert(loggerLogSpy.calledWith(bucketAddResponse));
  });

  it('correctly adds planner bucket with name, planTitle, and ownerGroupName', async () => {
    const options: any = {
      debug: false,
      name: 'My Planner Bucket',
      planTitle: 'My Planner Plan',
      ownerGroupName: 'My Planner Group'
    };

    await command.action(logger, { options: options } as any);
    assert(loggerLogSpy.calledWith(bucketAddResponse));
  });

  it('correctly adds planner bucket with name, deprecated planName, and ownerGroupId', async () => {
    const options: any = {
      debug: false,
      name: 'My Planner Bucket',
      planName: 'My Planner Plan',
      ownerGroupId: '0d0402ee-970f-4951-90b5-2f24519d2e40',
      verbose: true
    };

    await command.action(logger, { options: options } as any);
    assert(loggerLogSpy.calledWith(bucketAddResponse));
  });

  it('correctly adds planner bucket with name, planTitle, and ownerGroupId', async () => {
    const options: any = {
      debug: false,
      name: 'My Planner Bucket',
      planTitle: 'My Planner Plan',
      ownerGroupId: '0d0402ee-970f-4951-90b5-2f24519d2e40',
      verbose: true
    };

    await command.action(logger, { options: options } as any);
    assert(loggerLogSpy.calledWith(bucketAddResponse));
  });

  it('fails validation when ownerGroupName not found', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake((opts) => {
      if ((opts.url as string).indexOf('/groups?$filter=displayName') > -1) {
        return Promise.resolve({ value: [] });
      }
      return Promise.reject('Invalid request');
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: false,
        name: 'My Planner Bucket',
        planTitle: 'My Planner Plan',
        ownerGroupName: 'foo'
      }
    }), new CommandError(`The specified group 'foo' does not exist.`));
  });

  it('fails validation when using app only access token', async () => {
    sinonUtil.restore(accessToken.isAppOnlyAccessToken);
    sinon.stub(accessToken, 'isAppOnlyAccessToken').returns(true);

    await assert.rejects(command.action(logger, {
      options: {
        name: 'My Planner Bucket',
        planId: 'iVPMIgdku0uFlou-KLNg6MkAE1O2'
      }
    }), new CommandError('This command does not support application permissions.'));
  });

  it('correctly handles API OData error', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(() => {
      return Promise.reject("An error has occurred.");
    });

    await assert.rejects(command.action(logger, { options: { debug: false } }), new CommandError("An error has occurred."));
  });

  it('supports debug mode', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});