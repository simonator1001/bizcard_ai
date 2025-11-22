'use server'

export async function authenticate(formData: FormData) {
  console.log('Authenticating:', Object.fromEntries(formData))
  return { message: 'Authentication successful' }
} 