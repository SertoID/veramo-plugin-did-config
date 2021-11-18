import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { getConfig } from '@veramo/cli/build/setup'
import fs from 'fs'
import fetchMock from 'jest-fetch-mock'
import { Connection } from 'typeorm'
// Shared tests
import myPluginLogic from './integration'


jest.setTimeout(30000)


let dbConnection: Promise<Connection>
let agent: any

const setup = async (): Promise<boolean> => {

  const config = getConfig('./agent.yml')

  const { localAgent, db } = createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent
  dbConnection = db

  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).close()
  fs.unlinkSync('./database.sqlite')
  return true
}

const getAgent = () => agent

const testContext = { getAgent, setup, tearDown }

describe('Local integration tests', () => {
  myPluginLogic(testContext)
})