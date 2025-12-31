'use client'

import { useState } from 'react'
import { apiKeyApi, ApiKey } from '@/lib/api/apikey'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Key, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ApiKeyRowProps {
  apiKey: ApiKey
  onDelete: () => void
}

export function ApiKeyRow({ apiKey, onDelete }: ApiKeyRowProps) {
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date()
  const neverUsed = !apiKey.last_used

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiKeyApi.deleteApiKey(apiKey.id)
      toast({
        title: 'API key deleted',
        description: `${apiKey.name} has been deleted successfully.`,
      })
      onDelete()
      setShowDeleteDialog(false)
    } catch (error: any) {
      console.error('Failed to delete API key:', error)
      toast({
        title: 'Failed to delete API key',
        description: error.message || 'An error occurred while deleting the API key.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">{apiKey.name}</p>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
              {neverUsed && (
                <Badge variant="secondary" className="text-xs">
                  Never Used
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Created {new Date(apiKey.created_at).toLocaleDateString()}
                </span>
              </div>

              {apiKey.last_used && (
                <div>
                  Last used {new Date(apiKey.last_used).toLocaleDateString()}
                </div>
              )}

              {apiKey.expires_at && !isExpired && (
                <div>
                  Expires {new Date(apiKey.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-destructive" />
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{apiKey.name}"? This action cannot be undone and any applications using this key will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
