"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authLoading && !user) {
      // Store the attempted URL to redirect after login
      sessionStorage.setItem('redirectAfterLogin', pathname)
      router.push('/login')
    } else if (!authLoading && user && !workspaceLoading) {
      // User is authenticated but no workspace selected
      // Redirect to workspace selection if not already there
      if (!currentWorkspace && pathname !== '/select-workspace') {
        router.push('/select-workspace')
      }
    }
  }, [user, authLoading, currentWorkspace, workspaceLoading, router, pathname])

  // Show loading state while checking authentication
  if (authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render children (will redirect)
  if (!user) {
    return null
  }

  // If authenticated but no workspace selected and not on workspace selection page, don't render
  if (!currentWorkspace && pathname !== '/select-workspace') {
    return null
  }

  // User is authenticated and workspace selected (or on workspace selection page), render children
  return <>{children}</>
}
