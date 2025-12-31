import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Workspace } from '@/lib/api/workspace'

interface MemberLimitIndicatorProps {
  workspace: Workspace
}

export function MemberLimitIndicator({ workspace }: MemberLimitIndicatorProps) {
  const activeMemberCount = workspace.member_count
  const maxMembers = workspace.subscription.plan.max_users
  const percentUsed = (activeMemberCount / maxMembers) * 100
  const isNearLimit = percentUsed >= 80
  const isAtLimit = percentUsed >= 100

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Team Members</span>
            <span className="text-sm text-muted-foreground">
              {activeMemberCount} / {maxMembers} used
            </span>
          </div>

          <Progress
            value={Math.min(percentUsed, 100)}
            className="h-2"
            indicatorClassName={
              isAtLimit
                ? 'bg-destructive'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-primary'
            }
          />

          {isNearLimit && (
            <Alert variant={isAtLimit ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isAtLimit
                  ? 'You have reached your member limit. Upgrade your plan to add more members.'
                  : "You're approaching your member limit. Consider upgrading your plan."}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground">
            Current plan: {workspace.subscription.plan.name}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
