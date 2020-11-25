import { IKey } from 'daf-core'
import { AbstractKeyStore } from 'daf-key-manager'

/**
 * @alpha
 */
export class KeyStore extends AbstractKeyStore {
  async get({ kid }: { kid: string }): Promise<IKey> {
    throw Error('KeyStore get not implemented')
  }

  async delete({ kid }: { kid: string }) {
    throw Error('KeyStore delete not implemented')
    return true
  }

  async import(args: IKey) {
    throw Error('KeyStore import not implemented')
    return true
  }
}
