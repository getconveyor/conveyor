'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { CreateWorkspaceModal } from './create-workspace-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronsUpDown, Check, Plus, Loader2 } from 'lucide-react'

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace, loading } = useWorkspace()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  async function handleSwitch(workspaceId: string) {
    if (workspaceId === currentWorkspace?.id) return

    try {
      setSwitching(true)
      await switchWorkspace(workspaceId)
    } catch (error) {
      console.error('Failed to switch workspace:', error)
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-[200px]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (!currentWorkspace) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </Button>

        <CreateWorkspaceModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-[200px] justify-between" disabled={switching}>
            {switching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="truncate">Switching...</span>
              </>
            ) : (
              <>
                <span className="truncate">{currentWorkspace.name}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[200px]" align="start">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSwitch(workspace.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm">{workspace.name}</span>
                    {workspace.id === currentWorkspace.id && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                  {workspace.status !== 'active' && (
                    <Badge variant="secondary" className="text-xs w-fit">
                      {workspace.status}
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setCreateModalOpen(true)} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={() => {
          // Workspace will be auto-selected after creation
        }}
      />
    </>
  )
}
