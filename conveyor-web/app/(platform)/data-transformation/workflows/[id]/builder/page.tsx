"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlayerPlay,
  IconAlertCircle,
  IconPlus,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StepList } from "@/components/workflow/step-list"
import { StepEditor } from "@/components/workflow/step-editor"
import { WorkflowStep, Workflow } from "@/lib/types/workflow"
import { getTemplate } from "@/lib/templates/workflow-templates"

// Mock notebooks data (in real app, this would come from API)
const mockNotebooks = [
  {
    id: "1",
    name: "Customer Segmentation Analysis",
    description: "Cluster analysis for customer segmentation using K-means",
    kernel: "Python 3.11",
    language: "python",
  },
  {
    id: "2",
    name: "Sales Forecasting Model",
    description: "Time series forecasting using ARIMA and Prophet",
    kernel: "Python 3.11",
    language: "python",
  },
  {
    id: "3",
    name: "Data Quality Exploration",
    description: "Exploratory data analysis for quality checks",
    kernel: "Python 3.11",
    language: "python",
  },
  {
    id: "4",
    name: "SQL Query Development",
    description: "Complex SQL queries for data transformation",
    kernel: "SQL",
    language: "sql",
  },
  {
    id: "5",
    name: "Feature Engineering Pipeline",
    description: "Feature extraction and transformation for ML models",
    kernel: "Python 3.11",
    language: "python",
  },
]

export default function WorkflowBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string

  const [workflowName, setWorkflowName] = useState("")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  // Initialize workflow from template or load existing
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if we're creating a new workflow from template
      const templateData = sessionStorage.getItem("new-workflow-template")
      if (templateData && workflowId === "new") {
        const data = JSON.parse(templateData)
        setWorkflowName(data.name || "")
        setWorkflowDescription(data.description || "")

        // Generate steps from template
        if (data.template) {
          const template = getTemplate(data.template)
          if (template) {
            const generatedSteps = template.generateSteps()
            setSteps(generatedSteps)
            if (generatedSteps.length > 0) {
              setSelectedStepId(generatedSteps[0].id)
            }
          }
        }

        // Clear the template data
        sessionStorage.removeItem("new-workflow-template")
      } else if (workflowId !== "new") {
        // TODO: Load existing workflow from API
        // For now, just show empty state
        setWorkflowName("Existing Workflow")
        setWorkflowDescription("Load from API")
      }
    }
  }, [workflowId])

  const selectedStep = steps.find((s) => s.id === selectedStepId)

  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: Math.random().toString(36).substring(2, 9),
      name: "New Step",
      description: "",
      type: "transform",
      errorHandling: {
        retryAttempts: 3,
        onFailure: "stop",
        alertEmails: [],
      },
      order: steps.length,
    }
    setSteps([...steps, newStep])
    setSelectedStepId(newStep.id)
  }

  const handleDeleteStep = (stepId: string) => {
    const newSteps = steps.filter((s) => s.id !== stepId)
    // Reorder remaining steps
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index,
    }))
    setSteps(reorderedSteps)
    if (selectedStepId === stepId) {
      setSelectedStepId(reorderedSteps[0]?.id)
    }
  }

  const handleUpdateStep = (updatedStep: WorkflowStep) => {
    setSteps(steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)))
  }

  const handleReorderSteps = (startIndex: number, endIndex: number) => {
    const result = Array.from(steps)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    // Update order property
    const reorderedSteps = result.map((step, index) => ({
      ...step,
      order: index,
    }))
    setSteps(reorderedSteps)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Save to API
    console.log("Saving workflow:", {
      name: workflowName,
      description: workflowDescription,
      steps,
    })

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)

    // Navigate back to workflows list
    router.push("/data-transformation/workflows")
  }

  const handleRunTest = () => {
    // TODO: Implement test run
    console.log("Running test workflow")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/data-transformation/workflows")}
            >
              <IconArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex-1 min-w-0">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Workflow name..."
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-2"
              />
              <Input
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Add a description..."
                className="text-sm text-muted-foreground border-none shadow-none focus-visible:ring-0 px-2"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRunTest}>
              <IconPlayerPlay className="h-4 w-4 mr-1" />
              Test Run
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || !workflowName}>
              <IconDeviceFloppy className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Step List */}
        <div className="w-80 border-r bg-muted/30">
          <StepList
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onAddStep={handleAddStep}
            onDeleteStep={handleDeleteStep}
            onReorderSteps={handleReorderSteps}
          />
        </div>

        {/* Right Panel - Step Editor */}
        <div className="flex-1 overflow-hidden">
          {selectedStep ? (
            <div className="h-full overflow-y-auto p-5">
              <StepEditor
                step={selectedStep}
                notebooks={mockNotebooks}
                onUpdate={handleUpdateStep}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-5">
              <div className="rounded-full bg-muted p-4 mb-4">
                <IconAlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Step Selected</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {steps.length === 0
                  ? "Add your first step to start building the workflow"
                  : "Select a step from the left panel to edit its configuration"}
              </p>
              {steps.length === 0 && (
                <Button onClick={handleAddStep}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add First Step
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
