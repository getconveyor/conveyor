'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { workspaceApi, Plan } from '@/lib/api/workspace'
import { PlanCard } from './plan-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CreateWorkspaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateWorkspaceModal({ open, onOpenChange, onCreated }: CreateWorkspaceModalProps) {
  const { loadWorkspaces } = useWorkspace()
  const { toast } = useToast()

  const [step, setStep] = useState<'details' | 'plan'>('details')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open && step === 'plan') {
      loadPlans()
    }
  }, [open, step])

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)
    }
  }, [name])

  async function loadPlans() {
    try {
      setLoadingPlans(true)
      const data = await workspaceApi.getPlans()
      setPlans(data)
      // Auto-select free plan
      const freePlan = data.find((p) => p.plan_type === 'free')
      if (freePlan) {
        setSelectedPlan(freePlan)
      }
    } catch (err: any) {
      console.error('Failed to load plans:', err)
      toast({
        title: 'Failed to load plans',
        description: err.message || 'Could not load subscription plans',
        variant: 'destructive',
      })
    } finally {
      setLoadingPlans(false)
    }
  }

  async function handleSubmit() {
    if (!selectedPlan) {
      setError('Please select a plan')
      return
    }

    setLoading(true)
    setError('')

    try {
      await workspaceApi.createWorkspace({
        name,
        slug,
        description: description || undefined,
        plan_id: selectedPlan.id,
      })

      setSuccess(true)
      toast({
        title: 'Workspace created',
        description: `${name} has been created successfully.`,
      })

      await loadWorkspaces()

      setTimeout(() => {
        onCreated?.()
        handleClose()
      }, 1500)
    } catch (err: any) {
      console.error('Failed to create workspace:', err)

      let errorMessage = 'Failed to create workspace'

      if (err.response?.data?.slug) {
        errorMessage = `Slug: ${err.response.data.slug[0]}`
      } else if (err.response?.data?.name) {
        errorMessage = `Name: ${err.response.data.name[0]}`
      } else if (err.response?.data?.plan_id) {
        errorMessage = `Plan: ${err.response.data.plan_id[0]}`
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast({
        title: 'Failed to create workspace',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('details')
    setName('')
    setSlug('')
    setDescription('')
    setSelectedPlan(null)
    setError('')
    setSuccess(false)
    onOpenChange(false)
  }

  function handleNext() {
    if (!name.trim()) {
      setError('Workspace name is required')
      return
    }

    if (!slug.trim()) {
      setError('Workspace slug is required')
      return
    }

    setError('')
    setStep('plan')
  }

  function handleBack() {
    setError('')
    setStep('details')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' ? 'Create New Workspace' : 'Choose Your Plan'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details'
              ? 'Set up a new workspace to organize your data pipelines and team.'
              : 'Select a subscription plan for your workspace. You can upgrade or downgrade anytime.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Workspace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || success}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name for your workspace
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Workspace Slug *</Label>
              <Input
                id="slug"
                placeholder="my-awesome-workspace"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={loading || success}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (lowercase, hyphens allowed)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this workspace is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading || success}
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    selected={selectedPlan?.id === plan.id}
                    onSelect={setSelectedPlan}
                    showSelectButton
                    popular={plan.plan_type === 'professional'}
                  />
                ))}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>Workspace created successfully!</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'details' ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={loading}>
                Next: Choose Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading || success}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !selectedPlan || success}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {success ? 'Created!' : 'Create Workspace'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
