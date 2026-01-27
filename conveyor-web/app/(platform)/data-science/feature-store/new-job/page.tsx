"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconWand,
  IconArrowRight,
  IconArrowsRight,
  IconCheck,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFeatureGroups,
  useCreateFeatureEngineeringJob,
} from "@/hooks/use-datascience";
import {
  FeatureGroup,
  FeatureEngineeringStep,
  DataPrepConfig,
} from "@/lib/api/datascience";

const TRANSFORMATION_TYPES = [
  { value: "passthrough", label: "Passthrough (No Transform)" },
  { value: "standard_scale", label: "Standard Scaling (Z-score)" },
  { value: "min_max_scale", label: "Min-Max Scaling" },
  { value: "log_transform", label: "Log Transform" },
  { value: "one_hot", label: "One-Hot Encoding" },
  { value: "label_encode", label: "Label Encoding" },
  { value: "bucketize", label: "Bucketize (Binning)" },
  { value: "time_since", label: "Time Since (Duration)" },
  { value: "date_parts", label: "Date Parts Extraction" },
  { value: "rolling_agg", label: "Rolling Aggregation" },
  { value: "custom_sql", label: "Custom SQL" },
];

const NULL_STRATEGIES = [
  { value: "drop", label: "Drop rows with nulls" },
  { value: "fill_mean", label: "Fill with mean" },
  { value: "fill_median", label: "Fill with median" },
  { value: "fill_mode", label: "Fill with mode" },
  { value: "fill_value", label: "Fill with specific value" },
  { value: "forward_fill", label: "Forward fill" },
  { value: "backward_fill", label: "Backward fill" },
];

const OUTLIER_METHODS = [
  { value: "none", label: "Don't handle outliers" },
  { value: "zscore", label: "Z-score method" },
  { value: "iqr", label: "IQR method" },
  { value: "percentile", label: "Percentile clipping" },
];

interface TransformStep {
  id: string;
  source_columns: string[];
  output_column: string;
  transformation_type: string;
  parameters: Record<string, any>;
}

export default function NewFeatureEngineeringJobPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  // Use hooks instead of manual loading
  const { data: featureGroups = [], isLoading: loadingGroups } =
    useFeatureGroups();
  const createJobMutation = useCreateFeatureEngineeringJob();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    source_feature_group: "",
    target_feature_group: "",
    schedule_cron: "",
    is_active: true,
  });

  const [dataPrep, setDataPrep] = useState<DataPrepConfig>({
    handle_nulls: {
      strategy: "fill_mean",
      columns: [],
      fill_value: null,
    },
    handle_outliers: {
      method: "clip",
      columns: [],
      lower: 3,
    },
    deduplicate: undefined,
  });

  const [transformations, setTransformations] = useState<TransformStep[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDataPrepChange = (field: string, value: any) => {
    setDataPrep((prev) => ({ ...prev, [field]: value }));
  };

  const addTransformation = () => {
    setTransformations([
      ...transformations,
      {
        id: `transform_${Date.now()}`,
        source_columns: [],
        output_column: "",
        transformation_type: "passthrough",
        parameters: {},
      },
    ]);
  };

  const updateTransformation = (index: number, field: string, value: any) => {
    const newTransformations = [...transformations];
    (newTransformations[index] as any)[field] = value;
    setTransformations(newTransformations);
  };

  const removeTransformation = (index: number) => {
    setTransformations(transformations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const steps: FeatureEngineeringStep[] = transformations.map((t, i) => ({
        name: t.output_column,
        type: t.transformation_type,
        source: t.source_columns[0] || "",
        config: t.parameters,
      }));

      await createJobMutation.mutateAsync({
        ...formData,
        data_prep_config: dataPrep,
        feature_engineering_steps: steps,
      });

      router.push("/data-science/feature-store");
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create feature engineering job. Please try again.");
    }
  };

  const steps = [
    { label: "Basic Info", description: "Name and source/target" },
    { label: "Data Prep", description: "Clean and prepare data" },
    { label: "Transformations", description: "Define feature transforms" },
    { label: "Schedule", description: "Automation settings" },
  ];

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return formData.name && formData.source_feature_group;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/data-science/feature-store">
          <Button variant="ghost" size="icon">
            <IconArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Feature Engineering Job</h1>
          <p className="text-muted-foreground">
            Define transformations to compute new features
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < activeStep
                  ? "bg-primary text-primary-foreground"
                  : index === activeStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < activeStep ? (
                <IconCheck className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
            {index < steps.length - 1 && (
              <IconArrowsRight className="w-6 h-6 mx-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 0: Basic Info */}
        {activeStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Name your job and select source data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Job Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., customer_feature_pipeline"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this job does..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Feature Group *</Label>
                  <Select
                    value={formData.source_feature_group}
                    onValueChange={(value) =>
                      handleInputChange("source_feature_group", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {featureGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Input features for transformation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Target Feature Group</Label>
                  <Select
                    value={formData.target_feature_group}
                    onValueChange={(value) =>
                      handleInputChange("target_feature_group", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Create new group</SelectItem>
                      {featureGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Where to write computed features
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Data Preparation */}
        {activeStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Preparation</CardTitle>
              <CardDescription>
                Configure data cleaning and preparation steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Null Handling */}
              <div className="space-y-4">
                <h3 className="font-semibold">Null Value Handling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Strategy</Label>
                    <Select
                      value={dataPrep.handle_nulls?.strategy || ""}
                      onValueChange={(value) =>
                        handleDataPrepChange("handle_nulls", {
                          ...dataPrep.handle_nulls,
                          strategy: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NULL_STRATEGIES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {dataPrep.handle_nulls?.strategy === "fill" && (
                    <div className="space-y-2">
                      <Label>Fill Value</Label>
                      <Input
                        placeholder="Value to use"
                        value={dataPrep.handle_nulls?.fill_value ?? ""}
                        onChange={(e) =>
                          handleDataPrepChange("handle_nulls", {
                            ...dataPrep.handle_nulls,
                            fill_value: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Apply to Columns (comma-separated, empty for all)
                  </Label>
                  <Input
                    placeholder="col1, col2, col3"
                    value={(dataPrep.handle_nulls?.columns || []).join(", ")}
                    onChange={(e) =>
                      handleDataPrepChange("handle_nulls", {
                        ...dataPrep.handle_nulls,
                        columns: e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>

              {/* Outlier Handling */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Outlier Handling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select
                      value={dataPrep.handle_outliers?.method || "none"}
                      onValueChange={(value) =>
                        handleDataPrepChange(
                          "handle_outliers",
                          value === "none"
                            ? undefined
                            : {
                                ...dataPrep.handle_outliers,
                                method: value,
                              }
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OUTLIER_METHODS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {dataPrep.handle_outliers && (
                    <div className="space-y-2">
                      <Label>Threshold</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dataPrep.handle_outliers?.lower ?? 3}
                        onChange={(e) =>
                          handleDataPrepChange("handle_outliers", {
                            ...dataPrep.handle_outliers,
                            lower: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {dataPrep.handle_outliers && (
                  <div className="space-y-2">
                    <Label>Apply to Columns</Label>
                    <Input
                      placeholder="col1, col2, col3"
                      value={(dataPrep.handle_outliers?.columns || []).join(
                        ", "
                      )}
                      onChange={(e) =>
                        handleDataPrepChange("handle_outliers", {
                          ...dataPrep.handle_outliers,
                          columns: e.target.value
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Deduplication */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Deduplication</h3>
                    <p className="text-sm text-muted-foreground">
                      Remove duplicate rows
                    </p>
                  </div>
                  <Switch
                    checked={!!dataPrep.deduplicate}
                    onCheckedChange={(checked) =>
                      handleDataPrepChange(
                        "deduplicate",
                        checked ? { columns: [] } : undefined
                      )
                    }
                  />
                </div>

                {dataPrep.deduplicate && (
                  <div className="space-y-2">
                    <Label>Columns for uniqueness check</Label>
                    <Input
                      placeholder="Leave empty for all columns"
                      value={(dataPrep.deduplicate.columns || []).join(", ")}
                      onChange={(e) =>
                        handleDataPrepChange("deduplicate", {
                          ...dataPrep.deduplicate,
                          columns: e.target.value
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Transformations */}
        {activeStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Feature Transformations</CardTitle>
                  <CardDescription>
                    Define how to transform source features
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTransformation}
                >
                  <IconPlus className="w-4 h-4 mr-2" />
                  Add Transformation
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {transformations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <IconWand className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transformations defined yet</p>
                  <p className="text-sm">
                    Click "Add Transformation" to start building your pipeline
                  </p>
                </div>
              ) : (
                transformations.map((transform, index) => (
                  <div
                    key={transform.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Step {index + 1}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTransformation(index)}
                      >
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Source Columns</Label>
                        <Input
                          placeholder="col1, col2"
                          value={transform.source_columns.join(", ")}
                          onChange={(e) =>
                            updateTransformation(
                              index,
                              "source_columns",
                              e.target.value
                                .split(",")
                                .map((c) => c.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Transformation</Label>
                        <Select
                          value={transform.transformation_type}
                          onValueChange={(value) =>
                            updateTransformation(
                              index,
                              "transformation_type",
                              value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSFORMATION_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Output Column</Label>
                        <Input
                          placeholder="new_feature_name"
                          value={transform.output_column}
                          onChange={(e) =>
                            updateTransformation(
                              index,
                              "output_column",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Transform-specific parameters */}
                    {transform.transformation_type === "bucketize" && (
                      <div className="space-y-2">
                        <Label>Bucket Boundaries</Label>
                        <Input
                          placeholder="0, 10, 50, 100"
                          value={
                            transform.parameters.boundaries?.join(", ") || ""
                          }
                          onChange={(e) =>
                            updateTransformation(index, "parameters", {
                              ...transform.parameters,
                              boundaries: e.target.value
                                .split(",")
                                .map((v) => parseFloat(v.trim()))
                                .filter((v) => !isNaN(v)),
                            })
                          }
                        />
                      </div>
                    )}

                    {transform.transformation_type === "rolling_agg" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Window Size</Label>
                          <Input
                            type="number"
                            placeholder="7"
                            value={transform.parameters.window_size || ""}
                            onChange={(e) =>
                              updateTransformation(index, "parameters", {
                                ...transform.parameters,
                                window_size: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Aggregation</Label>
                          <Select
                            value={transform.parameters.agg_function || "mean"}
                            onValueChange={(value) =>
                              updateTransformation(index, "parameters", {
                                ...transform.parameters,
                                agg_function: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mean">Mean</SelectItem>
                              <SelectItem value="sum">Sum</SelectItem>
                              <SelectItem value="min">Min</SelectItem>
                              <SelectItem value="max">Max</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {transform.transformation_type === "custom_sql" && (
                      <div className="space-y-2">
                        <Label>SQL Expression</Label>
                        <Textarea
                          placeholder="CASE WHEN col1 > 0 THEN 'positive' ELSE 'negative' END"
                          value={transform.parameters.sql_expression || ""}
                          onChange={(e) =>
                            updateTransformation(index, "parameters", {
                              ...transform.parameters,
                              sql_expression: e.target.value,
                            })
                          }
                          rows={3}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}

                    {transform.transformation_type === "date_parts" && (
                      <div className="space-y-2">
                        <Label>Parts to Extract</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            "year",
                            "month",
                            "day",
                            "hour",
                            "dayofweek",
                            "quarter",
                          ].map((part) => (
                            <Badge
                              key={part}
                              variant={
                                transform.parameters.parts?.includes(part)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() => {
                                const currentParts =
                                  transform.parameters.parts || [];
                                const newParts = currentParts.includes(part)
                                  ? currentParts.filter(
                                      (p: string) => p !== part
                                    )
                                  : [...currentParts, part];
                                updateTransformation(index, "parameters", {
                                  ...transform.parameters,
                                  parts: newParts,
                                });
                              }}
                            >
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Schedule */}
        {activeStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Automation</CardTitle>
              <CardDescription>
                Configure when this job should run
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Job</Label>
                  <p className="text-sm text-muted-foreground">
                    Job must be active to run manually or on schedule
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_active", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule_cron">
                  Schedule (Cron Expression)
                </Label>
                <Input
                  id="schedule_cron"
                  placeholder="0 0 * * * (every day at midnight)"
                  value={formData.schedule_cron}
                  onChange={(e) =>
                    handleInputChange("schedule_cron", e.target.value)
                  }
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to run manually only. Examples: "0 * * * *"
                  (hourly), "0 0 * * *" (daily), "0 0 * * 0" (weekly)
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Job Summary</h4>
                <ul className="text-sm space-y-1">
                  <li>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {formData.name || "Not set"}
                  </li>
                  <li>
                    <span className="text-muted-foreground">Source:</span>{" "}
                    {featureGroups.find(
                      (g) => g.id === formData.source_feature_group
                    )?.name || "Not selected"}
                  </li>
                  <li>
                    <span className="text-muted-foreground">
                      Transformations:
                    </span>{" "}
                    {transformations.length} steps
                  </li>
                  <li>
                    <span className="text-muted-foreground">Schedule:</span>{" "}
                    {formData.schedule_cron || "Manual only"}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
          >
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={!canProceed()}
            >
              Next
              <IconArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={createJobMutation.isPending || !canProceed()}
            >
              {createJobMutation.isPending ? (
                <>
                  <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <IconWand className="w-4 h-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
