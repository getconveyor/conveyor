'use client'

import { useState, useEffect } from 'react'
import { workspaceApi, Plan } from '@/lib/api/workspace'
import { PlanCard } from '@/components/workspace/plan-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Zap } from 'lucide-react'

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      setLoading(true)
      setError(null)
      const data = await workspaceApi.getPlans()
      setPlans(data)
    } catch (err: any) {
      console.error('Failed to load plans:', err)
      setError(err.message || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your data platform needs. All plans include core features
            with no hidden fees.
          </p>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                popular={plan.plan_type === 'professional'}
              />
            ))}
          </div>
        )}

        {/* Features Comparison */}
        {!loading && !error && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center p-4 font-medium">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">Team Members</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.max_users}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Pipelines</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.max_pipelines}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Storage</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.max_storage_gb} GB
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Queries per Day</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.max_queries_per_day.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Advanced Analytics</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.features?.advanced_analytics ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Priority Support</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.features?.priority_support ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Custom Integrations</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.features?.custom_integrations ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">SLA Guarantee</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {plan.features?.sla_guarantee ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can change your plan at any time. Upgrades take effect immediately, and
                downgrades take effect at the end of your billing period.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">What happens if I exceed my limits?</h3>
              <p className="text-sm text-muted-foreground">
                You'll be notified when approaching your limits. For pipelines and storage, you'll
                need to upgrade. For queries, requests may be throttled.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Is there a trial period?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! All new workspaces start with a 14-day trial period to test the platform with
                full features.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely. You can cancel your subscription at any time. You'll retain access until
                the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
