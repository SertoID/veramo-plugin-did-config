import { IDataStore, IDIDManager, IMessageHandler, IResolver, TAgent } from '@veramo/core';
import { ICredentialIssuer } from '@veramo/credential-w3c';
import fetch, { Request, Response } from "node-fetch";
import {
  IWellKnownDidConfigurationPlugin,
  IWKDidConfigVerification
} from "../index";
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock'


type ConfiguredAgent = TAgent<IResolver & IDIDManager & IMessageHandler & ICredentialIssuer & IWellKnownDidConfigurationPlugin & IDataStore>

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
}) => {
  describe(".well-known DID configuration VERIFICATION", () => {
    let agent: ConfiguredAgent
    beforeAll(() => {
      testContext.setup()
      agent = testContext.getAgent()
    })
    afterAll(testContext.tearDown);

    it("Verify DID configuration from 'test.agent.serto.xyz'", async () => {
      const prepare: Response = await fetch("https://test.agent.serto.xyz/.well-known/did-configuration.json?hasVeramo=false");
      const result = await checkDidConfigForDomain(agent, "test.agent.serto.xyz", 1);
      expect(result.valid).toBe(true);
    });

    it("Verify DID configuration from 'verify.serto.id'", async () => {
      const result = await checkDidConfigForDomain(agent, "verify.serto.id", 3);
      expect(result.valid).toBe(true);
    });

    it("Verify DID configuration from 'identity.foundation'", async () => {
      const result = await checkDidConfigForDomain(agent, "identity.foundation", 1);
      expect(result.valid).toBe(true);
    });

    it("Verify DID configuration from 'mesh.xyz'", async () => {
      const result = await checkDidConfigForDomain(agent, "mesh.xyz", 1);
      expect(result.valid).toBe(true);
    });

    it("Verify incompatible DID configuration from 'transmute.industries'", async () => {
      const result: IWKDidConfigVerification = await checkDidConfigForDomain(agent, "transmute.industries", 0);
      console.log(JSON.stringify(result.errors, null, 4));
      expect(result.errors.length).toEqual(2);
      expect(result.valid).toBe(false);
    });

    it("Verify domain without DID configuration should fail", async () => {
      try {
        const domain = "google.com";
        const result = await agent.verifyWellKnownDidConfiguration({ domain });
        fail("Not suposed to find a DID configuration in domain: " + domain);
      }
      catch (err: any) {
        expect(err.message).toEqual(expect.stringMatching("Failed to download.*"));
      }
    });
  });

  async function checkDidConfigForDomain(agent: ConfiguredAgent, testDomain: string, numberOfExpectedDids: number): Promise<IWKDidConfigVerification> {
    const result = await agent.verifyWellKnownDidConfiguration(
      {
        domain: testDomain,
      }
    );
    const { domain, dids, didConfiguration, errors, valid, rawDidConfiguration } = result;
    if (numberOfExpectedDids != dids.length) console.log(domain + " " + valid + " Errors: " + JSON.stringify(errors, null, 2));
    expect(domain).toBe(testDomain);
    expect(dids).toHaveLength(numberOfExpectedDids);
    return result;
  }

  describe(".well-known DID configuration creation", () => {
    let agent: ConfiguredAgent
    beforeAll(() => {
      testContext.setup()
      agent = testContext.getAgent()
    })
    afterAll(testContext.tearDown)

    it("Generate a DID configuration", async () => {
      const did = await agent.didManagerCreate({ alias: "mesh.xyz", provider: "did:ethr" });
      const result = await agent.generateDidConfiguration({
        dids: [did.did],
        domain: "mesh.xyz"
      });
      expect(result.linked_dids.length).toEqual(1);
    });

    it("Generate a DID configuration and save it", async () => {
      const did = await agent.didManagerCreate({ alias: "mesh.xyz 2", provider: "did:ethr" });
      const result = await agent.generateDidConfiguration({
        dids: [did.did],
        domain: "mesh.xyz",
        save: true
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
      } catch (err: any) {
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
      } catch (err: any) {
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

    it("Test a DID configuration with a linkage using EIP712", async () => {
      const origin = `test.com`;
      const did = `did:ethr:0xcEC56F1D4Dc439E298D5f8B6ff3Aa6be58Cd6Fdf`;
      const didConfig = `{
        "@context":"https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
        "linked_dids": [
          {
            "@context":["https://www.w3.org/2018/credentials/v1","https://identity.foundation/.well-known/contexts/did-configuration-v0.2.jsonld"],
            "type":["VerifiableCredential","DomainLinkageCredential"],
            "issuer":"did:ethr:0xcEC56F1D4Dc439E298D5f8B6ff3Aa6be58Cd6Fdf",
            "issuanceDate":"2021-11-15T16:52:52.270Z",
            "credentialSubject":{
              "origin":"test.com",
              "id":"did:ethr:0xcEC56F1D4Dc439E298D5f8B6ff3Aa6be58Cd6Fdf"
            },
            "proof": {
              "verificationMethod":"did:ethr:0xcEC56F1D4Dc439E298D5f8B6ff3Aa6be58Cd6Fdf#controller",
              "created":"2021-11-15T16:52:52.270Z",
              "proofPurpose":"assertionMethod",
              "type":"EthereumEip712Signature2021",
              "proofValue":"0xfc58e86fc0a42abd657fa8868f3dfe5d801baf7b5b8030ed4082052fe8293abf60d9780f15fa9e96dd9394adc9c8d3fe6512b8a6c9950a392e5969f810d8e1801c",
              "eip712Domain":{
                "domain":{"chainId":1,"name":"DomainLinkage","version":"1"},
                "messageSchema":{
                  "EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"}],
                  "VerifiableCredential":[{"name":"@context","type":"string[]"},{"name":"type","type":"string[]"},{"name":"issuer","type":"string"},{"name":"issuanceDate","type":"string"},{"name":"credentialSubject","type":"CredentialSubject"},{"name":"proof","type":"Proof"}],
                  "CredentialSubject":[{"name":"origin","type":"string"},{"name":"id","type":"string"}],
                  "Proof":[{"name":"verificationMethod","type":"string"},{"name":"created","type":"string"},{"name":"proofPurpose","type":"string"},{"name":"type","type":"string"}]
                },
                "primaryType":"VerifiableCredential"
              }
            }
          }
        ]}`;

      // if you have an existing `beforeEach` just add the following lines to it
      enableFetchMocks();
      // fetchMock.mockIf(/^https?:\/\/test.com\/\.well-known\/did-configuration.json$/,
      fetchMock.mockIf(/did-configuration.json$/,
        async () => {
          console.log("Test!");
          return Promise.resolve(didConfig);
        });

      const result = await agent.verifyWellKnownDidConfiguration({ domain: origin });
      fetchMock.resetMocks();
      const { domain, dids, didConfiguration, errors, valid, rawDidConfiguration } = result;
      expect(domain).toBe(origin);
      expect(dids).toHaveLength(1);
      expect(dids).toContain(did);
      return result;
    });
  });
}