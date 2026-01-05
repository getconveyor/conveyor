"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  IconArrowLeft,
  IconPlayerPlay,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconCode,
  IconMarkdown,
  IconChevronUp,
  IconChevronDown,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { transformationApi, Notebook } from "@/lib/api/transformation";

interface Cell {
  cell_type: "code" | "markdown";
  source: string;
  outputs: any[];
  execution_count?: number | null;
}

export default function NotebookEditorPage() {
  const router = useRouter();
  const params = useParams();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const fetchNotebook = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await transformationApi.getNotebook(notebookId);
      setNotebook(data);
      setTitleInput(data.name);

      // Initialize cells from notebook content
      if (data.content && data.content.cells) {
        setCells(
          data.content.cells.map((cell: any) => ({
            cell_type: (cell.cell_type === "code" ||
            cell.cell_type === "markdown"
              ? cell.cell_type
              : "code") as "code" | "markdown",
            source: cell.source || "",
            outputs: cell.outputs || [],
            execution_count: cell.execution_count,
          }))
        );
      } else {
        setCells([{ cell_type: "code", source: "", outputs: [] }]);
      }
    } catch (error: any) {
      console.error("Failed to fetch notebook:", error);
      toast.error("Failed to load notebook", {
        description: error.message || "Please try again",
      });
      router.push("/data-transformation/notebooks");
    } finally {
      setIsLoading(false);
    }
  }, [notebookId, router]);

  useEffect(() => {
    fetchNotebook();
  }, [fetchNotebook]);

  const handleSave = async () => {
    if (!notebook) return;

    setIsSaving(true);
    try {
      await transformationApi.updateNotebook(notebookId, {
        name: titleInput,
        content: { cells },
      });

      setNotebook({ ...notebook, name: titleInput });
      setHasChanges(false);
      toast.success("Notebook saved");
    } catch (error: any) {
      console.error("Failed to save notebook:", error);
      toast.error("Failed to save notebook", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!notebook) return;

    // Save first
    await handleSave();

    setIsRunning(true);
    try {
      await transformationApi.runNotebook(notebookId);
      toast.success("Notebook execution started");
      fetchNotebook();
    } catch (error: any) {
      console.error("Failed to run notebook:", error);
      toast.error("Failed to run notebook", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const updateCell = (index: number, updates: Partial<Cell>) => {
    setCells((prev) =>
      prev.map((cell, i) => (i === index ? { ...cell, ...updates } : cell))
    );
    setHasChanges(true);
  };

  const addCell = (index: number, type: "code" | "markdown" = "code") => {
    const newCell: Cell = {
      cell_type: type,
      source: "",
      outputs: [],
    };
    setCells((prev) => [
      ...prev.slice(0, index + 1),
      newCell,
      ...prev.slice(index + 1),
    ]);
    setActiveCell(index + 1);
    setHasChanges(true);
  };

  const deleteCell = (index: number) => {
    if (cells.length <= 1) {
      toast.error("Cannot delete the last cell");
      return;
    }
    setCells((prev) => prev.filter((_, i) => i !== index));
    setActiveCell(null);
    setHasChanges(true);
  };

  const moveCell = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === cells.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    setCells((prev) => {
      const newCells = [...prev];
      [newCells[index], newCells[newIndex]] = [
        newCells[newIndex],
        newCells[index],
      ];
      return newCells;
    });
    setActiveCell(newIndex);
    setHasChanges(true);
  };

  const toggleCellType = (index: number) => {
    const cell = cells[index];
    const newType = cell.cell_type === "code" ? "markdown" : "code";
    updateCell(index, { cell_type: newType, outputs: [] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Notebook not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/data-transformation/notebooks")}
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Notebooks
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2 bg-background sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/data-transformation/notebooks")}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>

            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="h-8 w-64"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingTitle(false);
                      setHasChanges(true);
                    }
                    if (e.key === "Escape") {
                      setTitleInput(notebook.name);
                      setEditingTitle(false);
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditingTitle(false);
                    setHasChanges(true);
                  }}
                >
                  <IconCheck className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setTitleInput(notebook.name);
                    setEditingTitle(false);
                  }}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1
                className="text-lg font-semibold cursor-pointer hover:text-primary"
                onClick={() => setEditingTitle(true)}
              >
                {titleInput}
              </h1>
            )}

            <Badge variant="outline">{notebook.language}</Badge>
            <Badge variant="secondary">{notebook.kernel}</Badge>
            {hasChanges && (
              <Badge
                variant="outline"
                className="text-amber-500 border-amber-500"
              >
                Unsaved
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconDeviceFloppy className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save notebook (Ctrl+S)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={handleRun} disabled={isRunning}>
                  {isRunning ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconPlayerPlay className="mr-2 h-4 w-4" />
                  )}
                  Run All
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run all cells</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Notebook Cells */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-5xl mx-auto space-y-2">
            {cells.map((cell, index) => (
              <Card
                key={index}
                className={`relative group ${
                  activeCell === index ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setActiveCell(index)}
              >
                {/* Cell Toolbar */}
                <div className="absolute -left-12 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCell(index, "up");
                        }}
                        disabled={index === 0}
                      >
                        <IconChevronUp className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Move up</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCell(index, "down");
                        }}
                        disabled={index === cells.length - 1}
                      >
                        <IconChevronDown className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Move down</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCell(index);
                        }}
                      >
                        <IconTrash className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Delete cell</TooltipContent>
                  </Tooltip>
                </div>

                <CardContent className="p-0">
                  {/* Cell Header */}
                  <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      {cell.cell_type === "code" ? (
                        <IconCode className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <IconMarkdown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        [{index + 1}]
                      </span>
                      <Select
                        value={cell.cell_type}
                        onValueChange={(value: "code" | "markdown") => {
                          updateCell(index, { cell_type: value, outputs: [] });
                        }}
                      >
                        <SelectTrigger className="h-6 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="markdown">Markdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {cell.execution_count !== undefined &&
                      cell.execution_count !== null && (
                        <span className="text-xs text-muted-foreground">
                          Run: {cell.execution_count}
                        </span>
                      )}
                  </div>

                  {/* Cell Editor */}
                  <div className="min-h-[100px]">
                    <Editor
                      height={Math.max(
                        100,
                        (cell.source.split("\n").length + 1) * 20
                      )}
                      language={
                        cell.cell_type === "code"
                          ? notebook.language === "sql"
                            ? "sql"
                            : "python"
                          : "markdown"
                      }
                      value={cell.source}
                      onChange={(value) =>
                        updateCell(index, { source: value || "" })
                      }
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: cell.cell_type === "code" ? "on" : "off",
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        wordWrap: "on",
                        padding: { top: 8, bottom: 8 },
                      }}
                    />
                  </div>

                  {/* Cell Output */}
                  {cell.outputs && cell.outputs.length > 0 && (
                    <div className="border-t bg-muted/20 p-3">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {cell.outputs.map((output, i) => (
                          <div key={i}>
                            {output.text ||
                              output.data?.["text/plain"] ||
                              JSON.stringify(output)}
                          </div>
                        ))}
                      </pre>
                    </div>
                  )}
                </CardContent>

                {/* Add Cell Button */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="flex items-center gap-1 bg-background border rounded-md shadow-sm">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            addCell(index, "code");
                          }}
                        >
                          <IconCode className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add code cell</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            addCell(index, "markdown");
                          }}
                        >
                          <IconMarkdown className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add markdown cell</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add First Cell Button (when empty) */}
            {cells.length === 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => addCell(-1, "code")}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Cell
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
