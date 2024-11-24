export async function signIn(email: string, password: string) {
  // This is a mock authentication. Replace with your actual auth logic
  if (email && password) {
    // Store auth token
    localStorage.setItem('authToken', 'dummy-token');
    return { success: true };
  }
  throw new Error('Invalid credentials');
}

export function signOut() {
  localStorage.removeItem('authToken');
}

export function isAuthenticated() {
  return typeof window !== 'undefined' && !!localStorage.getItem('authToken');
} 