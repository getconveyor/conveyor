"use client"

import { useState } from "react"
import {
  IconUser,
  IconBell,
  IconShield,
  IconKey,
  IconPalette,
  IconDatabase,
  IconUsers,
  IconCreditCard,
  IconLock,
  IconMail,
  IconCheck,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [slackNotifications, setSlackNotifications] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [apiKeysVisible, setApiKeysVisible] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  JD
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.doe@company.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" defaultValue="Acme Corporation" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                    <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                    <SelectItem value="cst">CST (Central Standard Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Configure your workspace preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input id="workspaceName" defaultValue="Data Analytics Team" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultProject">Default Project</Label>
                <Select defaultValue="analytics">
                  <SelectTrigger id="defaultProject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytics">Analytics Dashboard</SelectItem>
                    <SelectItem value="etl">ETL Pipelines</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure which emails you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Workflow Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when workflows complete or fail
                  </p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alert Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when alerts are triggered
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary reports every Monday
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    News about product features and updates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Slack Integration</CardTitle>
              <CardDescription>
                Send notifications to Slack channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Connect your Slack workspace to receive notifications
                  </p>
                </div>
                <Switch checked={slackNotifications} onCheckedChange={setSlackNotifications} />
              </div>

              {slackNotifications && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="slackChannel">Default Channel</Label>
                    <Input id="slackChannel" placeholder="#data-alerts" />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <IconCheck className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Connected to Acme Corp workspace
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Enable 2FA</Label>
                    {twoFactorEnabled && (
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Require a verification code when signing in
                  </p>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>

              {twoFactorEnabled && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label>Authenticator App</Label>
                    <div className="flex items-center gap-2">
                      <Input value="Google Authenticator" disabled />
                      <Button variant="outline">Reconfigure</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Backup Codes</Label>
                    <p className="text-sm text-muted-foreground">
                      5 of 10 backup codes remaining
                    </p>
                    <Button variant="outline" size="sm">
                      View Backup Codes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Production API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {apiKeysVisible ? "sk_live_1234567890abcdef" : "sk_live_••••••••••••cdef"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created on Jan 15, 2024
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setApiKeysVisible(!apiKeysVisible)}
                    >
                      {apiKeysVisible ? "Hide" : "Show"}
                    </Button>
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Development API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {apiKeysVisible ? "sk_test_abcdef1234567890" : "sk_test_••••••••••••7890"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created on Dec 10, 2023
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setApiKeysVisible(!apiKeysVisible)}
                    >
                      {apiKeysVisible ? "Hide" : "Show"}
                    </Button>
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="outline">
                <IconKey className="h-4 w-4 mr-2" />
                Create New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>
                Connect to your data sources and warehouses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded flex items-center justify-center">
                    <IconDatabase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">PostgreSQL</p>
                    <p className="text-sm text-muted-foreground">
                      prod-db.company.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950 rounded flex items-center justify-center">
                    <IconDatabase className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Amazon Redshift</p>
                    <p className="text-sm text-muted-foreground">
                      analytics-cluster.us-east-1
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950 rounded flex items-center justify-center">
                    <IconDatabase className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Snowflake</p>
                    <p className="text-sm text-muted-foreground">
                      Not connected
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>

              <Button variant="outline" className="w-full">
                Add Data Source
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
              <CardDescription>
                Integrate with external tools and services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-950 rounded flex items-center justify-center">
                    <IconMail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to Slack
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-950 rounded flex items-center justify-center">
                    <IconBell className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">PagerDuty</p>
                    <p className="text-sm text-muted-foreground">
                      Incident management and alerting
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded flex items-center justify-center">
                    <IconUsers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Microsoft Teams</p>
                    <p className="text-sm text-muted-foreground">
                      Collaborate with your team
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
