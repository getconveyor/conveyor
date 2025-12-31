'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { workspaceApi, WorkspaceMember } from '@/lib/api/workspace'
import { MemberStatusBadge } from './member-status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreVertical, Loader2, UserX, UserCheck, UserMinus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MemberRowProps {
  member: WorkspaceMember
  onUpdate: () => void
}

export function MemberRow({ member, onUpdate }: MemberRowProps) {
  const { currentWorkspace, canManageMembers } = useWorkspace()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  const isOwner = member.role === 'owner'
  const canManage = canManageMembers && !isOwner

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  async function handleRoleChange(newRole: string) {
    if (!currentWorkspace || !canManage) return

    setIsUpdating(true)
    try {
      await workspaceApi.updateMemberRole(currentWorkspace.id, member.id, newRole)
      toast({
        title: 'Role updated',
        description: `${member.user.full_name}'s role has been updated to ${newRole}.`,
      })
      onUpdate()
    } catch (error: any) {
      console.error('Failed to update role:', error)
      toast({
        title: 'Failed to update role',
        description: error.message || 'An error occurred while updating the role.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleSuspend() {
    if (!currentWorkspace || !canManage) return

    setIsUpdating(true)
    try {
      await workspaceApi.suspendMember(currentWorkspace.id, member.id)
      toast({
        title: 'Member suspended',
        description: `${member.user.full_name} has been suspended.`,
      })
      onUpdate()
    } catch (error: any) {
      console.error('Failed to suspend member:', error)
      toast({
        title: 'Failed to suspend member',
        description: error.message || 'An error occurred while suspending the member.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleActivate() {
    if (!currentWorkspace || !canManage) return

    setIsUpdating(true)
    try {
      await workspaceApi.activateMember(currentWorkspace.id, member.id)
      toast({
        title: 'Member activated',
        description: `${member.user.full_name} has been activated.`,
      })
      onUpdate()
    } catch (error: any) {
      console.error('Failed to activate member:', error)
      toast({
        title: 'Failed to activate member',
        description: error.message || 'An error occurred while activating the member.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDeactivate() {
    if (!currentWorkspace || !canManage) return

    setIsUpdating(true)
    try {
      await workspaceApi.deactivateMember(currentWorkspace.id, member.id)
      toast({
        title: 'Member deactivated',
        description: `${member.user.full_name} has been deactivated.`,
      })
      onUpdate()
    } catch (error: any) {
      console.error('Failed to deactivate member:', error)
      toast({
        title: 'Failed to deactivate member',
        description: error.message || 'An error occurred while deactivating the member.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleRemove() {
    if (!currentWorkspace || !canManage) return

    setIsUpdating(true)
    try {
      await workspaceApi.removeMember(currentWorkspace.id, member.id)
      toast({
        title: 'Member removed',
        description: `${member.user.full_name} has been removed from the workspace.`,
      })
      onUpdate()
      setShowRemoveDialog(false)
    } catch (error: any) {
      console.error('Failed to remove member:', error)
      toast({
        title: 'Failed to remove member',
        description: error.message || 'An error occurred while removing the member.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          <Avatar>
            <AvatarImage src={member.user.avatar || undefined} alt={member.user.full_name} />
            <AvatarFallback>{getInitials(member.user.full_name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{member.user.full_name}</p>
              {isOwner && (
                <Badge variant="secondary" className="text-xs">
                  Owner
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
            {member.status === 'invited' && member.invited_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Invited {new Date(member.invited_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MemberStatusBadge status={member.status} />

          {canManage ? (
            <Select
              value={member.role}
              onValueChange={handleRoleChange}
              disabled={isUpdating || isOwner}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[130px] text-sm text-muted-foreground capitalize">{member.role}</div>
          )}

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {member.status === 'active' && (
                  <>
                    <DropdownMenuItem onClick={handleSuspend}>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Suspend
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeactivate}>
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                  </>
                )}

                {(member.status === 'suspended' || member.status === 'deactivated') && (
                  <DropdownMenuItem onClick={handleActivate}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowRemoveDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {member.user.full_name} from this workspace? This
              action cannot be undone. They will lose all access to workspace resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
