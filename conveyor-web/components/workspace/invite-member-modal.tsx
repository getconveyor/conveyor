'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { workspaceApi } from '@/lib/api/workspace'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface InviteMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvited?: () => void
}

export function InviteMemberModal({ open, onOpenChange, onInvited }: InviteMemberModalProps) {
  const { currentWorkspace } = useWorkspace()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'developer' | 'analyst' | 'viewer'>('viewer')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentWorkspace) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await workspaceApi.inviteMember(currentWorkspace.id, {
        email,
        role,
        message: message || undefined,
      })

      setSuccess(true)
      setTimeout(() => {
        onInvited?.()
        handleClose()
      }, 1500)
    } catch (err: any) {
      console.error('Failed to invite member:', err)
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.data?.email) {
        setError(err.response.data.email[0])
      } else {
        setError(err.message || 'Failed to invite member')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setEmail('')
    setRole('viewer')
    setMessage('')
    setError('')
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join {currentWorkspace?.name}. They will receive an email with
            instructions to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: any) => setRole(value)}
                disabled={loading || success}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">
                        Can manage members and workspace settings
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="developer">
                    <div className="flex flex-col items-start">
                      <div className="font-medium">Developer</div>
                      <div className="text-xs text-muted-foreground">
                        Full access to create and manage pipelines
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="analyst">
                    <div className="flex flex-col items-start">
                      <div className="font-medium">Analyst</div>
                      <div className="text-xs text-muted-foreground">
                        Can view and analyze data, run queries
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-muted-foreground">
                        Read-only access to dashboards and reports
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                disabled={loading || success}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>Invitation sent successfully!</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? 'Invited!' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
