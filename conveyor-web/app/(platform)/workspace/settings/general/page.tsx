'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { workspaceApi } from '@/lib/api/workspace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, AlertCircle, Trash2, Settings, Calendar, Crown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function WorkspaceGeneralSettingsPage() {
  const { currentWorkspace, isOwner, refreshCurrentWorkspace, loadWorkspaces } = useWorkspace()
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name)
      setSlug(currentWorkspace.slug)
      setDescription(currentWorkspace.description || '')
    }
  }, [currentWorkspace])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentWorkspace) return

    setLoading(true)
    setError('')

    try {
      await workspaceApi.updateWorkspace(currentWorkspace.id, {
        name,
        slug,
        description: description || undefined,
      })

      await refreshCurrentWorkspace()

      toast({
        title: 'Workspace updated',
        description: 'Your workspace settings have been updated successfully.',
      })
    } catch (err: any) {
      console.error('Failed to update workspace:', err)

      let errorMessage = 'Failed to update workspace'

      if (err.response?.data?.slug) {
        errorMessage = `Slug: ${err.response.data.slug[0]}`
      } else if (err.response?.data?.name) {
        errorMessage = `Name: ${err.response.data.name[0]}`
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast({
        title: 'Failed to update workspace',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!currentWorkspace) return

    setDeleting(true)

    try {
      await workspaceApi.deleteWorkspace(currentWorkspace.id)

      toast({
        title: 'Workspace deleted',
        description: `${currentWorkspace.name} has been permanently deleted.`,
      })

      await loadWorkspaces()
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Failed to delete workspace:', err)
      toast({
        title: 'Failed to delete workspace',
        description: err.message || 'An error occurred while deleting the workspace.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  function handleReset() {
    if (currentWorkspace) {
      setName(currentWorkspace.name)
      setSlug(currentWorkspace.slug)
      setDescription(currentWorkspace.description || '')
      setError('')
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="container max-w-4xl py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a workspace to manage settings.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const hasChanges =
    name !== currentWorkspace.name ||
    slug !== currentWorkspace.slug ||
    description !== (currentWorkspace.description || '')

  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your workspace details and preferences
          </p>
        </div>

        {/* Workspace Info (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Workspace Information
            </CardTitle>
            <CardDescription>General information about this workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-4 w-4" />
                  <span>Owner</span>
                </div>
                <p className="font-medium">{currentWorkspace.owner_name}</p>
                <p className="text-sm text-muted-foreground">{currentWorkspace.owner_email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="font-medium">
                  {new Date(currentWorkspace.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Status</div>
                <p className="font-medium capitalize">{currentWorkspace.status}</p>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Members</div>
                <p className="font-medium">{currentWorkspace.member_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Workspace Form */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Details</CardTitle>
            <CardDescription>
              Update your workspace name, slug, and description
              {!isOwner && ' (Owner only)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My Workspace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading || !isOwner}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Workspace Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="my-workspace"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={loading || !isOwner}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (lowercase, hyphens allowed)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this workspace is for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading || !isOwner}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isOwner && (
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={loading || !hasChanges}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading || !hasChanges}
                  >
                    Reset
                  </Button>
                </div>
              )}

              {!isOwner && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Only the workspace owner can modify these settings.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that permanently affect your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Workspace</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this workspace and all its data. This action cannot be undone.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      {deleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Workspace
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {currentWorkspace.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the workspace and all associated data including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All pipelines and configurations</li>
                          <li>All member access</li>
                          <li>All stored data and files</li>
                          <li>All integration settings</li>
                        </ul>
                        <p className="mt-3 font-semibold text-destructive">
                          This action cannot be undone.
                        </p>
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
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
