"use client"

import { useState } from "react"
import {
  IconAlertCircle,
  IconDatabase,
  IconFile,
  IconApi,
  IconWaveSine,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { NotebookSelector } from "@/components/workflow/notebook-selector"
import { WorkflowStep, StepType, DataSourceType, FailureAction } from "@/lib/types/workflow"

interface Notebook {
  id: string
  name: string
  description: string
  kernel: string
  language: string
}

interface StepEditorProps {
  step: WorkflowStep
  notebooks: Notebook[]
  onUpdate: (step: WorkflowStep) => void
}

const stepTypeConfig: Record<StepType, { label: string; color: string; icon: React.ReactNode }> = {
  extract: { label: "Extract", color: "bg-blue-500", icon: <IconDatabase className="h-3 w-3" /> },
  transform: { label: "Transform", color: "bg-purple-500", icon: <IconWaveSine className="h-3 w-3" /> },
  load: { label: "Load", color: "bg-green-500", icon: <IconDatabase className="h-3 w-3" /> },
  validate: { label: "Validate", color: "bg-orange-500", icon: <IconAlertCircle className="h-3 w-3" /> },
  notify: { label: "Notify", color: "bg-pink-500", icon: <IconAlertCircle className="h-3 w-3" /> },
}

const dataSourceTypeIcons: Record<DataSourceType, React.ReactNode> = {
  database: <IconDatabase className="h-4 w-4" />,
  file: <IconFile className="h-4 w-4" />,
  api: <IconApi className="h-4 w-4" />,
  stream: <IconWaveSine className="h-4 w-4" />,
}

export function StepEditor({ step, notebooks, onUpdate }: StepEditorProps) {
  const updateField = <K extends keyof WorkflowStep>(field: K, value: WorkflowStep[K]) => {
    onUpdate({ ...step, [field]: value })
  }

  const updateInputSource = <K extends keyof NonNullable<WorkflowStep["inputSource"]>>(
    field: K,
    value: NonNullable<WorkflowStep["inputSource"]>[K]
  ) => {
    updateField("inputSource", {
      ...step.inputSource,
      [field]: value,
    } as WorkflowStep["inputSource"])
  }

  const updateOutputDestination = <K extends keyof NonNullable<WorkflowStep["outputDestination"]>>(
    field: K,
    value: NonNullable<WorkflowStep["outputDestination"]>[K]
  ) => {
    updateField("outputDestination", {
      ...step.outputDestination,
      [field]: value,
    } as WorkflowStep["outputDestination"])
  }

  const updateErrorHandling = <K extends keyof WorkflowStep["errorHandling"]>(
    field: K,
    value: WorkflowStep["errorHandling"][K]
  ) => {
    updateField("errorHandling", {
      ...step.errorHandling,
      [field]: value,
    })
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-6">
      {/* Step Header */}
      <div className="flex items-center gap-2">
        <Badge className={`${stepTypeConfig[step.type].color} text-white`}>
          {stepTypeConfig[step.type].icon}
          <span className="ml-1">{stepTypeConfig[step.type].label}</span>
        </Badge>
        <span className="text-sm text-muted-foreground">Step {step.order + 1}</span>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step-name">Step Name</Label>
            <Input
              id="step-name"
              value={step.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Extract Customer Data"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-description">Description</Label>
            <Textarea
              id="step-description"
              value={step.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe what this step does..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-type">Step Type</Label>
            <Select value={step.type} onValueChange={(value) => updateField("type", value as StepType)}>
              <SelectTrigger id="step-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stepTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notebook/Code Reference */}
      {(step.type === "transform" || step.type === "validate") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transformation Code</CardTitle>
            <CardDescription>
              Select a notebook to run for this step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="notebook">Notebook</Label>
            <NotebookSelector
              notebooks={notebooks}
              selectedNotebookId={step.notebookId}
              onSelect={(notebookId) => updateField("notebookId", notebookId)}
              placeholder="Select notebook to execute..."
            />
          </CardContent>
        </Card>
      )}

      {/* Input Source */}
      {(step.type === "extract" || step.type === "transform" || step.type === "validate") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Input Source</CardTitle>
            <CardDescription>
              Where this step reads data from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-type">Source Type</Label>
              <Select
                value={step.inputSource?.type || "database"}
                onValueChange={(value) => updateInputSource("type", value as DataSourceType)}
              >
                <SelectTrigger id="input-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.database}
                      Database
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.file}
                      File
                    </div>
                  </SelectItem>
                  <SelectItem value="api">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.api}
                      API
                    </div>
                  </SelectItem>
                  <SelectItem value="stream">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.stream}
                      Stream
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {step.inputSource?.type === "database" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="input-connection">Connection</Label>
                  <Input
                    id="input-connection"
                    value={step.inputSource?.connectionId || ""}
                    onChange={(e) => updateInputSource("connectionId", e.target.value)}
                    placeholder="Connection ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-query">Query/Table</Label>
                  <Textarea
                    id="input-query"
                    value={step.inputSource?.query || ""}
                    onChange={(e) => updateInputSource("query", e.target.value)}
                    placeholder="SELECT * FROM table_name"
                    rows={3}
                  />
                </div>
              </>
            )}

            {step.inputSource?.type === "file" && (
              <div className="space-y-2">
                <Label htmlFor="input-path">File Path</Label>
                <Input
                  id="input-path"
                  value={step.inputSource?.path || ""}
                  onChange={(e) => updateInputSource("path", e.target.value)}
                  placeholder="/data/raw/customers.csv"
                />
              </div>
            )}

            {step.inputSource?.type === "api" && (
              <div className="space-y-2">
                <Label htmlFor="input-api">API Endpoint</Label>
                <Input
                  id="input-api"
                  value={step.inputSource?.path || ""}
                  onChange={(e) => updateInputSource("path", e.target.value)}
                  placeholder="https://api.example.com/data"
                />
              </div>
            )}

            {step.inputSource?.type === "stream" && (
              <div className="space-y-2">
                <Label htmlFor="input-stream">Stream Connection</Label>
                <Input
                  id="input-stream"
                  value={step.inputSource?.connectionId || ""}
                  onChange={(e) => updateInputSource("connectionId", e.target.value)}
                  placeholder="Kafka/Kinesis connection"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Output Destination */}
      {(step.type === "load" || step.type === "transform") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Output Destination</CardTitle>
            <CardDescription>
              Where this step writes data to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="output-type">Destination Type</Label>
              <Select
                value={step.outputDestination?.type || "database"}
                onValueChange={(value) => updateOutputDestination("type", value as DataSourceType)}
              >
                <SelectTrigger id="output-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.database}
                      Database
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.file}
                      File
                    </div>
                  </SelectItem>
                  <SelectItem value="api">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.api}
                      API
                    </div>
                  </SelectItem>
                  <SelectItem value="stream">
                    <div className="flex items-center gap-2">
                      {dataSourceTypeIcons.stream}
                      Stream
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {step.outputDestination?.type === "database" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="output-connection">Connection</Label>
                  <Input
                    id="output-connection"
                    value={step.outputDestination?.connectionId || ""}
                    onChange={(e) => updateOutputDestination("connectionId", e.target.value)}
                    placeholder="Connection ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="output-table">Table Name</Label>
                  <Input
                    id="output-table"
                    value={step.outputDestination?.tableName || ""}
                    onChange={(e) => updateOutputDestination("tableName", e.target.value)}
                    placeholder="target_table"
                  />
                </div>
              </>
            )}

            {step.outputDestination?.type === "file" && (
              <div className="space-y-2">
                <Label htmlFor="output-path">File Path</Label>
                <Input
                  id="output-path"
                  value={step.outputDestination?.path || ""}
                  onChange={(e) => updateOutputDestination("path", e.target.value)}
                  placeholder="/data/processed/output.parquet"
                />
              </div>
            )}

            {step.outputDestination?.type === "api" && (
              <div className="space-y-2">
                <Label htmlFor="output-api">API Endpoint</Label>
                <Input
                  id="output-api"
                  value={step.outputDestination?.path || ""}
                  onChange={(e) => updateOutputDestination("path", e.target.value)}
                  placeholder="https://api.example.com/ingest"
                />
              </div>
            )}

            {step.outputDestination?.type === "stream" && (
              <div className="space-y-2">
                <Label htmlFor="output-stream">Stream Connection</Label>
                <Input
                  id="output-stream"
                  value={step.outputDestination?.connectionId || ""}
                  onChange={(e) => updateOutputDestination("connectionId", e.target.value)}
                  placeholder="Kafka/Kinesis connection"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Error Handling</CardTitle>
          <CardDescription>
            Configure how failures are handled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retry-attempts">Retry Attempts</Label>
            <Input
              id="retry-attempts"
              type="number"
              min="0"
              max="10"
              value={step.errorHandling.retryAttempts}
              onChange={(e) => updateErrorHandling("retryAttempts", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="on-failure">On Failure</Label>
            <Select
              value={step.errorHandling.onFailure}
              onValueChange={(value) => updateErrorHandling("onFailure", value as FailureAction)}
            >
              <SelectTrigger id="on-failure">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stop">Stop Workflow</SelectItem>
                <SelectItem value="continue">Continue to Next Step</SelectItem>
                <SelectItem value="notify">Notify and Stop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-emails">Alert Emails (comma-separated)</Label>
            <Input
              id="alert-emails"
              value={step.errorHandling.alertEmails?.join(", ") || ""}
              onChange={(e) => {
                const emails = e.target.value
                  .split(",")
                  .map((email) => email.trim())
                  .filter((email) => email.length > 0)
                updateErrorHandling("alertEmails", emails)
              }}
              placeholder="admin@example.com, team@example.com"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
