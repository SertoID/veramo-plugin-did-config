import { IAgentContext, IDIDManager, IMessageHandler, IPluginMethodMap, VerifiableCredential } from '@veramo/core';
import { ICredentialIssuer } from '@veramo/credential-w3c';

/**
 * This is the context expected to be installed on the agent where this plugin is used.
 * @beta
 */
export type IContext = IAgentContext<IDIDManager & ICredentialIssuer & IMessageHandler>

/**
 * The arguments for the .well-known DID configuration plugin.
 * @beta
 */
export interface IWellKnownDidConfigurationPluginArgs {
  /**
   * List of DIDs to be included in the DID configuration file. Each DID needs to be managed by this agent.
   */
  dids: string[],

  /**
   * The domain name linked to the DIDs.
   */
  domain: string,
}

/**
 * @beta
 */
export type VerifiableCredentialOrJwt = VerifiableCredential | string;

/**
 * The `DID configuration`
 * @beta
 */
export interface IDidConfigurationSchema {
  /**
   * https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld
   */
  '@context': string;

  /**
   * The list of VCs linking 
   */
  linked_dids: VerifiableCredentialOrJwt[];

  /**
   * Legacy support. 
   * @see linked_dids
   * @deprecated 
   */
  entries?: VerifiableCredentialOrJwt[]; // Legacy support
}

/**
 * The DID configuration can contain DIDs which methods are not resolved yet or VCs 
 * not following the well-known DID configuration specification. In those cases this
 * object is returned with details about the verification process.
 */
export interface IWKDidConfigVerificationError {
  /**
   * The VC that failed in the verification.
   */
  vc: string,

  /**
   * Reason for the verification error. Detailed error messages.
   */
  errors: string[]
}

/**
 * Well Known DID Configuration verification response
 * @beta
 */
export interface IWKDidConfigVerification {
  /**
   * The domain used in the verification
   */
  domain: string,

  /**
   * The DIDs in the DID configuration
   */
  dids: string[],

  /**
   * Possible failures during the verification of each VC in the DID configuration.
   */
  errors: IWKDidConfigVerificationError[],

  /**
   * The DID configuration
   */
  didConfiguration: IDidConfigurationSchema,

  /**
   * Validity of the DID configuration 
   */
  valid: boolean,
}

/**
 * The arguments to verify the .well-known DID configuration from a web domain.
 * @beta
 */
export interface IWellKnownDidConfigurationVerificationArgs {
  /**
   * The web domain name which will be used to retrieve the .well-know DID configuration. 
   */
  domain: string,
}

/**
 * .well-known DID configuration Plugin
 * 
 * These are the agent methods provided by this plugin to the agent where it is installed.
  * @beta
 */
export interface IWellKnownDidConfigurationPlugin extends IPluginMethodMap {
  /**
   * Generates a DID configuration for a domain including a list of DID "owned" by the DID agent.
   * 
   * @param args - List of DIDs to be included in the .well-known DID configuration file
   * @param context - Context
   * @returns - The DID configuration.
   */
  generateDidConfiguration(
    args: IWellKnownDidConfigurationPluginArgs,
    context: IContext,
  ): Promise<IDidConfigurationSchema>

  /**
   * 
   * @param args - The domain name
   * @param context - Context
   * @returns The verified DID configuration (linked domains checked and VCs signatures verified).
   */
  verifyWellKnownDidConfiguration(
    args: IWellKnownDidConfigurationVerificationArgs,
    context: IContext,
  ): Promise<IWKDidConfigVerification>
}
