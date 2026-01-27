"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridReadyEvent,
  FilterChangedEvent,
  SelectionChangedEvent,
  GridApi,
  RowClickedEvent,
} from "ag-grid-community";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconSearch,
  IconDownload,
  IconColumns,
  IconFilter,
  IconRefresh,
  IconMaximize,
} from "@tabler/icons-react";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme based on shadcn
const conveyorTheme = themeQuartz.withParams({
  backgroundColor: "hsl(var(--background))",
  foregroundColor: "hsl(var(--foreground))",
  borderColor: "hsl(var(--border))",
  browserColorScheme: "light",
  headerBackgroundColor: "hsl(var(--muted))",
  headerTextColor: "hsl(var(--foreground))",
  oddRowBackgroundColor: "hsl(var(--background))",
  headerFontWeight: 600,
  cellTextColor: "hsl(var(--foreground))",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  headerFontSize: 13,
  rowBorder: true,
  wrapperBorderRadius: 8,
  cellHorizontalPadding: 12,
  headerColumnResizeHandleColor: "hsl(var(--primary))",
  accentColor: "hsl(var(--primary))",
  selectedRowBackgroundColor: "hsl(var(--accent))",
  rowHoverColor: "hsl(var(--muted))",
});

export interface DataGridProps<TData = any> {
  data: TData[];
  columns: ColDef<TData>[];
  loading?: boolean;
  onRowClick?: (data: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  onRefresh?: () => void;
  rowSelection?: "single" | "multiple";
  pagination?: boolean;
  pageSize?: number;
  height?: string | number;
  className?: string;
  quickFilterPlaceholder?: string;
  exportFileName?: string;
  enableExport?: boolean;
  enableColumnToggle?: boolean;
  enableQuickFilter?: boolean;
  toolbar?: React.ReactNode;
  emptyMessage?: string;
}

export function DataGrid<TData = any>({
  data,
  columns,
  loading = false,
  onRowClick,
  onSelectionChange,
  onRefresh,
  rowSelection,
  pagination = true,
  pageSize = 20,
  height = 600,
  className,
  quickFilterPlaceholder = "Search...",
  exportFileName = "export",
  enableExport = true,
  enableColumnToggle = true,
  enableQuickFilter = true,
  toolbar,
  emptyMessage = "No data to display",
}: DataGridProps<TData>) {
  const gridRef = useRef<AgGridReact<TData>>(null);
  const [gridApi, setGridApi] = useState<GridApi<TData> | null>(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.field || c.colId || ""))
  );

  // Default column definitions
  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: false,
      minWidth: 100,
    }),
    []
  );

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent<TData>) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Handle row click
  const handleRowClicked = useCallback(
    (event: RowClickedEvent<TData>) => {
      if (onRowClick && event.data) {
        onRowClick(event.data);
      }
    },
    [onRowClick]
  );

  // Handle selection change
  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<TData>) => {
      if (onSelectionChange) {
        const selectedRows = event.api.getSelectedRows();
        onSelectionChange(selectedRows);
      }
    },
    [onSelectionChange]
  );

  // Export to CSV
  const exportToCsv = useCallback(() => {
    gridApi?.exportDataAsCsv({
      fileName: `${exportFileName}.csv`,
    });
  }, [gridApi, exportFileName]);

  // Quick filter change
  const handleQuickFilterChange = useCallback(
    (value: string) => {
      setQuickFilter(value);
      gridApi?.setGridOption("quickFilterText", value);
    },
    [gridApi]
  );

  // Toggle column visibility
  const toggleColumn = useCallback(
    (colId: string) => {
      const newVisible = new Set(visibleColumns);
      if (newVisible.has(colId)) {
        newVisible.delete(colId);
        gridApi?.setColumnsVisible([colId], false);
      } else {
        newVisible.add(colId);
        gridApi?.setColumnsVisible([colId], true);
      }
      setVisibleColumns(newVisible);
    },
    [gridApi, visibleColumns]
  );

  // Fit columns to content
  const fitColumns = useCallback(() => {
    gridApi?.sizeColumnsToFit();
  }, [gridApi]);

  // Auto-size all columns
  const autoSizeColumns = useCallback(() => {
    gridApi?.autoSizeAllColumns();
  }, [gridApi]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {enableQuickFilter && (
            <div className="relative max-w-sm flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={quickFilterPlaceholder}
                value={quickFilter}
                onChange={(e) => handleQuickFilterChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {toolbar}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
            >
              <IconRefresh
                className={cn("h-4 w-4", loading && "animate-spin")}
              />
            </Button>
          )}

          {enableColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <IconColumns className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((col) => {
                  const colId = col.field || col.colId || "";
                  return (
                    <DropdownMenuCheckboxItem
                      key={colId}
                      checked={visibleColumns.has(colId)}
                      onCheckedChange={() => toggleColumn(colId)}
                    >
                      {col.headerName || colId}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="outline" size="icon" onClick={fitColumns}>
            <IconMaximize className="h-4 w-4" />
          </Button>

          {enableExport && (
            <Button variant="outline" size="sm" onClick={exportToCsv}>
              <IconDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        className="rounded-lg border overflow-hidden"
      >
        <AgGridReact<TData>
          ref={gridRef}
          theme={conveyorTheme}
          rowData={data}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onRowClicked={handleRowClicked}
          onSelectionChanged={handleSelectionChanged}
          rowSelection={rowSelection}
          pagination={pagination}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          animateRows
          suppressRowClickSelection
          enableCellTextSelection
          ensureDomOrder
          loading={loading}
          overlayNoRowsTemplate={`<div class="flex items-center justify-center h-full text-muted-foreground">${emptyMessage}</div>`}
          overlayLoadingTemplate={`<div class="flex items-center justify-center h-full"><div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>`}
        />
      </div>
    </div>
  );
}
