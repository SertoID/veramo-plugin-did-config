import { TKeyType, IKey, EcdsaSignature } from 'daf-core'
import { AbstractKeyManagementSystem } from 'daf-key-manager'

/**
 * @alpha
 */
export class KeyManagementSystem extends AbstractKeyManagementSystem {

  async createKey({ type }: { type: TKeyType }): Promise<Omit<IKey, 'kms'>> {
    let key: Omit<IKey, 'kms'>

    switch (type) {
      case 'Ed25519':
        throw Error('KeyManagementSystem createKey Ed25519 not implemented')
        break
      case 'Secp256k1':
        throw Error('KeyManagementSystem createKey Secp256k1 not implemented')
        break
      default:
        throw Error('Key type not supported: ' + type)
    }

    return key
  }

  async deleteKey(args: { kid: string }) {
    throw Error('KeyManagementSystem deleteKey not implemented')
    return true
  }

  async encryptJWE({ key, to, data }: { key: IKey; to: IKey; data: string }): Promise<string> {
    throw Error('KeyManagementSystem encryptJWE not implemented')
  }

  async decryptJWE({ key, data }: { key: IKey; data: string }): Promise<string> {
    throw Error('KeyManagementSystem decryptJWE not implemented')
  }

  async signEthTX({ key, transaction }: { key: IKey; transaction: object }): Promise<string> {
    throw Error('KeyManagementSystem signEthTX not implemented')
  }

  async signJWT({ key, data }: { key: IKey; data: string }): Promise<EcdsaSignature> {
    throw Error('KeyManagementSystem signJWT not implemented')
  }
}
