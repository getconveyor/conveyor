'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiKeyApi, ApiKey } from '@/lib/api/apikey'
import { ApiKeyRow } from '@/components/apikey/api-key-row'
import { CreateApiKeyModal } from '@/components/apikey/create-api-key-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, AlertCircle, Key, Shield } from 'lucide-react'

export default function ApiKeysPage() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    loadApiKeys()
  }, [])

  async function loadApiKeys() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiKeyApi.getApiKeys()
      setApiKeys(data)
    } catch (err: any) {
      console.error('Failed to load API keys:', err)
      setError(err.message || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to manage API keys.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Manage API keys for programmatic access to your account
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your API Keys
            </CardTitle>
            <CardDescription>
              API keys allow you to authenticate API requests to Conveyor
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No API keys found</p>
                <p className="text-sm">Create your first API key to get started with programmatic access</p>
              </div>
            ) : (
              <div>
                {apiKeys.map((apiKey) => (
                  <ApiKeyRow key={apiKey.id} apiKey={apiKey} onDelete={loadApiKeys} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Best Practices
            </CardTitle>
            <CardDescription>
              Follow these guidelines to keep your API keys secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <ul className="space-y-2 text-sm mt-2">
                  <li>✓ Store API keys securely using environment variables</li>
                  <li>✓ Never commit API keys to version control</li>
                  <li>✓ Rotate keys regularly and delete unused keys</li>
                  <li>✓ Use different keys for different environments (dev, staging, production)</li>
                  <li>✓ Monitor key usage and investigate unusual activity</li>
                  <li>⚠ If a key is compromised, delete it immediately and create a new one</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Using Your API Key</CardTitle>
            <CardDescription>
              How to authenticate API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-2">Include your API key in the Authorization header:</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                <code>Authorization: Bearer YOUR_API_KEY</code>
              </pre>
            </div>

            <div>
              <p className="text-sm mb-2">Example using cURL:</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.conveyor.com/v1/pipelines`}</code>
              </pre>
            </div>

            <div>
              <p className="text-sm mb-2">Example using Python:</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                <code>{`import requests

headers = {"Authorization": "Bearer YOUR_API_KEY"}
response = requests.get(
    "https://api.conveyor.com/v1/pipelines",
    headers=headers
)
print(response.json())`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create API Key Modal */}
      <CreateApiKeyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={loadApiKeys}
      />
    </div>
  )
}
