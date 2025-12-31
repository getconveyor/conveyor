'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ChangePasswordModal } from '@/components/user/change-password-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Key, AlertCircle, Lock } from 'lucide-react'

export default function SecurityPage() {
  const { user } = useAuth()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  if (!user) {
    return (
      <div className="container max-w-4xl py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to view security settings.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security and authentication
          </p>
        </div>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Password</CardTitle>
            </div>
            <CardDescription>
              Change your password regularly to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Password</p>
                <p className="text-sm text-muted-foreground">••••••••••••</p>
              </div>
              <Button onClick={() => setChangePasswordOpen(true)}>Change Password</Button>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Password Tips:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Use a unique password you don't use anywhere else</li>
                  <li>• Make it at least 12 characters long</li>
                  <li>• Include uppercase, lowercase, numbers, and special characters</li>
                  <li>• Avoid common words or personal information</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication (Future Enhancement) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            <CardDescription>
              Add an extra layer of security to your account (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">Not configured</p>
              </div>
              <Button disabled>Enable 2FA</Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions (Future Enhancement) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Active Sessions</CardTitle>
            </div>
            <CardDescription>
              View and manage your active sessions (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">Current Session</p>
                  <p className="text-xs text-muted-foreground">
                    {user.last_login
                      ? `Active since ${new Date(user.last_login).toLocaleString()}`
                      : 'Active now'}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Revoke
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your current account security status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Not enabled</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Email Verified</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
            <CardDescription>Follow these tips to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Use a strong, unique password</li>
                    <li>⚠ Enable two-factor authentication (coming soon)</li>
                    <li>✓ Review your active sessions regularly</li>
                    <li>✓ Don't share your password with anyone</li>
                    <li>✓ Log out from shared devices</li>
                    <li>⚠ Be cautious of phishing attempts</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>
  )
}
