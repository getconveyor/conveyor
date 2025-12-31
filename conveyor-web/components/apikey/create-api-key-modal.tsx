'use client'

import { useState } from 'react'
import { apiKeyApi, ApiKeyWithKey } from '@/lib/api/apikey'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Copy, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CreateApiKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateApiKeyModal({ open, onOpenChange, onCreated }: CreateApiKeyModalProps) {
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdKey, setCreatedKey] = useState<ApiKeyWithKey | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      const apiKey = await apiKeyApi.createApiKey({ name })
      setCreatedKey(apiKey)
      toast({
        title: 'API key created',
        description: 'Make sure to copy your API key now. You won\'t be able to see it again!',
      })
    } catch (err: any) {
      console.error('Failed to create API key:', err)
      const errorMessage = err.response?.data?.name?.[0] || err.response?.data?.detail || err.message || 'Failed to create API key'
      setError(errorMessage)
      toast({
        title: 'Failed to create API key',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!createdKey) return

    try {
      await navigator.clipboard.writeText(createdKey.key)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard',
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  function handleClose() {
    if (createdKey) {
      onCreated?.()
    }
    setName('')
    setError('')
    setCreatedKey(null)
    setShowKey(false)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? 'API Key Created' : 'Create API Key'}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? 'Copy your API key now. For security reasons, you won\'t be able to see it again.'
              : 'Create a new API key for programmatic access to your account.'}
          </DialogDescription>
        </DialogHeader>

        {!createdKey ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">API Key Name *</Label>
                <Input
                  id="name"
                  placeholder="Production Server, CI/CD Pipeline, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name to identify this API key
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> The API key will only be shown once. Make sure to copy and store it securely.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create API Key
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Your API key has been created successfully!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={createdKey.key}
                    readOnly
                    type={showKey ? 'text' : 'password'}
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button onClick={handleCopy} variant="outline">
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This is the only time you'll see this key. Store it securely - we cannot recover it if lost.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Key Details:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium text-foreground">{createdKey.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium text-foreground">
                    {new Date(createdKey.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span className="font-medium text-foreground">
                    {createdKey.expires_at ? new Date(createdKey.expires_at).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {createdKey && (
          <DialogFooter>
            <Button onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
