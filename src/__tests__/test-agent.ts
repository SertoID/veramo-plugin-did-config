import { createAgent, IDataStore, IDIDManager, IMessageHandler, IResolver } from "@veramo/core";
import { CredentialIssuer, W3cMessageHandler } from "@veramo/credential-w3c";
import { ICredentialIssuer } from "@veramo/credential-w3c/src";
import { DataStore, DIDStore, Entities, KeyStore } from "@veramo/data-store";
import { JwtMessageHandler } from "@veramo/did-jwt";
import { DIDManager } from "@veramo/did-manager";
import { EthrDIDProvider } from "@veramo/did-provider-ethr";
import { KeyDIDProvider } from "@veramo/did-provider-key";
import { WebDIDProvider } from "@veramo/did-provider-web";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { getUniversalResolverFor } from "@veramo/did-resolver/build/universal-resolver";
import { KeyManager } from "@veramo/key-manager";
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local";
import { MessageHandler } from "@veramo/message-handler";
import { Resolver } from "did-resolver";
import { getResolver as getEthrResolver } from 'ethr-did-resolver';
import { createConnection } from 'typeorm';
import { getResolver as webDidResolver } from 'web-did-resolver';
import {
  DIDConfigurationPlugin,
  IWellKnownDidConfigurationPlugin
} from "../index";

const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c';

const dbConnection = createConnection({
  type: 'sqlite',
  database: "/tmp/did-config-test" + (Math.random() * 1000),
  synchronize: true,
  logging: false,
  entities: Entities,
});

const providerConfig = {
  networks: [
    { name: 'rinkeby', rpcUrl: 'https://rinkeby.infura.io/v3/6b734e0b04454df8a6ce234023c04f26' },
    { name: 'mainnet', rpcUrl: 'https://mainnet.infura.io/v3/6b734e0b04454df8a6ce234023c04f26' },
  ],
}

const kms = {
  local: new KeyManagementSystem(),
};

const ethrProvider = new EthrDIDProvider({
  defaultKms: 'local',
  network: 'rinkeby',
  rpcUrl: 'https://rinkeby.infura.io/v3/',
  gas: 1000001,
  ttl: 60 * 60 * 24 * 30 * 12 + 1,
});

const ethrProviderMainnet = new EthrDIDProvider({
  defaultKms: 'local',
  network: 'mainnet',
  rpcUrl: 'https://mainnet.infura.io/v3/',
  gas: 1000001,
  ttl: 60 * 60 * 24 * 30 * 12 + 1,
});

export const agent = createAgent<IResolver & IDIDManager & IMessageHandler & ICredentialIssuer & IWellKnownDidConfigurationPlugin & IDataStore>({
  plugins: [
    new DIDConfigurationPlugin(),
    new MessageHandler({
      messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
    }),
    new KeyManager({
      store: new KeyStore(dbConnection, new SecretBox(secretKey)),
      kms: kms,
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: 'did:web',
      providers: {
        'did:web': new WebDIDProvider({ defaultKms: 'local' }),
        'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
        'did:ethr': ethrProviderMainnet,
        'did:ethr:rinkeby': ethrProvider,
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...webDidResolver(),
        ...getEthrResolver(providerConfig),
        ...getUniversalResolverFor(["key", "elem", "io", "ion", "sov"])
      }),
    }),
    new CredentialIssuer(),
    new DataStore(dbConnection)
  ],
});

test('Test agent working', async () => {
  agent.availableMethods();
});