import { Plan } from '@/lib/api/workspace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface PlanCardProps {
  plan: Plan
  selected?: boolean
  onSelect?: (plan: Plan) => void
  showSelectButton?: boolean
  popular?: boolean
}

export function PlanCard({ plan, selected, onSelect, showSelectButton = false, popular = false }: PlanCardProps) {
  const price = plan.price_monthly
  const isFreePlan = plan.plan_type === 'free'

  return (
    <Card className={`relative ${selected ? 'ring-2 ring-primary' : ''} ${popular ? 'border-primary' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>Most Popular</Badge>
        </div>
      )}

      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          {!isFreePlan && (
            <p className="text-sm text-muted-foreground mt-1">
              or ${plan.price_yearly}/year (save ${(Number(price) * 12 - Number(plan.price_yearly)).toFixed(0)})
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">Up to {plan.max_users} team members</span>
          </div>

          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">{plan.max_pipelines} pipelines</span>
          </div>

          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">{plan.max_storage_gb} GB storage</span>
          </div>

          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">{plan.max_queries_per_day.toLocaleString()} queries/day</span>
          </div>

          {plan.features && Object.keys(plan.features).length > 0 && (
            <>
              {plan.features.advanced_analytics && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Advanced analytics</span>
                </div>
              )}

              {plan.features.priority_support && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Priority support</span>
                </div>
              )}

              {plan.features.custom_integrations && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Custom integrations</span>
                </div>
              )}

              {plan.features.sla_guarantee && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">SLA guarantee</span>
                </div>
              )}
            </>
          )}
        </div>

        {showSelectButton && onSelect && (
          <Button
            onClick={() => onSelect(plan)}
            variant={selected ? "default" : "outline"}
            className="w-full"
          >
            {selected ? 'Selected' : isFreePlan ? 'Start Free' : 'Select Plan'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
