import { IAgentPlugin, VerifiableCredential, W3CCredential } from 'daf-core'
import { IWellKnownDidConfigurationPlugin, IWellKnownDidConfigurationPluginArgs, IContext } from '../types/IWellKnownDidConfigurationPlugin'
import { schema } from '../index'

/** 
 * {@inheritDoc IWellKnownDidConfigurationPlugin}
 * @beta
 */
export class DIDConfigurationPlugin implements IAgentPlugin {
  
  readonly schema = schema.IMyAgentPlugin

  readonly eventTypes = ['validatedMessage']
  
  readonly methods: IWellKnownDidConfigurationPlugin = {
    generateDidConfiguration: this.generateDidConfiguration.bind(this)
  }

  public async onEvent(event: { type: string; data: any }, context: IContext) {
    console.log(event.data)
  }

  /** {@inheritDoc IWellKnownDidConfigurationPlugin.generateDidConfiguration} */
  private async generateDidConfiguration(args: IWellKnownDidConfigurationPluginArgs, context: IContext): Promise<string> {
    const didDoc = await context.agent.resolveDid({ didUrl: args.did })
    console.log(didDoc)
  
    const didConfiguration = {
      '@context': "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
      linked_dids : []
    };
  
    args.dids.forEach(element => {
      // TODO Generate a VC using DomainLinkageCredential schema
      let vc : VerifiableCredential; // TODO How to sign a VC using a DID from this agent?
      
      // didConfiguration.linked_dids.push(vc);
    });
    
    return JSON.stringify(didConfiguration);
  }
}