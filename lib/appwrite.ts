import { Client, Account, Databases, ID } from 'appwrite'

// Force Singapore region — Vercel env vars may override otherwise
const endpoint = 'https://sgp.cloud.appwrite.io/v1'
const projectId = '69efa226000db23fcd89'

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export { ID }

export const DATABASE_ID = 'bizcard_ai'
export const CARDS_COLLECTION = 'business_cards'

export default client
