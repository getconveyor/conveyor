"use client"

import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { dataLakeApi, DataLakeFile } from "@/lib/api/datalake"
import { toast } from "sonner"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconFileText,
  IconDownload,
  IconTrash,
  IconEye,
  IconClock,
  IconUpload,
  IconLoader2,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

export default function FilesPage() {
  const { currentWorkspace } = useWorkspace()
  const [files, setFiles] = useState<DataLakeFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [formatFilter, setFormatFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    format: "csv",
  })

  // Helper to capitalize format for display
  const formatDisplay = (format: string) => {
    const formatMap: Record<string, string> = {
      'csv': 'CSV',
      'json': 'JSON',
      'parquet': 'Parquet',
      'avro': 'Avro',
      'orc': 'ORC',
      'delta': 'Delta Lake',
      'table': 'Table'
    }
    return formatMap[format] || format.toUpperCase()
  }

  // Fetch files from API
  useEffect(() => {
    loadFiles()
  }, [currentWorkspace])

  async function loadFiles() {
    if (!currentWorkspace) return

    try {
      setIsFetching(true)
      const data = await dataLakeApi.getFiles()
      setFiles(data)
    } catch (error: any) {
      console.error('Failed to load files:', error)
      toast.error(error.message || 'Failed to load files')
    } finally {
      setIsFetching(false)
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFormat = formatFilter === "all" || file.format.toLowerCase() === formatFilter.toLowerCase()
    return matchesSearch && matchesFormat
  })

  const stats = {
    total: files.length,
    parquet: files.filter(f => f.format === "parquet").length,
    csv: files.filter(f => f.format === "csv").length,
    totalSize: "5.2 GB",
  }

  const handleUploadFile = async () => {
    if (!uploadFile || !formData.name.trim()) return

    setIsLoading(true)
    try {
      await dataLakeApi.uploadFile({
        file: uploadFile,
        name: formData.name,
        format: formData.format as any,
      })
      toast.success('File uploaded successfully')
      await loadFiles()
      setIsUploadDialogOpen(false)
      setUploadFile(null)
      resetForm()
    } catch (error: any) {
      console.error('Failed to upload file:', error)
      toast.error(error.message || 'Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (file: DataLakeFile) => {
    try {
      const downloadInfo = await dataLakeApi.downloadFile(file.id)
      // Open presigned URL in new tab to download
      window.open(downloadInfo.download_url, '_blank')
      toast.success('Download started')
    } catch (error: any) {
      console.error('Failed to download file:', error)
      toast.error(error.message || 'Failed to download file')
    }
  }

  const handleDeleteFile = async () => {
    if (!fileToDelete) return

    setIsLoading(true)
    try {
      await dataLakeApi.deleteFile(fileToDelete)
      toast.success('File deleted successfully')
      await loadFiles()
      setFileToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      toast.error(error.message || 'Failed to delete file')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      format: "csv",
    })
    setUploadFile(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-sm text-muted-foreground">
            Manage and analyze data lake files
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <IconUpload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Files</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Parquet</div>
            <div className="text-xl font-bold text-green-500">{stats.parquet}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">CSV</div>
            <div className="text-xl font-bold text-orange-500">{stats.csv}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Size</div>
            <div className="text-xl font-bold">{stats.totalSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* Files List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="parquet">Parquet</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadFiles} disabled={isFetching}>
                <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconFileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No files found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <Card key={file.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconFileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{file.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {formatDisplay(file.format)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Size</p>
                          <p className="font-medium">{file.size_display}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rows</p>
                          <p className="font-medium">{file.rows || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Columns</p>
                          <p className="font-medium">{file.columns || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Uploaded</p>
                          <p className="font-medium">{new Date(file.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">By</p>
                          <p className="font-medium">{file.uploaded_by_name || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            {isLoading ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconDotsVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconClock className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setFileToDelete(file.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => { if (!open) { setIsUploadDialogOpen(false); resetForm() }}} modal>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload a new file to the data lake</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploadFile(file)
                    // Auto-populate name from file if empty
                    if (!formData.name) {
                      setFormData({ ...formData, name: file.name })
                    }
                  }
                }}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file-name">File Name</Label>
              <Input id="file-name" placeholder="e.g., customer_data.csv" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="format">File Format</Label>
              <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                <SelectTrigger id="format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="parquet">Parquet</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="avro">Avro</SelectItem>
                  <SelectItem value="orc">ORC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsUploadDialogOpen(false); resetForm() }} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleUploadFile} disabled={!uploadFile || !formData.name.trim() || isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><IconUpload className="mr-2 h-4 w-4" />Upload File</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this file from the data lake. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFile} disabled={isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete File"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
