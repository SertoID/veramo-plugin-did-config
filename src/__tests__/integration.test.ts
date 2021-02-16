import { createAgent, IDIDManager, IMessageHandler, IResolver } from "@veramo/core";
import { CredentialIssuer, W3cMessageHandler } from "@veramo/credential-w3c";
import { ICredentialIssuer } from "@veramo/credential-w3c/src";
import { DIDStore, Entities, KeyStore } from "@veramo/data-store";
import { JwtMessageHandler } from "@veramo/did-jwt";
import { createConnection, Connection } from 'typeorm';
import { DIDManager } from "@veramo/did-manager";
import { EthrDIDProvider } from "@veramo/did-provider-ethr";
import { WebDIDProvider } from "@veramo/did-provider-web";
import { DIDResolverPlugin, UniversalResolver } from "@veramo/did-resolver";
import { MessageHandler } from "@veramo/message-handler";
import { DIDResolver, Resolver } from "did-resolver";
import {
  DIDConfigurationPlugin,
  IWellKnownDidConfigurationPlugin,
  IWKDidConfigVerification
} from "../index";
import { KeyManager } from "@veramo/key-manager";
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local";

const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c';

const uniresolver = new UniversalResolver({
  url: "https://uniresolver.io/1.0/identifiers/",
}) as DIDResolver;

const dbConnection = createConnection({
  type: 'sqlite',
  database: "/tmp/did-config-test" + (Math.random() * 1000),
  synchronize: true,
  logging: false,
  entities: Entities,
});

export const agent = createAgent<IResolver & IDIDManager & IMessageHandler & ICredentialIssuer & IWellKnownDidConfigurationPlugin>({
  plugins: [
    new DIDConfigurationPlugin(),
    new MessageHandler({
      messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
    }),
    new KeyManager({
      store: new KeyStore(dbConnection, new SecretBox(secretKey)),
      kms: {
        local: new KeyManagementSystem(),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: 'did:web',
      providers: {
        'did:web': new WebDIDProvider({
          defaultKms: 'local',
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        key: uniresolver,
        ethr: uniresolver,
        web: uniresolver,
        elem: uniresolver,
        io: uniresolver,
        ion: uniresolver,
        sov: uniresolver,
      }),
    }),
    new CredentialIssuer(),
  ],
});

describe(".well-known DID configuration VERIFICATION", () => {
  it("Verify DID configuration from 'identity.foundation'", async () => {
    await checkDidConfigForDomain("identity.foundation", 1);
  });

  it("Verify DID configuration from 'mesh.xyz'", async () => {
    await checkDidConfigForDomain("mesh.xyz", 1);
  });

  it("Verify incompatible DID configuration from 'transmute.industries'", async () => {
    const result: IWKDidConfigVerification = await checkDidConfigForDomain("transmute.industries", 0);
    expect(result.errors.length).toEqual(2);
  });
});

describe(".well-known DID configuration GENERATOR", () => {
  it("Generate a DID configuration", async () => {
    const did = await agent.didManagerCreate();
    const result = await agent.generateDidConfiguration({
      dids: [did.did],
      domain: "mesh.xyz"
    });
    expect(result.linked_dids.length).toEqual(1);
  });

  it.todo("DID configuration with multiple DIDs from distinct methods");
  it.todo("Invalid domain should fail");
  it.todo("DID configuration with no DID should fail");
});

async function checkDidConfigForDomain(testDomain: string, numberOfExpectedDids: number): Promise<IWKDidConfigVerification> {
  const result = await agent.verifyWellKnownDidConfiguration(
    {
      domain: testDomain,
    }
  );
  const { domain, dids, didConfiguration, valid } = result;
  expect(domain).toBe(testDomain);
  expect(valid).toBe(true);
  expect(dids).toHaveLength(numberOfExpectedDids);
  return result;
}

