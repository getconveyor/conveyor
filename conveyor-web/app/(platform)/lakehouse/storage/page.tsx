"use client"

import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { dataLakeApi, StorageZone } from "@/lib/api/datalake"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { IconServer, IconDatabase, IconCloud, IconChartBar, IconLoader2 } from "@tabler/icons-react"

const zoneTypeLabels: Record<string, string> = {
  'hot': 'SSD - High Performance',
  'warm': 'HDD - Standard',
  'cold': 'Archive - Long-term',
}

const statusColors: Record<string, string> = {
  'active': 'bg-green-500/10 text-green-500',
  'inactive': 'bg-gray-500/10 text-gray-500',
  'maintenance': 'bg-yellow-500/10 text-yellow-500',
}

export default function StoragePage() {
  const { currentWorkspace } = useWorkspace()
  const [zones, setZones] = useState<StorageZone[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStorageZones()
  }, [currentWorkspace])

  async function loadStorageZones() {
    if (!currentWorkspace) return

    try {
      setIsLoading(true)
      const data = await dataLakeApi.getStorageZones()
      setZones(data)
    } catch (error: any) {
      console.error('Failed to load storage zones:', error)
      toast.error(error.message || 'Failed to load storage zones')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate totals from zones
  const totals = zones.reduce((acc, zone) => ({
    capacity: acc.capacity + zone.total_capacity,
    used: acc.used + zone.used_storage,
    available: acc.available + zone.available_storage,
    files: acc.files + zone.file_count,
  }), { capacity: 0, used: 0, available: 0, files: 0 })

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const usagePercentage = totals.capacity > 0
    ? ((totals.used / totals.capacity) * 100).toFixed(1)
    : '0'
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Storage</h1>
          <p className="text-sm text-muted-foreground">
            Monitor storage capacity and performance
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="flex items-start justify-between mb-1">
              <div className="text-[10px] font-medium text-muted-foreground">Total Capacity</div>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconServer className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="text-xl font-bold mb-0.5">{formatBytes(totals.capacity)}</div>
            <div className="text-xs text-muted-foreground">{zones.length} storage zones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="flex items-start justify-between mb-1">
              <div className="text-[10px] font-medium text-muted-foreground">Used Storage</div>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconDatabase className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="text-xl font-bold mb-0.5">{formatBytes(totals.used)}</div>
            <div className="text-xs text-muted-foreground">{usagePercentage}% utilized</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="flex items-start justify-between mb-1">
              <div className="text-[10px] font-medium text-muted-foreground">Available</div>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconCloud className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <div className="text-xl font-bold mb-0.5">{formatBytes(totals.available)}</div>
            <div className="text-xs text-muted-foreground">{(100 - parseFloat(usagePercentage)).toFixed(1)}% free</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="flex items-start justify-between mb-1">
              <div className="text-[10px] font-medium text-muted-foreground">Total Files</div>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconChartBar className="h-4 w-4 text-orange-500" />
              </div>
            </div>
            <div className="text-xl font-bold mb-0.5">{totals.files.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Across all zones</div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Zones */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <h2 className="text-lg font-semibold mb-3">Storage Zones</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconServer className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No storage zones configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {zones.map((zone) => (
                <Card key={zone.id}>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{zone.name}</h3>
                          <span className="text-xs text-muted-foreground">
                            {zoneTypeLabels[zone.zone_type] || zone.zone_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Used: </span>
                            <span className="font-medium">{zone.used_storage_display}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Capacity: </span>
                            <span className="font-medium">{zone.total_capacity_display}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Files: </span>
                            <span className="font-medium">{zone.file_count.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Usage: </span>
                            <span className="font-medium">{zone.usage_percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusColors[zone.status]}`}>
                        {zone.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
