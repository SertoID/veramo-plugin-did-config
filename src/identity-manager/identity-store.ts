import { IIdentity } from 'daf-core'
import { AbstractIdentityStore } from 'daf-identity-manager'

/**
 * @alpha
 */
export class IdentityStore extends AbstractIdentityStore {
  async get({ did, alias, provider }: { did: string; alias: string; provider: string }): Promise<IIdentity> {
    throw Error('IdentityStore get not implemented')
  }

  async delete({ did }: { did: string }) {
    throw Error('IdentityStore delete not implemented')
    return true
  }

  async import(args: IIdentity) {
    throw Error('IdentityStore import not implemented')
    return true
  }

  async list(args: { alias?: string; provider?: string }): Promise<IIdentity[]> {
    throw Error('IdentityStore list not implemented')
  }
}
