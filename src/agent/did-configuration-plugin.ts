import { IAgentPlugin, IIdentifier, IMessage, VerifiableCredential } from '@veramo/core';
import { schema } from '../index';
import {
  IContext,
  IDidConfigurationSchema,
  IWellKnownDidConfigurationPlugin,
  IWellKnownDidConfigurationPluginArgs,
  IWellKnownDidConfigurationVerificationArgs,
  IWKDidConfigVerification
} from '../types/IWellKnownDidConfigurationPlugin';
import fetch, { Response } from "node-fetch";

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
    const didConfiguration: IDidConfigurationSchema = {
      '@context': WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI,
      linked_dids: []
    };

    for (const did of args.dids) {
      const identity: IIdentifier = await context.agent.didManagerGet({did});

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

      didConfiguration.linked_dids.push(vc.proof.jwt);
    }

    return didConfiguration;
  }

  /** {@inheritDoc IWellKnownDidConfigurationPlugin.verifyWellKnownDidConfiguration} */
  private async verifyWellKnownDidConfiguration(args: IWellKnownDidConfigurationVerificationArgs, context: IContext): Promise<IWKDidConfigVerification> {
    const domain = args.domain.replace("https://", "").replace("http://", "");


    // TODO Check domain correctness
    // if (!validator.isURL(args.domain, { require_valid_protocol: false })) throw  { message: "Invalid web domain" };

    const didConfigUrl = "https://" + domain + WELL_KNOWN_DID_CONFIGURATION_PATH;
    let didConfiguration: IDidConfigurationSchema;
    try {
      let content: Response = await fetch(didConfigUrl);
      didConfiguration = await content.json();
    } catch (error) {
      throw { message: "Failed to download the .well-known DID configuration at '" + didConfigUrl + "'. Error: " + error + "" };
    }

    if (!didConfiguration.linked_dids) throw { message: "The DID configuration must contain a `linked_dids` property." };

    const dids : string[] = [];

    for (let vc of didConfiguration.linked_dids) {
      // Verify the VC
      let credential: string;
      if (typeof vc === "string") {
        credential = vc;
      } else {
        //ignore non-jwt credential types since daf can't handle them now
        continue;
      }
      let msg: IMessage;
      try {
        msg = await context.agent.handleMessage({ raw: credential, save: false, metaData: [{ type: 'ephemeral validation' }] });
        if (!msg) continue;
      } catch (e) {
        // Some of the VCs couldn't be verified! We should remove it from the list later.
        throw { message: "Invalid VC (" + e + ") in the DID configuration: " + credential };
      }

      if (!msg.credentials) throw { message: "No linked domain found on VC: " + credential };

      let verified: VerifiableCredential = msg.credentials[0];

      // Check if the linked domain matches with the domain hosting the DID configuration
      if (verified.credentialSubject.origin !== domain) {
        throw { message: `The DID ${verified.credentialSubject.id} is linked to an unexpected domain ${verified.credentialSubject.origin}, instead of ${domain}`};
      }

      dids.push(<string> verified.credentialSubject.id);
    }

    return {
      domain,
      dids,
      didConfiguration,
      valid: true,
    };
  }
}

