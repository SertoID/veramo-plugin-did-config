import { IAgentPlugin, IIdentity, VerifiableCredential, W3CCredential } from 'daf-core'
import { IWellKnownDidConfigurationPlugin, IWellKnownDidConfigurationPluginArgs, IContext } from '../types/IWellKnownDidConfigurationPlugin'
import { schema } from '../index'

/** 
 * {@inheritDoc IWellKnownDidConfigurationPlugin}
 * @beta
 */
export class DIDConfigurationPlugin implements IAgentPlugin {

  readonly schema = schema.IWellKnownDidConfigurationPlugin

  readonly eventTypes = ['validatedMessage']

  readonly methods: IWellKnownDidConfigurationPlugin = {
    generateDidConfiguration: this.generateDidConfiguration.bind(this)
  }

  public async onEvent(event: { type: string; data: any }, context: IContext) {
    console.log(event.data)
  }

  /** {@inheritDoc IWellKnownDidConfigurationPlugin.generateDidConfiguration} */
  private async generateDidConfiguration(args: IWellKnownDidConfigurationPluginArgs, context: IContext): Promise<string> {
    const didConfiguration = {
      '@context': "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
      linked_dids: new Array<VerifiableCredential>()
    };

    args.dids.forEach(async did => {
      const identity: IIdentity = await context.agent.identityManagerGetIdentity({ did: did });
      
      const payload = {
        '@context': ["https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld"],
        type: ["VerifiableCredential", "DomainLinkageCredential"],
        issuer: {
          id: identity.did
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: identity.did,
          origin: args.domain
        }
      }

      const vc: VerifiableCredential = await context.agent.createVerifiableCredential({
        credential: payload,
        proofFormat: 'jwt'
      });

      didConfiguration.linked_dids.push(vc);
    });

    return JSON.stringify(didConfiguration);
  }
}