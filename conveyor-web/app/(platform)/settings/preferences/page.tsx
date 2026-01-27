'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { authService } from '@/lib/api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Palette, Bell, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function PreferencesPage() {
  const { user, tokens, refreshUser } = useAuth()
  const { toast } = useToast()

  const [theme, setTheme] = useState<string>('system')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [timezone, setTimezone] = useState('UTC')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.preferences) {
      setTheme(user.preferences.theme || 'system')
      setEmailNotifications(user.preferences.emailNotifications ?? true)
      setPushNotifications(user.preferences.pushNotifications ?? false)
      setTimezone(user.preferences.timezone || 'UTC')
      setLanguage(user.preferences.language || 'en')
    }
  }, [user])

  async function handleSave() {
    if (!tokens?.access) return

    setLoading(true)
    setError('')

    try {
      const preferences = {
        theme,
        emailNotifications,
        pushNotifications,
        timezone,
        language,
      }

      await authService.updatePreferences(preferences, tokens.access, false)
      await refreshUser?.()

      toast({
        title: 'Preferences saved',
        description: 'Your preferences have been updated successfully.',
      })
    } catch (err: any) {
      console.error('Failed to save preferences:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save preferences'
      setError(errorMessage)
      toast({
        title: 'Failed to save preferences',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    if (user?.preferences) {
      setTheme(user.preferences.theme || 'system')
      setEmailNotifications(user.preferences.emailNotifications ?? true)
      setPushNotifications(user.preferences.pushNotifications ?? false)
      setTimezone(user.preferences.timezone || 'UTC')
      setLanguage(user.preferences.language || 'en')
      setError('')
    }
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to manage your preferences.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const hasChanges =
    theme !== (user.preferences?.theme || 'system') ||
    emailNotifications !== (user.preferences?.emailNotifications ?? true) ||
    pushNotifications !== (user.preferences?.pushNotifications ?? false) ||
    timezone !== (user.preferences?.timezone || 'UTC') ||
    language !== (user.preferences?.language || 'en')

  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground mt-2">
            Customize your experience and notification settings
          </p>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how Conveyor looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme} disabled={loading}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your preferred color scheme
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your account and workspaces
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser notifications for important events
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localization
            </CardTitle>
            <CardDescription>
              Set your timezone and language preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone} disabled={loading}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (GMT-6)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (GMT-7)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (GMT+8)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (GMT+11)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All times will be displayed in this timezone
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={loading}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred language
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={loading || !hasChanges}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading || !hasChanges}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
