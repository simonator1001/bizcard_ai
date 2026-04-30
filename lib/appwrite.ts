import { Client, Account, Databases, ID } from 'appwrite'

// Force Singapore region
const endpoint = 'https://sgp.cloud.appwrite.io/v1'
const projectId = '69efa226000db23fcd89'

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)

// 🔑 Read session from our domain cookie (set by server-side OAuth callback)
// This bypasses AppWrite's cross-domain cookie / SameSite blocking entirely
if (typeof document !== 'undefined') {
  const match = document.cookie.match(/(?:^|;\s*)aw_session=([^;]*)/)
  if (match?.[1]) {
    client.setSession(match[1])
  }
}

export const account = new Account(client)
export const databases = new Databases(client)
export { ID }

export const DATABASE_ID = 'bizcard_ai'
export const CARDS_COLLECTION = 'business_cards'

export default client
