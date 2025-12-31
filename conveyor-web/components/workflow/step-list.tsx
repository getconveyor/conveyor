"use client"

import {
  IconAlertCircle,
  IconDatabase,
  IconWaveSine,
  IconTrash,
  IconPlus,
  IconGripVertical,
} from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WorkflowStep, StepType } from "@/lib/types/workflow"

interface StepListProps {
  steps: WorkflowStep[]
  selectedStepId?: string
  onSelectStep: (stepId: string) => void
  onAddStep: () => void
  onDeleteStep: (stepId: string) => void
  onReorderSteps: (startIndex: number, endIndex: number) => void
}

const stepTypeConfig: Record<StepType, { label: string; color: string; icon: React.ReactNode }> = {
  extract: { label: "Extract", color: "bg-blue-500", icon: <IconDatabase className="h-3 w-3" /> },
  transform: { label: "Transform", color: "bg-purple-500", icon: <IconWaveSine className="h-3 w-3" /> },
  load: { label: "Load", color: "bg-green-500", icon: <IconDatabase className="h-3 w-3" /> },
  validate: { label: "Validate", color: "bg-orange-500", icon: <IconAlertCircle className="h-3 w-3" /> },
  notify: { label: "Notify", color: "bg-pink-500", icon: <IconAlertCircle className="h-3 w-3" /> },
}

export function StepList({
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onDeleteStep,
  onReorderSteps,
}: StepListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold">Workflow Steps</h2>
          <p className="text-xs text-muted-foreground">
            {steps.length} {steps.length === 1 ? "step" : "steps"}
          </p>
        </div>
        <Button size="sm" onClick={onAddStep}>
          <IconPlus className="h-4 w-4 mr-1" />
          Add Step
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="rounded-full bg-muted p-3 mb-3">
              <IconAlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No steps yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add your first step to start building the workflow
            </p>
            <Button size="sm" onClick={onAddStep}>
              <IconPlus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>
        ) : (
          steps.map((step, index) => (
            <StepListItem
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isSelected={step.id === selectedStepId}
              onSelect={() => onSelectStep(step.id)}
              onDelete={() => onDeleteStep(step.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface StepListItemProps {
  step: WorkflowStep
  stepNumber: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function StepListItem({ step, stepNumber, isSelected, onSelect, onDelete }: StepListItemProps) {
  const config = stepTypeConfig[step.type]

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            <IconGripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
              {stepNumber}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${config.color} text-white text-xs`}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
            </div>
            <h3 className="font-medium text-sm mb-0.5 truncate">
              {step.name || "Untitled Step"}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {step.description || "No description"}
            </p>

            {/* Step details */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {step.notebookId && (
                <span className="flex items-center gap-1">
                  <IconDatabase className="h-3 w-3" />
                  Notebook
                </span>
              )}
              {step.inputSource && (
                <span>→ {step.inputSource.type}</span>
              )}
              {step.outputDestination && (
                <span>→ {step.outputDestination.type}</span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 flex-shrink-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <IconTrash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
