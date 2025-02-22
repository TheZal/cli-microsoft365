import * as assert from 'assert';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import config from '../../../../config';
import request from '../../../../request';
import { sinonUtil } from '../../../../utils/sinonUtil';
import { spo } from '../../../../utils/spo';
import commands from '../../commands';
const command: Command = require('./orgassetslibrary-remove');

describe(commands.ORGASSETSLIBRARY_REMOVE, () => {
  let log: any[];
  let logger: Logger;
  let promptOptions: any;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    sinon.stub(spo, 'getRequestDigest').callsFake(() => Promise.resolve({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    }));
    auth.service.connected = true;
    auth.service.spoUrl = 'https://contoso.sharepoint.com';
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
    sinon.stub(Cli, 'prompt').callsFake(async (options: any) => {
      promptOptions = options;
      return { continue: false };
    });
    promptOptions = undefined;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      Cli.prompt
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent,
      spo.getRequestDigest
    ]);
    auth.service.connected = false;
    auth.service.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.ORGASSETSLIBRARY_REMOVE), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('prompts before removing the Org Assets Library when confirm option is not passed', async () => {
    await command.action(logger, { options: { debug: true } } as any);
    
    let promptIssued = false;

    if (promptOptions && promptOptions.type === 'confirm') {
      promptIssued = true;
    }
    assert(promptIssued);
  });

  it('aborts removing the Org Assets Library when confirm option is not passed and prompt not confirmed', async () => {
    const postSpy = sinon.spy(request, 'post');

    sinonUtil.restore(Cli.prompt);
    sinon.stub(Cli, 'prompt').callsFake(async () => (
      { continue: false }
    ));

    await command.action(logger, { options: {} });
    assert(postSpy.notCalled);
  });

  it('removes the Org Assets Library when prompt confirmed', async () => {
    let orgAssetLibRemoveCallIssued = false;

    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="9" ObjectPathId="8" /><Method Name="RemoveFromOrgAssets" Id="10" ObjectPathId="8"><Parameters><Parameter Type="String">/sites/branding/assets</Parameter><Parameter Type="Guid">{00000000-0000-0000-0000-000000000000}</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="8" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {

        orgAssetLibRemoveCallIssued = true;

        return Promise.resolve(JSON.stringify(
          [
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.19520.12061", "ErrorInfo": null, "TraceCorrelationId": "f4e1279f-100c-9000-7ea4-40fa74757476"
            }, 9, {
              "IsNull": false
            }
          ]
        ));
      }

      return Promise.reject('Invalid request');
    });

    sinonUtil.restore(Cli.prompt);
    sinon.stub(Cli, 'prompt').callsFake(async () => (
      { continue: true }
    ));
    await command.action(logger, { options: { libraryUrl: '/sites/branding/assets' } });
    assert(orgAssetLibRemoveCallIssued);
  });

  it('removes the Org Assets Library without confirm prompt', async () => {
    let orgAssetLibRemoveCallIssued = false;

    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="9" ObjectPathId="8" /><Method Name="RemoveFromOrgAssets" Id="10" ObjectPathId="8"><Parameters><Parameter Type="String">/sites/branding/assets</Parameter><Parameter Type="Guid">{00000000-0000-0000-0000-000000000000}</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="8" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {

        orgAssetLibRemoveCallIssued = true;

        return Promise.resolve(JSON.stringify(
          [
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.19520.12061", "ErrorInfo": null, "TraceCorrelationId": "f4e1279f-100c-9000-7ea4-40fa74757476"
            }, 9, {
              "IsNull": false
            }
          ]
        ));
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { libraryUrl: '/sites/branding/assets', confirm: true } });
    assert(orgAssetLibRemoveCallIssued);
  });

  it('removes the Org Assets Library when prompt confirmed and output set to JSON', async () => {
    let orgAssetLibRemoveCallIssued = false;

    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="9" ObjectPathId="8" /><Method Name="RemoveFromOrgAssets" Id="10" ObjectPathId="8"><Parameters><Parameter Type="String">/sites/branding/assets</Parameter><Parameter Type="Guid">{00000000-0000-0000-0000-000000000000}</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="8" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {

        orgAssetLibRemoveCallIssued = true;

        return Promise.resolve(JSON.stringify(
          [
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.19520.12061", "ErrorInfo": null, "TraceCorrelationId": "f4e1279f-100c-9000-7ea4-40fa74757476"
            }, 9, {
              "IsNull": false
            }
          ]
        ));
      }

      return Promise.reject('Invalid request');
    });

    sinonUtil.restore(Cli.prompt);
    sinon.stub(Cli, 'prompt').callsFake(async () => (
      { continue: true }
    ));
    await command.action(logger, { options: { libraryUrl: '/sites/branding/assets', output: 'json' } });
    assert(orgAssetLibRemoveCallIssued);
  });

  it('correctly handles error when removing a non-existing Org Asset Library', async () => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="9" ObjectPathId="8" /><Method Name="RemoveFromOrgAssets" Id="10" ObjectPathId="8"><Parameters><Parameter Type="String">/sites/branding/assets</Parameter><Parameter Type="Guid">{00000000-0000-0000-0000-000000000000}</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="8" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {

        return Promise.resolve(JSON.stringify(
          [
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.19520.12061", "ErrorInfo": {
                "ErrorMessage": "Run Add-SPOOrgAssetsLibrary first to set up the organization assets library feature for your organization.", "ErrorValue": null, "TraceCorrelationId": "5fe2279f-40d7-9000-7e58-51033180e44d", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
              }, "TraceCorrelationId": "5fe2279f-40d7-9000-7e58-51033180e44d"
            }
          ]
        ));
      }

      return Promise.reject('Invalid request');
    });

    await assert.rejects(command.action(logger, { options: { libraryUrl: '/sites/branding/assets', debug: true, confirm: true } } as any), 
      new CommandError(`Run Add-SPOOrgAssetsLibrary first to set up the organization assets library feature for your organization.`));
  });

  it('correctly handles random API error', async () => {
    sinon.stub(request, 'post').callsFake(() => Promise.reject('An error has occurred'));

    await assert.rejects(command.action(logger, {
      options: {
        confirm: true
      }
    } as any), new CommandError(`An error has occurred`));
  });

  it('supports debug mode', () => {
    const options = command.options;
    let containsDebugOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsDebugOption = true;
      }
    });
    assert(containsDebugOption);
  });
});
