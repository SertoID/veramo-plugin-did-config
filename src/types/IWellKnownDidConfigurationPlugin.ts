import { IPluginMethodMap, IAgentContext, IIdentityManager, IResolver, VerifiableCredential } from 'daf-core'
import { ICredentialIssuer } from 'daf-w3c'

/**
 * Plugin context
 * @beta
 */
export type IContext = IAgentContext<IResolver & IIdentityManager & ICredentialIssuer>

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
 * The `DID configuration` schema.
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
  linked_dids: VerifiableCredential[],
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
   * @returns The DID configuration
   */
  generateDidConfiguration(
    args: IWellKnownDidConfigurationPluginArgs,
    context: IContext,
  ): Promise<IDidConfigurationSchema>
}
