"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateWorkspace } from "@/hooks/use-workspace";

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateWorkspaceModal({
  open,
  onOpenChange,
  onCreated,
}: CreateWorkspaceModalProps) {
  const { loadWorkspaces } = useWorkspace();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createMutation = useCreateWorkspace();

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  }, [name]);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Workspace name is required");
      return;
    }

    if (!slug.trim()) {
      setError("Workspace slug is required");
      return;
    }

    setError("");

    try {
      await createMutation.mutateAsync({
        name,
        slug,
        description: description || undefined,
      });

      setSuccess(true);
      toast({
        title: "Workspace created",
        description: `${name} has been created successfully.`,
      });

      await loadWorkspaces();

      setTimeout(() => {
        onCreated?.();
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to create workspace:", err);

      let errorMessage = "Failed to create workspace";

      if (err.response?.data?.slug) {
        errorMessage = `Slug: ${err.response.data.slug[0]}`;
      } else if (err.response?.data?.name) {
        errorMessage = `Name: ${err.response.data.name[0]}`;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast({
        title: "Failed to create workspace",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  function handleClose() {
    setName("");
    setSlug("");
    setDescription("");
    setError("");
    setSuccess(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Set up a new workspace to organize your data pipelines and team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name *</Label>
            <Input
              id="name"
              placeholder="My Awesome Workspace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending || success}
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
              disabled={createMutation.isPending || success}
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
              disabled={createMutation.isPending || success}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Workspace created successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending || success}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || success}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {success ? "Created!" : "Create Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
