## Local Development
* `yarn`
* `yarn build` or `yarn watch`
* `yarn generate-plugin-schema`
* `yarn start` or VSCode Debugger (CMD + Shift + D) > Run `OpenAPI server`  

## Installation
```js
yarn add daf-plugin-did-config
```

## Usage
 
### Programatically usage

The minimum Veramo configuration for using this library requires the following dependencies:

```jsx
yarn add @veramo/core @veramo/message-handler @veramo/resolver-universal @veramo/credential-w3c @veramo/did-jwt
```

when initializing your Veramo agent message handler, the order of the handlers matters. `JwtMessageHandler` should be first.

```
import { createAgent } from "@veramo/core";
import {
  DIDConfigurationPlugin,
  IWellKnownDidConfigurationPlugin,
} from "daf-plugin-did-config";
import { MessageHandler } from "@veramo/message-handler";
import { CredentialIssuer, W3cMessageHandler } from "@veramo/credential-w3c";
import { VeramoUniversalResolver } from "@veramo/resolver-universal";
import { JwtMessageHandler } from "@veramo/did-jwt";

export const agent = createAgent<IWellKnownDidConfigurationPlugin>({
  plugins: [
    new DIDConfigurationPlugin(),
    new MessageHandler({
      messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
    }),
    new VeramoUniversalResolver({
      url: "https://uniresolver.io/1.0/identifiers/",
    }),
    new CredentialIssuer(),
  ],
});

```

Since we are asserting the agent to have a type of `IWellKnownDidConfigurationPlugin` we can access the plugin methods directly. The `verifyWellKnownDidConfiguration` method will return an object with the provided domain, list of dids associated to it, the JSON didConfiguration which was verified, and a boolean for validity. 

```
const { domain, dids, didConfiguration, valid } = await agent.verifyWellKnownDidConfiguration({ domain });

```


### Command line usage 

Clone the plugin repo in your machine and configure the agent instance by editing the agent.yml file (or, if you’re simply trying it or joining a hackathon, keep the configuration as it is).

1. Run the following command to execute your agent:
```yarn && yarn build && yarn start```

2. Execute the following command to generate a DID:
```yarn veramo execute -m identityManagerCreateIdentity -a "{}"```

3. Execute the following command to generate your Well-Known DID configuration file, using the DID created in the previous step and the domain from your company:
```yarn veramo execute -m generateDidConfiguration -a "{\"dids\":[\"<did>\"],\"domain\":\"<domain>\"}"```

4. Upload the Well-Known DID Configuration file to the company website and host it under the well-known URI:
```https://<domain>/.well-known/did-configuration.json```

5. Verify your Well-Known DID Configuration running:
```yarn veramo execute -m verifyWellKnownDidConfiguration -a "{\"domain\": \"<domain>\"}"```
