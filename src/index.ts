/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export { MyAgentPlugin } from './agent/my-plugin'
export { KeyManagementSystem } from './key-manager/key-management-system'
export { KeyStore } from './key-manager/key-store'
export { SecretBox } from './key-manager/secret-box'
export { IdentityProvider } from './identity-manager/identity-provider'
export { IdentityStore } from './identity-manager/identity-store'
export * from './types/IMyAgentPlugin'
