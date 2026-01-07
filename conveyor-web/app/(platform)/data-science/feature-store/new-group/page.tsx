"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconDatabase,
  IconPlus,
  IconTrash,
  IconLoader2,
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
import { useCreateFeatureGroup } from "@/hooks/use-datascience";

interface FeatureField {
  name: string;
  type: string;
  description: string;
}

const DATA_TYPES = [
  { value: "int", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "string", label: "String" },
  { value: "bool", label: "Boolean" },
  { value: "datetime", label: "DateTime" },
  { value: "array", label: "Array" },
  { value: "embedding", label: "Embedding" },
];

export default function NewFeatureGroupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entity_type: "",
    primary_key: "",
    event_time_column: "",
    source_table: "",
    online_enabled: false,
    ttl_minutes: 1440, // 24 hours default
  });
  const [features, setFeatures] = useState<FeatureField[]>([
    { name: "", type: "float", description: "" },
  ]);

  const createFeatureGroupMutation = useCreateFeatureGroup();

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (
    index: number,
    field: keyof FeatureField,
    value: string
  ) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, { name: "", type: "float", description: "" }]);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const validFeatures = features.filter((f) => f.name.trim());

      await createFeatureGroupMutation.mutateAsync({
        ...formData,
        features: validFeatures,
        feature_count: validFeatures.length,
        offline_enabled: true,
      });

      router.push("/data-science/feature-store");
    } catch (error) {
      console.error("Failed to create feature group:", error);
      alert("Failed to create feature group. Please try again.");
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold">Create Feature Group</h1>
          <p className="text-muted-foreground">
            Define a new collection of features for an entity
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>
              General details about this feature group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., customer_features"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_type">Entity Type *</Label>
                <Input
                  id="entity_type"
                  placeholder="e.g., customer, product, transaction"
                  value={formData.entity_type}
                  onChange={(e) =>
                    handleInputChange("entity_type", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this feature group..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_key">Primary Key *</Label>
                <Input
                  id="primary_key"
                  placeholder="e.g., customer_id"
                  value={formData.primary_key}
                  onChange={(e) =>
                    handleInputChange("primary_key", e.target.value)
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Column that uniquely identifies entities
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_time_column">Event Time Column</Label>
                <Input
                  id="event_time_column"
                  placeholder="e.g., event_timestamp"
                  value={formData.event_time_column}
                  onChange={(e) =>
                    handleInputChange("event_time_column", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Column for point-in-time joins
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Configuration</CardTitle>
            <CardDescription>Where the feature data comes from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source_table">Source Table</Label>
              <Input
                id="source_table"
                placeholder="e.g., iceberg.feature_store.customer_features"
                value={formData.source_table}
                onChange={(e) =>
                  handleInputChange("source_table", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional: Reference to the underlying data table
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Definitions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Feature Definitions</CardTitle>
                <CardDescription>
                  Define the features in this group
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
              >
                <IconPlus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="feature_name"
                      value={feature.name}
                      onChange={(e) =>
                        handleFeatureChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={feature.type}
                      onValueChange={(value) =>
                        handleFeatureChange(index, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={feature.description}
                      onChange={(e) =>
                        handleFeatureChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeature(index)}
                  disabled={features.length === 1}
                >
                  <IconTrash className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}

            {features.filter((f) => f.name.trim()).length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {features
                  .filter((f) => f.name.trim())
                  .map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature.name}: {feature.type}
                    </Badge>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Options</CardTitle>
            <CardDescription>
              Configure offline and online feature stores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Online Store</Label>
                <p className="text-sm text-muted-foreground">
                  Enable low-latency feature serving via Redis
                </p>
              </div>
              <Switch
                checked={formData.online_enabled}
                onCheckedChange={(checked) =>
                  handleInputChange("online_enabled", checked)
                }
              />
            </div>

            {formData.online_enabled && (
              <div className="space-y-2">
                <Label htmlFor="ttl_minutes">TTL (minutes)</Label>
                <Input
                  id="ttl_minutes"
                  type="number"
                  placeholder="1440"
                  value={formData.ttl_minutes}
                  onChange={(e) =>
                    handleInputChange("ttl_minutes", parseInt(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Time-to-live for cached features in online store
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/data-science/feature-store">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <IconDatabase className="w-4 h-4 mr-2" />
                Create Feature Group
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
