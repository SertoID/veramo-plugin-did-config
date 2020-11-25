import { IPluginMethodMap, IAgentContext, IIdentityManager, IResolver} from 'daf-core'

/**
 * Plugin context
 * @beta
 */
export type IContext = IAgentContext<IResolver & IIdentityManager>

/**
 * Arguments needed for myPluginFoo
 * @beta
 */
export interface IMyAgentPluginFooArgs {

  /**
   * Decentralized identifier
   */
  did: string

  /**
   * Lorem ipsum
   */
  bar: string

  /**
   * Dolorem
   */
  foo: string
}

/**
 * My Agent Plugin description
 * @beta
 */
export interface IMyAgentPlugin extends IPluginMethodMap {
  /**
   * Method description
   * 
   * @param args - Input parameters
   * @param context - Context
   */
  myPluginFoo(
    args: IMyAgentPluginFooArgs,
    context: IContext,
  ): Promise<string>
}
