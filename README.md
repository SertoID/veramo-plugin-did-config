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
The minimum daf configuration for using this library requires the following dependencies:

```jsx
yarn add daf-core daf-message-handler daf-resolver-universal daf-w3c daf-did-jwt
```

when initializing your daf agent message handler, the order of the handlers matters. `JwtMessageHandler` should be first.

```
import { createAgent } from "daf-core";
import {
  DIDConfigurationPlugin,
  IWellKnownDidConfigurationPlugin,
} from "daf-plugin-did-config";
import { MessageHandler } from "daf-message-handler";
import { CredentialIssuer, W3cMessageHandler } from "daf-w3c";
import { DafUniversalResolver } from "daf-resolver-universal";
import { JwtMessageHandler } from "daf-did-jwt";

export const agent = createAgent<IWellKnownDidConfigurationPlugin>({
  plugins: [
    new DIDConfigurationPlugin(),
    new MessageHandler({
      messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
    }),
    new DafUniversalResolver({
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
