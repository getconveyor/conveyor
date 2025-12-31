# Frontend Data Lake Integration

## Completed

### 1. API Client Enhancements (conveyor-web/lib/api/client.ts)
✅ Added workspace header support (`X-Workspace-ID`)
✅ Added `uploadFile()` method for multipart/form-data uploads
✅ Updated all HTTP methods to support `workspaceId` parameter

**Key Changes:**
```typescript
interface RequestOptions extends RequestInit {
  token?: string;
  workspaceId?: string;  // NEW
}

// File upload support
async uploadFile<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T>
```

### 2. Data Lake API Module (conveyor-web/lib/api/datalake.ts)
✅ Created comprehensive TypeScript types matching backend models
✅ Implemented all API functions with automatic auth/workspace handling
✅ Uses `localStorage` for automatic token and workspace ID injection

**Types:**
- `DataLakeFile` - File metadata
- `Folder` - Folder structure
- `Schema` - Schema definitions
- `StorageZone` - Storage tier management
- `StorageStats` - Statistics
- `DashboardStats` - Dashboard data

**API Functions:**
- Files: getFiles, getFile, uploadFile, updateFile, deleteFile, downloadFile, previewFile
- Folders: getFolders, getFolder, createFolder, updateFolder, deleteFolder, getFolderContents
- Schemas: getSchemas, getSchema, createSchema, updateSchema, deleteSchema, duplicateSchema, getSchemaTables
- Storage Zones: getStorageZones, getStorageZone, createStorageZone, updateStorageZone, deleteStorageZone, updateStorageZoneMetrics
- Statistics: getStats, getDashboard

### 3. Files Page Updates (PARTIAL)
✅ Added React hooks: `useState`, `useEffect`
✅ Added context hooks: `useAuth`, `useWorkspace`
✅ Imported data lake API and types
✅ Added toast notifications
✅ Implemented `loadFiles()` function
✅ Added loading states (`isFetching`)

## Remaining Work

### Files Page Handlers (conveyor-web/app/(platform)/data-lake/files/page.tsx)

Need to update these handlers to use real API:

```typescript
// Upload handler
const handleUploadFile = async () => {
  if (!uploadFile) return

  setIsLoading(true)
  try {
    await dataLakeApi.uploadFile({
      file: uploadFile,
      name: formData.name || uploadFile.name,
      format: formData.format as any,
    })
    toast.success('File uploaded successfully')
    await loadFiles()
    setIsUploadDialogOpen(false)
    resetForm()
  } catch (error: any) {
    toast.error(error.message || 'Failed to upload file')
  } finally {
    setIsLoading(false)
  }
}

// Download handler
const handleDownload = async (file: DataLakeFile) => {
  try {
    const { download_url } = await dataLakeApi.downloadFile(file.id)
    // Open download URL in new window
    window.open(download_url, '_blank')
    toast.success('Download started')
  } catch (error: any) {
    toast.error(error.message || 'Failed to generate download link')
  }
}

// Delete handler
const handleDeleteFile = async () => {
  if (!fileToDelete) return

  setIsLoading(true)
  try {
    await dataLakeApi.deleteFile(fileToDelete)
    toast.success('File deleted successfully')
    await loadFiles()
    setFileToDelete(null)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete file')
  } finally {
    setIsLoading(false)
  }
}
```

### Update File Input in Upload Dialog
```typescript
<div className="grid gap-2">
  <Label htmlFor="file-input">Select File</Label>
  <Input
    id="file-input"
    type="file"
    onChange={(e) => {
      const file = e.target.files?.[0]
      if (file) {
        setUploadFile(file)
        if (!formData.name) {
          setFormData({ ...formData, name: file.name })
        }
      }
    }}
  />
</div>
```

### Stats Calculation
Update to match actual backend data:
```typescript
const stats = {
  total: files.length,
  parquet: files.filter(f => f.format === "parquet").length,
  csv: files.filter(f => f.format === "csv").length,
  totalSize: files.reduce((acc, f) => acc + f.size, 0),
}
```

### Render Updates
Replace mock data fields with actual API fields:
```typescript
// Change from:
{file.uploaded} by {file.uploadedBy}

// To:
{new Date(file.created_at).toLocaleString()} by {file.uploaded_by_name || 'Unknown'}
```

## Schemas Page (conveyor-web/app/(platform)/data-lake/schemas/page.tsx)

Similar pattern to files page:

