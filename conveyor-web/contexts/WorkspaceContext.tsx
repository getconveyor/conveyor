'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { workspaceApi, Workspace, WorkspaceMember } from '@/lib/api/workspace'
import { useAuth } from './auth-context'

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  currentMembership: WorkspaceMember | null
  loading: boolean
  error: string | null
  loadWorkspaces: () => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<void>
  setCurrentWorkspace: (workspace: Workspace | null) => void
  refreshCurrentWorkspace: () => Promise<void>
  canManageMembers: boolean
  canManageBilling: boolean
  isOwner: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [currentMembership, setCurrentMembership] = useState<WorkspaceMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load workspaces when user is authenticated
  useEffect(() => {
    if (user) {
      loadWorkspaces()
    } else {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setCurrentMembership(null)
      setLoading(false)
    }
  }, [user])

  // Load current workspace from localStorage on mount
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      if (savedWorkspaceId) {
        const workspace = workspaces.find((w) => w.id === savedWorkspaceId)
        if (workspace) {
          setCurrentWorkspace(workspace)
          loadCurrentMembership(workspace.id)
        } else {
          // Workspace ID in localStorage doesn't exist anymore
          localStorage.removeItem('currentWorkspaceId')
          setLoading(false)
        }
      } else {
        // No saved workspace, stop loading
        setLoading(false)
      }
    }
  }, [workspaces, currentWorkspace])

  // Save current workspace to localStorage when it changes
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id)
    }
  }, [currentWorkspace])

  async function loadWorkspaces() {
    try {
      setLoading(true)
      setError(null)
      const data = await workspaceApi.getWorkspaces()
      setWorkspaces(data)
      // Note: loading will be set to false in the useEffect that restores workspace from localStorage
      // or when there's no saved workspace
    } catch (err: any) {
      console.error('Failed to load workspaces:', err)
      setError(err.message || 'Failed to load workspaces')
      setLoading(false)
    }
  }

  async function loadCurrentMembership(workspaceId: string) {
    if (!user) return

    try {
      const members = await workspaceApi.getMembers(workspaceId)
      const membership = members.find((m) => m.user.id === user.id)
      setCurrentMembership(membership || null)
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load membership:', err)
      setLoading(false)
    }
  }

  async function switchWorkspace(workspaceId: string) {
    try {
      setError(null)
      const response = await workspaceApi.switchWorkspace(workspaceId)
      setCurrentWorkspace(response.workspace)
      setCurrentMembership(response.membership)
    } catch (err: any) {
      console.error('Failed to switch workspace:', err)
      setError(err.message || 'Failed to switch workspace')
      throw err
    }
  }

  async function refreshCurrentWorkspace() {
    if (!currentWorkspace) return

    try {
      const updated = await workspaceApi.getWorkspace(currentWorkspace.id)
      setCurrentWorkspace(updated)

      // Also refresh the workspace in the list
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w))
      )

      // Refresh membership
      await loadCurrentMembership(updated.id)
    } catch (err: any) {
      console.error('Failed to refresh workspace:', err)
      setError(err.message || 'Failed to refresh workspace')
    }
  }

  // Computed permissions
  const canManageMembers = currentMembership?.role === 'owner' || currentMembership?.role === 'admin'
  const canManageBilling = currentMembership?.role === 'owner'
  const isOwner = currentMembership?.role === 'owner'

  const value: WorkspaceContextType = {
    workspaces,
    currentWorkspace,
    currentMembership,
    loading,
    error,
    loadWorkspaces,
    switchWorkspace,
    setCurrentWorkspace,
    refreshCurrentWorkspace,
    canManageMembers,
    canManageBilling,
    isOwner,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
