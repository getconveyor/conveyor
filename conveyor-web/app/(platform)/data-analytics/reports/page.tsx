"use client";

import { useState, useEffect } from "react";
import {
  IconPlus,
  IconFileText,
  IconCalendar,
  IconClock,
  IconDownload,
  IconEye,
  IconDots,
  IconEdit,
  IconTrash,
  IconCopy,
  IconSend,
  IconFilter,
  IconSearch,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileTypeCsv,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyticsApi, Report as APIReport } from "@/lib/api/analytics";
import { toast } from "sonner";

interface Report {
  id: string;
  name: string;
  description: string;
  type: "scheduled" | "ad-hoc" | "template";
  category: string;
  format: "pdf" | "excel" | "csv" | "html";
  schedule?: string;
  lastRun?: string;
  nextRun?: string;
  createdBy: string;
  recipients?: string[];
  size?: string;
}

// Transform API response to component format
function transformReport(apiReport: APIReport): Report {
  return {
    id: apiReport.id,
    name: apiReport.name,
    description: apiReport.description || "",
    type: apiReport.schedule ? "scheduled" : "ad-hoc",
    category: apiReport.source_type || "General",
    format: apiReport.format || "pdf",
    schedule: apiReport.schedule || undefined,
    lastRun: apiReport.last_generated_at || undefined,
    nextRun: apiReport.next_run_at || undefined,
    createdBy: apiReport.owner_name || "Unknown",
    recipients: apiReport.delivery_config?.recipients || [],
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "scheduled" | "ad-hoc" | "template"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    format: "pdf" as "pdf" | "excel" | "csv",
    type: "ad-hoc" as "scheduled" | "ad-hoc",
  });

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiReports = await analyticsApi.getReports();
      setReports(apiReports.map(transformReport));
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesSearch =
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateReport = async () => {
    if (!formData.name.trim()) {
      toast.error("Report name is required");
      return;
    }

    try {
      setCreating(true);
      const newReport = await analyticsApi.createReport({
        name: formData.name,
        description: formData.description,
        format: formData.format,
        source_type: "custom",
      });
      toast.success("Report created successfully");
      setReports([...reports, transformReport(newReport)]);
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        format: "pdf",
        type: "ad-hoc",
      });
    } catch (err) {
      console.error("Failed to create report:", err);
      toast.error("Failed to create report");
    } finally {
      setCreating(false);
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await analyticsApi.deleteReport(id);
      setReports(reports.filter((r) => r.id !== id));
      toast.success("Report deleted");
    } catch (err) {
      console.error("Failed to delete report:", err);
      toast.error("Failed to delete report");
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return IconFileTypePdf;
      case "excel":
        return IconFileSpreadsheet;
      case "csv":
        return IconFileTypeCsv;
      default:
        return IconFileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <IconAlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchReports}>Try Again</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Create, schedule, and manage data reports
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Generate a new report from your data sources
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="e.g., Monthly Sales Report"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  placeholder="Describe what this report contains"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, format: value })
                    }
                  >
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ad-hoc">Run Once</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateReport}>Create Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="ad-hoc">Ad-hoc</TabsTrigger>
            <TabsTrigger value="template">Templates</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => {
          const FormatIcon = getFormatIcon(report.format);
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FormatIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <CardTitle className="text-lg truncate">
                        {report.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {report.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                      >
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <IconEye className="h-4 w-4 mr-2" />
                        View Report
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <IconDownload className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {report.type !== "template" && (
                        <DropdownMenuItem>
                          <IconSend className="h-4 w-4 mr-2" />
                          Send via Email
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <IconCopy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {report.type !== "template" && (
                        <DropdownMenuItem>
                          <IconEdit className="h-4 w-4 mr-2" />
                          Edit Schedule
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteReport(report.id)}
                      >
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant={
                        report.type === "scheduled"
                          ? "default"
                          : report.type === "template"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {report.type === "ad-hoc" ? "One-time" : report.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {report.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs uppercase">
                      {report.format}
                    </Badge>
                  </div>

                  {report.schedule && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconCalendar className="h-3 w-3" />
                      <span>{report.schedule}</span>
                    </div>
                  )}

                  {report.lastRun && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconClock className="h-3 w-3" />
                      <span>Last run: {report.lastRun}</span>
                    </div>
                  )}

                  {report.nextRun && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconClock className="h-3 w-3" />
                      <span>Next run: {report.nextRun}</span>
                    </div>
                  )}

                  {report.recipients && report.recipients.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconSend className="h-3 w-3" />
                      <span>{report.recipients.length} recipient(s)</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span>By {report.createdBy}</span>
                    {report.size && <span>{report.size}</span>}
                  </div>

                  {report.type === "template" && (
                    <Button variant="outline" className="w-full" size="sm">
                      Use Template
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <IconFileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first report to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
