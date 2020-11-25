import { AbstractSecretBox } from 'daf-key-manager'

/**
 * @alpha
 */
export class SecretBox extends AbstractSecretBox {
  constructor(private secretKey: string) {
    super()
    if (!secretKey) {
      throw Error('Secret key is required')
    }
  }

  async encrypt(message: string): Promise<string> {
    throw Error('SecretBox encrypt not implemented')
  }

  async decrypt(encryptedMessageHex: string): Promise<string> {
    throw Error('SecretBox decrypt not implemented')
  }
}
