import { IDataStore, IDIDManager, IMessageHandler, IResolver, TAgent } from '@veramo/core';
import { ICredentialIssuer } from '@veramo/credential-w3c';
import fetch, { Response } from "node-fetch";
import {
  IWellKnownDidConfigurationPlugin,
  IWKDidConfigVerification
} from "../index";

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
    afterAll(testContext.tearDown)

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
      catch (err) {
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
}