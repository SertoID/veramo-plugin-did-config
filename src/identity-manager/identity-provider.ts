import { IIdentity, IKey, IService, IAgentContext, IKeyManager } from 'daf-core'
import { AbstractIdentityProvider } from 'daf-identity-manager'

type IContext = IAgentContext<IKeyManager>

/**
 * @alpha
 */
export class IdentityProvider extends AbstractIdentityProvider {
  private defaultKms: string

  constructor(options: { defaultKms: string }) {
    super()
    this.defaultKms = options.defaultKms
  }

  async createIdentity(
    { kms, alias }: { kms?: string; alias?: string },
    context: IContext,
  ): Promise<Omit<IIdentity, 'provider'>> {
    throw Error('IdentityProvider createIdentity not implemented')
  }

  async deleteIdentity(identity: IIdentity, context: IContext): Promise<boolean> {
    throw Error('IdentityProvider deleteIdentity not implemented')
    return true
  }

  async addKey(
    { identity, key, options }: { identity: IIdentity; key: IKey; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('IdentityProvider addKey not implemented')
    return { success: true }
  }

  async addService(
    { identity, service, options }: { identity: IIdentity; service: IService; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('IdentityProvider addService not implemented')
    return { success: true }
  }

  async removeKey(
    args: { identity: IIdentity; kid: string; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('IdentityProvider removeKey not implemented')
    return { success: true }
  }

  async removeService(
    args: { identity: IIdentity; id: string; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('IdentityProvider removeService not implemented')
    return { success: true }
  }
}
