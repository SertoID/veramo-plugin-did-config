import { createAgent, IDIDManager, IMessageHandler, IResolver } from "@veramo/core";
import { CredentialIssuer, W3cMessageHandler } from "@veramo/credential-w3c";
import { ICredentialIssuer } from "@veramo/credential-w3c/src";
import { DIDStore, Entities, KeyStore } from "@veramo/data-store";
import { JwtMessageHandler } from "@veramo/did-jwt";
import { DIDManager } from "@veramo/did-manager";
import { EthrDIDProvider } from "@veramo/did-provider-ethr";
import { KeyDIDProvider } from "@veramo/did-provider-key";
import { WebDIDProvider } from "@veramo/did-provider-web";
import { DIDResolverPlugin, UniversalResolver } from "@veramo/did-resolver";
import { KeyManager } from "@veramo/key-manager";
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local";
import { MessageHandler } from "@veramo/message-handler";
import { DIDResolver, Resolver } from "did-resolver";
import fetch, { Response } from "node-fetch";
import { createConnection } from 'typeorm';
import {
  DIDConfigurationPlugin,
  IWellKnownDidConfigurationPlugin,
  IWKDidConfigVerification
} from "../index";
import { getResolver as webDidResolver } from 'web-did-resolver';

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
        'did:web': new WebDIDProvider({ defaultKms: 'local' }),
        'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
        'did:ethr:rinkeby': new EthrDIDProvider({
          defaultKms: 'local',
          network: 'rinkeby',
          rpcUrl: 'https://rinkeby.infura.io/v3/',
          gas: 1000001,
          ttl: 60 * 60 * 24 * 30 * 12 + 1,
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...webDidResolver(),
        key: uniresolver,
        ethr: uniresolver,
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
  it("Verify DID configuration from 'test.agent.serto.xyz'", async () => {
    const prepare: Response = await fetch("https://test.agent.serto.xyz/.well-known/did-configuration.json?hasVeramo=false");
    const result = await checkDidConfigForDomain("test.agent.serto.xyz", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify DID configuration from 'identity.foundation'", async () => {
    const result = await checkDidConfigForDomain("identity.foundation", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify DID configuration from 'mesh.xyz'", async () => {
    const result = await checkDidConfigForDomain("mesh.xyz", 1);
    expect(result.valid).toBe(true);
  });

  it("Verify incompatible DID configuration from 'transmute.industries'", async () => {
    const result: IWKDidConfigVerification = await checkDidConfigForDomain("transmute.industries", 0);
    expect(result.errors.length).toEqual(2);
    expect(result.valid).toBe(false);
  });

  it("Verify domain without DID configuration should fail", async () => {
    try {
      const domain = "google.com";
      const result = await agent.verifyWellKnownDidConfiguration({ domain });
      fail("Not suposed to find a DID configuration in domain: " + domain);
    }
    catch (err) {
      expect(err.message).toEqual(expect.stringMatching("Failed to download the .well-known DID configuration .*"));
    }
  });
});

describe(".well-known DID configuration GENERATOR", () => {
  it("Generate a DID configuration", async () => {
    const did = await agent.didManagerCreate({ alias: "mesh.xyz" });
    const result = await agent.generateDidConfiguration({
      dids: [did.did],
      domain: "mesh.xyz"
    });
    expect(result.linked_dids.length).toEqual(1);
  });

  it("Invalid domain should fail", async () => {
    try {
      await agent.generateDidConfiguration({
        dids: ["did.did"],
        domain: "mesh~.xyz"
      });
      throw "An invalid domain was accepted";
    } catch (err) {
      expect(err.message).toEqual("Invalid web domain");
    }
  });

  it("DID configuration with no DID should fail", async () => {
    try {
      await agent.generateDidConfiguration({
        dids: ["invalid-did"],
        domain: "mesh.xyz"
      });
      throw "An invalid DID was accepted";
    } catch (err) {
      expect(err.message).toEqual("Identifier not found");
    }
  });

  it("DID configuration with multiple DIDs from distinct methods", async () => {
    const didWeb = await agent.didManagerCreate({ provider: "did:web", alias: "serto.id" });
    const didKey = await agent.didManagerCreate({ provider: "did:ethr:rinkeby" });
    const result = await agent.generateDidConfiguration({
      dids: [didWeb.did, didKey.did],
      domain: "mesh.xyz"
    });
    expect(result.linked_dids.length).toEqual(2);
  });
});

async function checkDidConfigForDomain(testDomain: string, numberOfExpectedDids: number): Promise<IWKDidConfigVerification> {
  const result = await agent.verifyWellKnownDidConfiguration(
    {
      domain: testDomain,
    }
  );
  const { domain, dids, didConfiguration, errors, valid, rawDidConfiguration } = result;
  // if (!valid) console.log(domain + " " + valid + " Errors: " + JSON.stringify(errors, null, 2));
  expect(domain).toBe(testDomain);
  expect(dids).toHaveLength(numberOfExpectedDids);
  return result;
}

