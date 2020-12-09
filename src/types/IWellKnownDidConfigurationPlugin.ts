import { IPluginMethodMap, IAgentContext, IIdentityManager, IResolver, VerifiableCredential, IMessageHandler } from 'daf-core'
import { ICredentialIssuer } from 'daf-w3c'

/**
 * Plugin context
 * @beta
 */
export type IContext = IAgentContext<IResolver & IIdentityManager & ICredentialIssuer & IMessageHandler>

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
  '@context': string,

  /**
   * The list of VCs linking 
   */
  linked_dids: VerifiableCredentialOrJwt[],
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
  ): Promise<IDidConfigurationSchema>
}
