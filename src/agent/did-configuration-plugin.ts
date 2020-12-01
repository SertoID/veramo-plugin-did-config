import { IAgentPlugin, IIdentity, VerifiableCredential, W3CCredential } from 'daf-core'
import { IWellKnownDidConfigurationPlugin, IWellKnownDidConfigurationPluginArgs, IContext, IDidConfigurationSchema, WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI } from '../types/IWellKnownDidConfigurationPlugin'
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
  private async generateDidConfiguration(args: IWellKnownDidConfigurationPluginArgs, context: IContext): Promise<IDidConfigurationSchema> {
    const didConfiguration = {
      '@context': WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI,
      linked_dids: new Array<VerifiableCredential>()
    };

    for (const did of args.dids) {
      const identity: IIdentity = await context.agent.identityManagerGetIdentity({ did: did });

      const payload = {
        '@context': ["https://www.w3.org/2018/credentials/v1", WELL_KNOWN_DID_CONFIGURATION_SCHEMA_URI],
        type: ["VerifiableCredential", "DomainLinkageCredential"],
        issuer: { id: identity.did },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: identity.did,
          origin: args.domain
        }
      };

      const vc: VerifiableCredential = await context.agent.createVerifiableCredential({
        credential: payload,
        proofFormat: 'jwt'
      });

      didConfiguration.linked_dids.push(vc);
    }

    return didConfiguration;
  }
}