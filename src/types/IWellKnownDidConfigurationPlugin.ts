import { IPluginMethodMap, IAgentContext, IIdentityManager, IResolver } from 'daf-core'

/**
 * Plugin context
 * @beta
 */
export type IContext = IAgentContext<IResolver & IIdentityManager>

/**
 * Arguments needed for myPluginFoo
 * @beta
 */
export interface IWellKnownDIDConfigurationPluginArgs {
  /**
   * Decentralized identifier
   */
  did: string, // TODO Is it required for some reason?

  /**
   * List of DIDs to be included in the DID configuration file
   */
  dids: string[],

  /**
   * The domain name that controlls the DIDs
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
   * @returns The DID configuration file to be used in the .well-known DID configuration
   */
  generateDidConfiguration(
    args: IWellKnownDIDConfigurationPluginArgs,
    context: IContext,
  ): Promise<string> // TODO How to return a file? Or... KISS! Return the file content as a string.
}
