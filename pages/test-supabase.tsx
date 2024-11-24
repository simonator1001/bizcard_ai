import { useState } from 'react'
import { testSupabaseConnection } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      const testResults = await testSupabaseConnection()
      setResults(testResults)
      console.log('Test results:', testResults)
    } catch (error) {
      console.error('Test error:', error)
      setResults({ error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </Button>

          {results && (
            <div className="mt-4 space-y-2">
              <div>Connection: {results.connection ? '✅' : '❌'}</div>
              <div>Auth Service: {results.auth ? '✅' : '❌'}</div>
              <div>User Creation: {results.userCreation ? '✅' : '❌'}</div>
              {results.error && (
                <pre className="p-4 bg-red-50 text-red-900 rounded">
                  {JSON.stringify(results.error, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 