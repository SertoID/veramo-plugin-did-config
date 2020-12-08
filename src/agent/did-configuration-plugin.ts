import { IAgentPlugin, IIdentity, IMessage, VerifiableCredential } from 'daf-core';
import request from 'request';
import { schema } from '../index';
import {
  IContext,
  IDidConfigurationSchema,
  IWellKnownDidConfigurationPlugin,
  IWellKnownDidConfigurationPluginArgs,
  IWellKnownDidConfigurationVerificationArgs
} from '../types/IWellKnownDidConfigurationPlugin';


const WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI = "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld";
const WELL_KNOWN_DID_CONFIGURATION_PATH = "/.well-known/did-configuration.json";

/** 
 * {@inheritDoc IWellKnownDidConfigurationPlugin}
 * @beta
 */
export class DIDConfigurationPlugin implements IAgentPlugin {

  readonly schema = schema.IWellKnownDidConfigurationPlugin

  readonly eventTypes = ['validatedMessage']

  readonly methods: IWellKnownDidConfigurationPlugin = {
    generateDidConfiguration: this.generateDidConfiguration.bind(this),
    verifyWellKnownDidConfiguration: this.verifyWellKnownDidConfiguration.bind(this)
  }

  public async onEvent(event: { type: string; data: any }, context: IContext) {
    console.log(event.data)
  }

  /** {@inheritDoc IWellKnownDidConfigurationPlugin.generateDidConfiguration} */
  private async generateDidConfiguration(args: IWellKnownDidConfigurationPluginArgs, context: IContext): Promise<IDidConfigurationSchema> {
    const didConfiguration : IDidConfigurationSchema = {
      '@context': WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI,
      linked_dids: []
    };

    for (const did of args.dids) {
      const identity: IIdentity = await context.agent.identityManagerGetIdentity({ did: did });

      const payload = {
        '@context': ["https://www.w3.org/2018/credentials/v1", WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI],
        type: ["VerifiableCredential", "DomainLinkageCredential"],
        issuer: { id: identity.did },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: identity.did,
          origin: args.domain
        }
      };

      const vc: VerifiableCredential = await context.agent.createVerifiableCredential({
        credential: payload,
        proofFormat: 'jwt'
      });

      didConfiguration.linked_dids.push(JSON.stringify(vc));
    }

    return didConfiguration;
  }

  /** {@inheritDoc IWellKnownDidConfigurationPlugin.verifyWellKnownDidConfiguration} */
  private async verifyWellKnownDidConfiguration(args: IWellKnownDidConfigurationVerificationArgs, context: IContext): Promise<IDidConfigurationSchema> {
    const domain = args.domain.replace("https://", "").replace("http://", "");

    // Check domain correctnes
    // if (!validator.isURL(args.domain, { require_valid_protocol: false })) throw "Invalid web domain";

    const didConfigUrl = "https://" + domain + WELL_KNOWN_DID_CONFIGURATION_PATH;
    let didConfiguration: IDidConfigurationSchema;
    try {
      let content : Response = await fetch(didConfigUrl);
      // let content: string = await download(didConfigUrl); // TODO Replace with "fetch"?
      didConfiguration = await content.json();
    } catch (error) {
      throw "Failed to download the .well-known DID configuration at '" + didConfigUrl + "'. Error: " + error + "";
    }

    if (!didConfiguration.linked_dids) throw "The DID configuration must contain a `linked_dids` property.";

    for (let vc of didConfiguration.linked_dids) {
      // Check the VC signature
      let msg: IMessage;
      try {
        msg = await context.agent.handleMessage({ raw: vc, save: false, metaData: [{ type: 'ephemeral validation' }] });
        if (!msg) continue;
      } catch (e) {
        didConfiguration.linked_dids = didConfiguration.linked_dids.filter((value, index, err) => value != vc);
        continue;
      }

      if (!msg.credentials) throw "No linked domain found.";

      let verified: VerifiableCredential = msg.credentials[0];

      // Check if the linked domain matches with the domain hosting the DID configuration
      if (verified.credentialSubject.origin !== domain) throw "The DID '" + verified.credentialSubject.id + "' is linked to an unexpected domain: " + verified.credentialSubject.origin;
    }

    return didConfiguration;
  }
}


const download = (url: string) => {
  return new Promise<string>((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) reject(error);
      if (response.statusCode != 200) {
        reject('Invalid status code <' + response.statusCode + '>');
      }
      resolve(body);
    });
  });
};

const verifyVerifiableCredential = (vc: VerifiableCredential) => {

};
