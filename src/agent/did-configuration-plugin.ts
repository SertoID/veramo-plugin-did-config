import { IAgentPlugin, IIdentifier, IMessage, VerifiableCredential } from '@veramo/core';
import fetch, { Response } from "node-fetch";
import { schema } from '../index';
import {
  IContext,
  IDidConfigurationSchema,
  IWellKnownDidConfigurationPlugin,
  IWellKnownDidConfigurationPluginArgs,
  IWellKnownDidConfigurationVerificationArgs,
  IWKDidConfigVerification,
  IWKDidConfigVerificationError
} from '../types/IWellKnownDidConfigurationPlugin';

const WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI = "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld";
const WELL_KNOWN_DID_CONFIGURATION_PATH = "/.well-known/did-configuration.json";

const ERROR_INVALID_LINKED_DID_CREDENTIAL = "Invalid linked DID credential.";
const ERROR_NO_LINKED_DID_CREDENTIAL = "No linked DID credential."

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
    // console.log(event.data);
  }

  /** {@inheritDoc IWellKnownDidConfigurationPlugin.generateDidConfiguration} */
  private async generateDidConfiguration(args: IWellKnownDidConfigurationPluginArgs, context: IContext): Promise<IDidConfigurationSchema> {
    const didConfiguration: IDidConfigurationSchema = {
      '@context': WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI,
      linked_dids: [],
    };

    for (const did of args.dids) {
      const identity: IIdentifier = await context.agent.didManagerGet({ did });

      const payload = {
        '@context': ["https://www.w3.org/2018/credentials/v1", WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI],
        type: ["VerifiableCredential", "DomainLinkageCredential"],
        issuer: { id: identity.did },
        //issuanceDate: new Date().toISOString(),
        credentialSubject: {
          "did": identity.did,
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
    const domain = removeUrlProtocol(args.domain);

    // TODO Check domain correctness
    // if (!validator.isURL(args.domain, { require_valid_protocol: false })) throw  { message: "Invalid web domain" };

    const didConfigUrl = "https://" + domain + WELL_KNOWN_DID_CONFIGURATION_PATH;
    let rawDidConfiguration: string;
    let didConfiguration: IDidConfigurationSchema;
    try {
      let content: Response = await fetch(didConfigUrl);
      rawDidConfiguration = await content.text();
      didConfiguration = <any>JSON.parse(rawDidConfiguration); // await content.json();
    } catch (error) {
      throw { message: "Failed to download the .well-known DID configuration at '" + didConfigUrl + "'. Error: " + error + "" };
    }

    if (!didConfiguration.linked_dids && !didConfiguration.entries) throw { message: "The DID configuration must contain a `linked_dids` property." };

    const dids: Set<string> = new Set();
    const errors: IWKDidConfigVerificationError[] = new Array();
    const linkedDids = didConfiguration.linked_dids || didConfiguration.entries;
    for (let vc of linkedDids) {
      try {
        let verified: VerifiableCredential;

        // Verify the VC
        if (typeof vc === "string") {
          // JWT Credential
          verified = await this.verifyJwtVc(vc, context);
        } else {
          // non-JWT Credential
          verified = await this.verifyVc(vc, context);
        }

        // Check if the linked domain matches with the domain hosting the DID configuration
        let origin = verified.credentialSubject.origin;
        origin = removeUrlProtocol(origin);
        if (origin !== domain) {
          throw new Error(`The DID ${verified.credentialSubject.id} is linked to an unexpected domain ${verified.credentialSubject.origin}, instead of ${domain}`);
        }

        // Add the verified DID to the list of the domain DIDs
        const did = verified.issuer.id || verified.credentialSubject.id;
        dids.add(<string>did);
      }
      catch (error) {
        const nestedErrors = [error.message];
        if (error.errors) nestedErrors.push(error.errors);
        errors.push({ vc: JSON.stringify(vc), errors: nestedErrors });
      }
    }

    return {
      domain,
      dids: Array.from(dids),
      errors: errors,
      didConfiguration,
      valid: true,
      rawDidConfiguration
    };
  }

  private async verifyVc(vc: VerifiableCredential, context: IContext): Promise<VerifiableCredential | PromiseLike<VerifiableCredential>> {
    const vcjs = require('vc-js'); // TODO Replace by Veramo non-JWT verification when available
    const documentLoader = async (url: string) => {
      try {
        const content: Response = await fetch(url);
        const context: string = await content.text();
        return {
          contextUrl: null,
          documentUrl: url,
          document: context
        };
      } catch (error) {
        throw new Error("Failed to download the VC context from '" + url + "': " + error);
      }
    };
    const result = await vcjs.verifyCredential({ credential: vc, suite: {}, documentLoader });
    if (!result.verified) {
      throw { message: ERROR_INVALID_LINKED_DID_CREDENTIAL, ...result.error };
    }
    return vc;
  }

  private async verifyJwtVc(jwtVc: string, context: IContext): Promise<VerifiableCredential> {
    let msg: IMessage;
    try {
      msg = await context.agent.handleMessage({ raw: jwtVc, save: false, metaData: [{ type: 'ephemeral validation' }] });

      if (!msg || !msg.credentials) throw { message: ERROR_NO_LINKED_DID_CREDENTIAL };

      const verified: VerifiableCredential = msg.credentials[0];
      return verified;
    } catch (e) {
      // Some of the VCs couldn't be verified! We should remove it from the list later.
      throw { message: ERROR_INVALID_LINKED_DID_CREDENTIAL, errors: [e] };
    }
  }
}

function removeUrlProtocol(d: string) {
  return d.replace("https://", "").replace("http://", "");
}

