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
const command: Command = require('./sitedesign-apply');

describe(commands.SITEDESIGN_APPLY, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => {});
    auth.service.connected = true;
    auth.service.spoUrl = 'https://contoso.sharepoint.com';
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
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent
    ]);
    auth.service.connected = false;
    auth.service.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.SITEDESIGN_APPLY), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('applies site design', async () => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if ((opts.url as string).indexOf(`/_api/Microsoft.Sharepoint.Utilities.WebTemplateExtensions.SiteScriptUtility.ApplySiteDesign`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          siteDesignId: '9b142c22-037f-4a7f-9017-e9d8c0e34b98',
          webUrl: 'https://contoso.sharepoint.com'
        })) {
        return Promise.resolve({
          value: [{ "Outcome": "1", "OutcomeText": "One or more of the properties on this action has an invalid type.", "Title": "Add to hub site" }, { "Outcome": "0", "OutcomeText": null, "Title": "Associate SPFX extension Collab Footer" }]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        debug: false,
        id: '9b142c22-037f-4a7f-9017-e9d8c0e34b98',
        webUrl: 'https://contoso.sharepoint.com'
      }
    });
    assert(loggerLogSpy.calledWith([{ "Outcome": "1", "OutcomeText": "One or more of the properties on this action has an invalid type.", "Title": "Add to hub site" }, { "Outcome": "0", "OutcomeText": null, "Title": "Associate SPFX extension Collab Footer" }]));
  });

  it('applies site design (debug)', async () => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if ((opts.url as string).indexOf(`/_api/Microsoft.Sharepoint.Utilities.WebTemplateExtensions.SiteScriptUtility.ApplySiteDesign`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          siteDesignId: '9b142c22-037f-4a7f-9017-e9d8c0e34b98',
          webUrl: 'https://contoso.sharepoint.com'
        })) {
        return Promise.resolve({
          value: [{ "Outcome": "1", "OutcomeText": "One or more of the properties on this action has an invalid type.", "Title": "Add to hub site" }, { "Outcome": "0", "OutcomeText": null, "Title": "Associate SPFX extension Collab Footer" }]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        debug: true,
        id: '9b142c22-037f-4a7f-9017-e9d8c0e34b98',
        webUrl: 'https://contoso.sharepoint.com'
      }
    });
    assert(loggerLogSpy.calledWith([{ "Outcome": "1", "OutcomeText": "One or more of the properties on this action has an invalid type.", "Title": "Add to hub site" }, { "Outcome": "0", "OutcomeText": null, "Title": "Associate SPFX extension Collab Footer" }]));
  });

  it('applies site design as task', async () => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if ((opts.url as string).indexOf(`/_api/Microsoft.Sharepoint.Utilities.WebTemplateExtensions.SiteScriptUtility.AddSiteDesignTask`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          siteDesignId: '9b142c22-037f-4a7f-9017-e9d8c0e34b98',
          webUrl: 'https://contoso.sharepoint.com'
        })) {
        return Promise.resolve({ "ID": "4bfe70f8-f806-479c-9bf3-ffb2167b9ff5", "LogonName": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "SiteDesignID": "6ec3ca5b-d04b-4381-b169-61378556d76e", "SiteID": "24cea241-ad89-44b8-8669-d60d88d38575", "WebID": "e87e4ab8-2732-4a90-836d-9b3d0cd3a5cf" });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        debug: false,
        id: '9b142c22-037f-4a7f-9017-e9d8c0e34b98',
        webUrl: 'https://contoso.sharepoint.com',
        asTask: true
      }
    });
    assert(loggerLogSpy.calledWith({ "ID": "4bfe70f8-f806-479c-9bf3-ffb2167b9ff5", "LogonName": "i:0#.f|membership|admin@contoso.onmicrosoft.com", "SiteDesignID": "6ec3ca5b-d04b-4381-b169-61378556d76e", "SiteID": "24cea241-ad89-44b8-8669-d60d88d38575", "WebID": "e87e4ab8-2732-4a90-836d-9b3d0cd3a5cf" }));
  });

  it('correctly handles OData error when applying site design', async () => {
    sinon.stub(request, 'post').callsFake(() => {
      return Promise.reject({ error: { 'odata.error': { message: { value: 'An error has occurred' } } } });
    });

    await assert.rejects(command.action(logger, { options: {
      debug: false,
      id: '9b142c22-037f-4a7f-9017-e9d8c0e34b98',
      webUrl: 'https://contoso.sharepoint.com' } } as any), new CommandError('An error has occurred'));
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

  it('supports specifying id', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--id') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying webUrl', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--webUrl') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('fails validation if id is not a valid GUID', async () => {
    const actual = await command.validate({ options: { id: 'Invalid', webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passed validation if id is a valid GUID', async () => {
    const actual = await command.validate({ options: { id: '9b142c22-037f-4a7f-9017-e9d8c0e34b99', webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
  
  it('fails validation if webUrl is not a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { id: '9b142c22-037f-4a7f-9017-e9d8c0e34b99', webUrl: 'Invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passed validation if webUrl is a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { id: '9b142c22-037f-4a7f-9017-e9d8c0e34b99', webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});