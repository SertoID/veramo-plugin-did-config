import { createAgent, IMessageHandler, IResolver } from "@veramo/core";
import {
  DIDConfigurationPlugin,
  IWellKnownDidConfigurationPlugin,
} from "../index";
import { MessageHandler } from "@veramo/message-handler";
import { CredentialIssuer, W3cMessageHandler } from "@veramo/credential-w3c";
import { DIDResolverPlugin, UniversalResolver } from "@veramo/did-resolver";
import { JwtMessageHandler } from "@veramo/did-jwt";
import { Resolver, DIDResolver } from "did-resolver";
import { ICredentialIssuer } from "@veramo/credential-w3c/src";

const uniresolver = new UniversalResolver({
  url: "https://uniresolver.io/1.0/identifiers/",
}) as DIDResolver;

export const agent = createAgent<IResolver & IMessageHandler & ICredentialIssuer & IWellKnownDidConfigurationPlugin>({
  plugins: [
    new DIDConfigurationPlugin(),
    new MessageHandler({
      messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        key: uniresolver,
      }),
    }),
    new CredentialIssuer(),
  ],
});

describe("did-config plugin", () => {
  it("can verify known config", async () => {
    const { domain, dids, didConfiguration, valid } = await agent.verifyWellKnownDidConfiguration(
      {
        domain: "identity.foundation",
      }
    );
    expect.assertions(2);
    expect(domain).toBe("identity.foundation");
    expect(valid).toBe(true);
  });
});