```typescript
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { dataLakeApi, Schema } from "@/lib/api/datalake"
import { toast } from "sonner"

export default function SchemasPage() {
  const { currentWorkspace } = useWorkspace()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    loadSchemas()
  }, [currentWorkspace])

  async function loadSchemas() {
    if (!currentWorkspace) return

    try {
      setIsFetching(true)
      const data = await dataLakeApi.getSchemas()
      setSchemas(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load schemas')
    } finally {
      setIsFetching(false)
    }
  }

  async function handleCreateSchema() {
    // ... validation
    setIsLoading(true)
    try {
      await dataLakeApi.createSchema(formData)
      toast.success('Schema created successfully')
      await loadSchemas()
      // Reset form
    } catch (error: any) {
      toast.error(error.message || 'Failed to create schema')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDuplicate(schema: Schema) {
    setIsLoading(true)
    try {
      await dataLakeApi.duplicateSchema(schema.id, {
        name: `${schema.name}_copy`,
        version: 'v1.0'
      })
      toast.success('Schema duplicated successfully')
      await loadSchemas()
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate schema')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!schemaToDelete) return

    setIsLoading(true)
    try {
      await dataLakeApi.deleteSchema(schemaToDelete)
      toast.success('Schema deleted successfully')
      await loadSchemas()
      setSchemaToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete schema')
    } finally {
      setIsLoading(false)
    }
  }
}
```

## Storage Page (conveyor-web/app/(platform)/data-lake/storage/page.tsx)

```typescript
"use client"

import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { dataLakeApi, StorageZone, DashboardStats } from "@/lib/api/datalake"
import { toast } from "sonner"

export default function StoragePage() {
  const { currentWorkspace } = useWorkspace()
  const [zones, setZones] = useState<StorageZone[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    loadData()
  }, [currentWorkspace])

  async function loadData() {
    if (!currentWorkspace) return

    try {
      setIsFetching(true)
      const [zonesData, statsData] = await Promise.all([
        dataLakeApi.getStorageZones(),
        dataLakeApi.getDashboard()
      ])
      setZones(zonesData)
      setStats(statsData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load storage data')
    } finally {
      setIsFetching(false)
    }
  }

  // Render using actual data
  return (
    // ... UI with stats?.stats.total_size_display, etc.
  )
}
```

## Explorer Page (conveyor-web/app/(platform)/data-lake/explorer/page.tsx)

Similar pattern combining files and folders:

```typescript
async function loadFolderContents(folderId?: string) {
  try {
    setIsLoading(true)
    if (folderId) {
      const contents = await dataLakeApi.getFolderContents(folderId)
      setFiles(contents.files)
      setFolders(contents.folders)
    } else {
      // Load root level
      const [allFiles, allFolders] = await Promise.all([
        dataLakeApi.getFiles(),
        dataLakeApi.getFolders()
      ])
      setFiles(allFiles)
      setFolders(allFolders)
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to load contents')
  } finally {
    setIsLoading(false)
  }
}
```

## Dashboard Page (conveyor-web/app/(platform)/data-lake/page.tsx)

```typescript
async function loadDashboard() {
  try {
    setIsFetching(true)
    const data = await dataLakeApi.getDashboard()
    setDashboardData(data)
  } catch (error: any) {
    toast.error(error.message || 'Failed to load dashboard')
  } finally {
    setIsFetching(false)
  }
}
```

## Testing Checklist

- [ ] File upload works with progress indication
- [ ] File download generates presigned URL correctly
- [ ] File deletion removes from both UI and backend
- [ ] Search and filters work properly
- [ ] Schema CRUD operations work
- [ ] Storage zones display metrics correctly
- [ ] Dashboard shows real-time stats
- [ ] Error handling displays toast notifications
- [ ] Loading states show spinners
- [ ] Workspace switching updates data
- [ ] Auth token refresh works

## API Endpoint Mappings

| Frontend Page | Backend Endpoint | Method | Purpose |
|--------------|------------------|--------|---------|
| Files List | `/api/data-lake/files/` | GET | List files |
| File Upload | `/api/data-lake/files/upload/` | POST | Upload file |
| File Delete | `/api/data-lake/files/{id}/` | DELETE | Delete file |
| File Download | `/api/data-lake/files/{id}/download/` | GET | Get download URL |
| Schemas List | `/api/data-lake/schemas/` | GET | List schemas |
| Schema Create | `/api/data-lake/schemas/` | POST | Create schema |
| Schema Duplicate | `/api/data-lake/schemas/{id}/duplicate/` | POST | Duplicate schema |
| Storage Zones | `/api/data-lake/storage-zones/` | GET | List zones |
| Dashboard Stats | `/api/data-lake/stats/dashboard/` | GET | Get statistics |

## Notes

- All API calls automatically include JWT token from localStorage
- Workspace ID automatically included via `X-Workspace-ID` header
- Toast notifications use `sonner` library
- File size formatting handled by backend (`size_display` field)
- Dates formatted with `new Date().toLocaleString()`
- Error handling catches and displays user-friendly messages
