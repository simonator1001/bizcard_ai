import { Client, Account, Databases, ID } from 'appwrite'

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '69ef2ce800308cf97330'

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export { ID }

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69ef339f0038efc60a25'
export const CARDS_COLLECTION = 'business_cards'

export default client
