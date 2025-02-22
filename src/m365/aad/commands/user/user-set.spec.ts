import * as assert from 'assert';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import request from '../../../../request';
import { sinonUtil } from '../../../../utils/sinonUtil';
import commands from '../../commands';
const command: Command = require('./user-set');

describe(commands.USER_SET, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    auth.service.connected = true;
    commandInfo = Cli.getCommandInfo(command);
  });

  beforeEach(() => {
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
      request.patch
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent
    ]);
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.USER_SET), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if neither the objectId nor the userPrincipalName are specified', async () => {
    const actual = await command.validate({ options: {} }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both the objectId and the userPrincipalName are specified', async () => {
    const actual = await command.validate({ options: { objectId: '1caf7dcd-7e83-4c3a-94f7-932a1299c844', userPrincipalName: 'steve@contoso.onmicrosoft.com' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the objectId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { objectId: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the objectId is a valid GUID', async () => {
    const actual = await command.validate({ options: { objectId: '1caf7dcd-7e83-4c3a-94f7-932a1299c844' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('allows unknown properties', () => {
    const allowUnknownOptions = command.allowUnknownOptions();
    assert.strictEqual(allowUnknownOptions, true);
  });

  it('correctly handles user or property not found', async () => {
    sinon.stub(request, 'patch').callsFake(() => {
      return Promise.reject({
        "error": {
          "code": "Request_ResourceNotFound",
          "message": "Resource '1caf7dcd-7e83-4c3a-94f7-932a1299c844' does not exist or one of its queried reference-property objects are not present.",
          "innerError": {
            "request-id": "9b0df954-93b5-4de9-8b99-43c204a8aaf8",
            "date": "2018-04-24T18:56:48"
          }
        }
      });
    });

    await assert.rejects(command.action(logger, { options: { debug: false, objectId: '1caf7dcd-7e83-4c3a-94f7-932a1299c844', NonExistingProperty: 'Value' } } as any),
      new CommandError(`Resource '1caf7dcd-7e83-4c3a-94f7-932a1299c844' does not exist or one of its queried reference-property objects are not present.`));
  });

  it('correctly updates information about the specified user', async () => {    
    sinon.stub(request, 'patch').callsFake((opts) => {
      if ((opts.url as string).indexOf(`/v1.0/users/`) > -1) {
        return Promise.resolve({});
      }
      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        debug: false,
        objectId: '1caf7dcd-7e83-4c3a-94f7-932a1299c844',
        Department: 'Sales & Marketing',
        CompanyName: 'Contoso'
      }
    } as any);
    assert(loggerLogSpy.notCalled);
  });

  it('correctly enables the specified user', async () => {    
    sinon.stub(request, 'patch').callsFake((opts) => {
      if ((opts.url as string).indexOf(`/v1.0/users/`) > -1) {
        return Promise.resolve({});
      }
      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        debug: false,
        userPrincipalName: 'steve@contoso.onmicrosoft.com',
        accountEnabled: true
      }
    } as any);
    assert(loggerLogSpy.notCalled);
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