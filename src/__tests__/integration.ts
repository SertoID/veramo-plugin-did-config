import { IDataStore, IDIDManager, IMessageHandler, IResolver, TAgent } from '@veramo/core';
import { ICredentialIssuer } from '@veramo/credential-w3c';
import fetchMock from 'jest-fetch-mock';
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
    beforeAll(async () => {
      fetchMock.enableMocks();
      testContext.setup();
      agent = testContext.getAgent();
    })
    afterAll(testContext.tearDown);

    it("Verify DID configuration from 'test.agent.serto.xyz'", async () => {
      fetchMock.mockOnce(`{
        "@context": "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
        "linked_dids": [
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJvcmlnaW4iOiJ0ZXN0LmFnZW50LnNlcnRvLnh5eiJ9LCJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vaWRlbnRpdHkuZm91bmRhdGlvbi8ud2VsbC1rbm93bi9jb250ZXh0cy9kaWQtY29uZmlndXJhdGlvbi12MC4wLmpzb25sZCJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRG9tYWluTGlua2FnZUNyZWRlbnRpYWwiXX0sInN1YiI6ImRpZDp3ZWI6dGVzdC5hZ2VudC5zZXJ0by54eXoiLCJuYmYiOjE2MzcyNjY4MzEsImlzcyI6ImRpZDp3ZWI6dGVzdC5hZ2VudC5zZXJ0by54eXoifQ.6xyp1yXmnM8MSxXIvfaGzdj92we54DnAP5jzWDCLi4Iv_VFj7BhIOXlT567rmm7t-t4SN0qg-ll20iijyzc5cQ"
        ]
      }`);
      const prepare: Response = await fetch("https://test.agent.serto.xyz/.well-known/did-configuration.json?hasVeramo=false");
      const result = await checkDidConfigForDomain(agent, "test.agent.serto.xyz", 1);
      expect(result.valid).toBe(true);
    });

    it("Verify DID configuration from 'verify.serto.id'", async () => {
      fetchMock.mockOnce(`{
        "@context":"https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
        "linked_dids": [
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJvcmlnaW4iOiJ2ZXJpZnkuc2VydG8uaWQifSwiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiLCJodHRwczovL2lkZW50aXR5LmZvdW5kYXRpb24vLndlbGwta25vd24vY29udGV4dHMvZGlkLWNvbmZpZ3VyYXRpb24tdjAuMC5qc29ubGQiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkRvbWFpbkxpbmthZ2VDcmVkZW50aWFsIl19LCJzdWIiOiJkaWQ6ZXRocjoweGYxYzA4OEZmMTkzMDFlNjYwQ0U4QjYzRjc5Njc1MzM3ZTI4OTYzYTQiLCJuYmYiOjE2MTQ4OTM3MDgsImlzcyI6ImRpZDpldGhyOjB4ZjFjMDg4RmYxOTMwMWU2NjBDRThCNjNGNzk2NzUzMzdlMjg5NjNhNCJ9.iN-k9oTx9idn00xpYs7mFi7q2x6IAknkfl06V0h2eMHRa-dacWIXm4Dw9Fmu03aA3BnqE_5uPSyZTvFpJ_4KuA",
          "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJvcmlnaW4iOiJ2ZXJpZnkuc2VydG8uaWQifSwiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiLCJodHRwczovL2lkZW50aXR5LmZvdW5kYXRpb24vLndlbGwta25vd24vY29udGV4dHMvZGlkLWNvbmZpZ3VyYXRpb24tdjAuMi5qc29ubGQiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkRvbWFpbkxpbmthZ2VDcmVkZW50aWFsIl19LCJzdWIiOiJkaWQ6ZXRocjoweDAyNDk1YTQwZjkwYmNlZTc4NjMwOTcwMzc0ZGNlN2QwOWY5Nzg2ZjJhYmE5NGI5ZjM3YTMxMWI0M2MzNjg3MGEyZCIsIm5iZiI6MTYyMTAxMDYxOCwiaXNzIjoiZGlkOmV0aHI6MHgwMjQ5NWE0MGY5MGJjZWU3ODYzMDk3MDM3NGRjZTdkMDlmOTc4NmYyYWJhOTRiOWYzN2EzMTFiNDNjMzY4NzBhMmQifQ.Y2HfASnn3L_JTGtS2zD4oxxkyvNfQOenGdVD19d93Sar27VK8x_qyuqb8dZ2Lor4P5ugjau4z0myvHllIkuOgw",
            "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJvcmlnaW4iOiJ2ZXJpZnkuc2VydG8uaWQifSwiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiLCJodHRwczovL2lkZW50aXR5LmZvdW5kYXRpb24vLndlbGwta25vd24vY29udGV4dHMvZGlkLWNvbmZpZ3VyYXRpb24tdjAuMi5qc29ubGQiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkRvbWFpbkxpbmthZ2VDcmVkZW50aWFsIl19LCJzdWIiOiJkaWQ6d2ViOmFnZW50LnNlcnRvLmlkIiwibmJmIjoxNjM0MzE2MTIwLCJpc3MiOiJkaWQ6d2ViOmFnZW50LnNlcnRvLmlkIn0.xd_JYi5OjxXRMTO7XJt0eDl1_QOHL2VowXaqQJxf_H00UC3hoZZckCB_TXsYvD21C3B0Nr0VJ173syKN365LEA" 
        ]
      }`);
      const result = await checkDidConfigForDomain(agent, "verify.serto.id", 3);
      expect(result.valid).toBe(true);
    });

    it("Verify DID configuration from 'identity.foundation'", async () => {
      fetchMock.mockOnce(`{
        "@context": "https://identity.foundation/.well-known/did-configuration/v1",
        "linked_dids": [
          {
            "@context": [
              "https://www.w3.org/2018/credentials/v1",
              "https://identity.foundation/.well-known/did-configuration/v1"
            ],
            "issuer": "did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM",
            "issuanceDate": "2020-12-04T14:08:28-06:00",
            "expirationDate": "2025-12-04T14:08:28-06:00",
            "type": ["VerifiableCredential", "DomainLinkageCredential"],
            "credentialSubject": {
              "id": "did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM",
              "origin": "https://identity.foundation"
            },
            "proof": {
              "type": "Ed25519Signature2018",
              "created": "2020-12-04T20:08:28.540Z",
              "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..D0eDhglCMEjxDV9f_SNxsuU-r3ZB9GR4vaM9TYbyV7yzs1WfdUyYO8rFZdedHbwQafYy8YOpJ1iJlkSmB4JaDQ",
              "proofPurpose": "assertionMethod",
              "verificationMethod": "did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM#z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM"
            }
          },
          "eyJhbGciOiJFZERTQSJ9.eyJleHAiOjE3NjQ4Nzg5MDgsImlzcyI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNIiwibmJmIjoxNjA3MTEyNTA4LCJzdWIiOiJkaWQ6a2V5Ono2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly9pZGVudGl0eS5mb3VuZGF0aW9uLy53ZWxsLWtub3duL2RpZC1jb25maWd1cmF0aW9uL3YxIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rb1RIc2dOTnJieThKekNOUTFpUkx5VzVRUTZSOFh1dTZBQThpZ0dyTVZQVU0iLCJvcmlnaW4iOiJpZGVudGl0eS5mb3VuZGF0aW9uIn0sImV4cGlyYXRpb25EYXRlIjoiMjAyNS0xMi0wNFQxNDowODoyOC0wNjowMCIsImlzc3VhbmNlRGF0ZSI6IjIwMjAtMTItMDRUMTQ6MDg6MjgtMDY6MDAiLCJpc3N1ZXIiOiJkaWQ6a2V5Ono2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJEb21haW5MaW5rYWdlQ3JlZGVudGlhbCJdfX0.6ovgQ-T_rmYueviySqXhzMzgqJMAizOGUKAObQr2iikoRNsb8DHfna4rh1puwWqYwgT3QJVpzdO_xZARAYM9Dw"
        ]
      }`);
      const result = await checkDidConfigForDomain(agent, "identity.foundation", 1);
      expect(result.valid).toBe(true);
    });

    it("Verify DID configuration from 'mesh.xyz'", async () => {
      fetchMock.mockOnce(`{"@context":"https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld","linked_dids":["eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJvcmlnaW4iOiJtZXNoLnh5eiJ9LCJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vaWRlbnRpdHkuZm91bmRhdGlvbi8ud2VsbC1rbm93bi9jb250ZXh0cy9kaWQtY29uZmlndXJhdGlvbi12MC4yLmpzb25sZCJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRG9tYWluTGlua2FnZUNyZWRlbnRpYWwiXX0sInN1YiI6ImRpZDp3ZWI6bWVzaHJlc2VhcmNoLnNlcnRvLmlkIiwibmJmIjoxNjMxMTQ1MjU5LCJpc3MiOiJkaWQ6d2ViOm1lc2hyZXNlYXJjaC5zZXJ0by5pZCJ9.Ce0SC8BnRAbk1V-s9nSg0E8R3Hb8RjtEKlgvXXlyv4ex4mBbTNX89kLOCNF9xzvNy_bk3_FwyVvrXgoSpfji_Q"]}`);
      const result = await checkDidConfigForDomain(agent, "mesh.xyz", 1);
      expect(result.valid).toBe(true);
    });

    it("Verify incompatible DID configuration from 'transmute.industries'", async () => {
      fetchMock.mockOnce(`{
        "@context": "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld",
        "entries": [
          {
            "@context": [
              "https://www.w3.org/2018/credentials/v1",
              "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld"
            ],
            "issuer": "did:web:transmute.industries",
            "issuanceDate": "2020-04-13T16:44:52-05:00",
            "expirationDate": "2021-05-13T16:44:52-05:00",
            "type": ["VerifiableCredential", "DomainLinkageCredential"],
            "credentialSubject": {
              "id": "did:web:transmute.industries",
              "domain": "transmute.industries"
            },
            "proof": {
              "type": "Ed25519Signature2018",
              "created": "2020-05-11T21:17:51Z",
              "verificationMethod": "did:web:transmute.industries#z6MknMgTsNigCLoLExEHqJiff8P6TPGEjhAkU2nFPDsRweiZ",
              "proofPurpose": "assertionMethod",
              "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..rEPElaJyxTDNKN4oRbCPZe422040FTVADVMbbzKRJVJ79Nv_vTUbwxxqj5rdQoT7eI9HQTLChjGhwcqIHiQWCQ"
            }
          },
          {
            "@context": [
              "https://www.w3.org/2018/credentials/v1",
              "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld"
            ],
            "issuer": "did:key:z6MknMgTsNigCLoLExEHqJiff8P6TPGEjhAkU2nFPDsRweiZ",
            "issuanceDate": "2020-04-13T16:44:52-05:00",
            "expirationDate": "2021-05-13T16:44:52-05:00",
            "type": ["VerifiableCredential", "DomainLinkageCredential"],
            "credentialSubject": {
              "id": "did:key:z6MknMgTsNigCLoLExEHqJiff8P6TPGEjhAkU2nFPDsRweiZ",
              "domain": "transmute.industries"
            },
            "proof": {
              "type": "Ed25519Signature2018",
              "created": "2020-05-11T21:17:21Z",
              "verificationMethod": "did:key:z6MknMgTsNigCLoLExEHqJiff8P6TPGEjhAkU2nFPDsRweiZ#z6MknMgTsNigCLoLExEHqJiff8P6TPGEjhAkU2nFPDsRweiZ",
              "proofPurpose": "assertionMethod",
              "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..emVBWGMsGMhuBhN6XtyBVA6ipcLxWDxQLHgzgrlEePMI8tJas8B_mwzzvZWv2U4fjxF8VAFwbspmRrejtjjKBQ"
            }
          }
        ]
      }`);
      const result: IWKDidConfigVerification = await checkDidConfigForDomain(agent, "transmute.industries", 0);
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

    it("Test a DID configuration with a linkage using EIP712", async () => {
      const origin = `test.com`;
      const did = `did:ethr:0xcEC56F1D4Dc439E298D5f8B6ff3Aa6be58Cd6Fdf`;
      fetchMock.mockOnce(`{
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
        ]}`);

      const result = await agent.verifyWellKnownDidConfiguration({ domain: origin });
      fetchMock.resetMocks();
      const { domain, dids, didConfiguration, errors, valid, rawDidConfiguration } = result;
      expect(domain).toBe(origin);
      expect(dids).toHaveLength(1);
      expect(dids).toContain(did);
      return result;
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
  });
}