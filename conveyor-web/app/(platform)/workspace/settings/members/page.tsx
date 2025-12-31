'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { workspaceApi, WorkspaceMember } from '@/lib/api/workspace'
import { MemberRow } from '@/components/workspace/member-row'
import { MemberLimitIndicator } from '@/components/workspace/member-limit-indicator'
import { InviteMemberModal } from '@/components/workspace/invite-member-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, AlertCircle, Users } from 'lucide-react'

export default function MembersPage() {
  const { currentWorkspace, canManageMembers } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers()
    }
  }, [currentWorkspace])

  async function loadMembers() {
    if (!currentWorkspace) return

    try {
      setLoading(true)
      setError(null)
      const data = await workspaceApi.getMembers(currentWorkspace.id)
      // Sort: owner first, then by role, then by name
      const sorted = data.sort((a, b) => {
        if (a.role === 'owner') return -1
        if (b.role === 'owner') return 1
        if (a.role !== b.role) {
          const roleOrder = ['admin', 'developer', 'analyst', 'viewer']
          return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
        }
        return a.user.full_name.localeCompare(b.user.full_name)
      })
      setMembers(sorted)
    } catch (err: any) {
      console.error('Failed to load members:', err)
      setError(err.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="container max-w-6xl py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a workspace to manage members.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
            <p className="text-muted-foreground mt-2">
              Manage who has access to {currentWorkspace.name}
            </p>
          </div>

          {canManageMembers && (
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>

        {/* Member Limit Indicator */}
        <MemberLimitIndicator workspace={currentWorkspace} />

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({members.length})
            </CardTitle>
            <CardDescription>
              All members of this workspace and their roles
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
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-8 w-[130px]" />
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
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members found</p>
              </div>
            ) : (
              <div>
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} onUpdate={loadMembers} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>
              Each role has different levels of access to workspace features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Owner</h4>
              <p className="text-sm text-muted-foreground">
                Full control over the workspace including billing, member management, and all features.
                Cannot be suspended or removed.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Admin</h4>
              <p className="text-sm text-muted-foreground">
                Can manage members, workspace settings, and access all features. Cannot manage billing
                or delete the workspace.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Developer</h4>
              <p className="text-sm text-muted-foreground">
                Full access to create and manage pipelines, connections, transformations, and data
                resources.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Analyst</h4>
              <p className="text-sm text-muted-foreground">
                Can view data, run queries, create reports, and access analytics features. Cannot
                create or modify pipelines.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Viewer</h4>
              <p className="text-sm text-muted-foreground">
                Read-only access to view dashboards, reports, and workspace resources. Cannot create or
                modify anything.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvited={loadMembers}
      />
    </div>
  )
}
