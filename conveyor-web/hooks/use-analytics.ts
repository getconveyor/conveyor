import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, Dashboard, Report } from "@/lib/api/analytics";
import { showErrorToast, showSuccessToast } from "@/lib/error-handler";

// Query Keys
export const analyticsKeys = {
  all: ["analytics"] as const,
  dashboards: () => [...analyticsKeys.all, "dashboards"] as const,
  dashboard: (id: string) => [...analyticsKeys.dashboards(), id] as const,
  reports: () => [...analyticsKeys.all, "reports"] as const,
  report: (id: string) => [...analyticsKeys.reports(), id] as const,
  explorations: () => [...analyticsKeys.all, "explorations"] as const,
  queries: () => [...analyticsKeys.all, "queries"] as const,
};

// Dashboards
export function useDashboards(params?: { public?: boolean; template?: boolean; search?: string }) {
  return useQuery({
    queryKey: [...analyticsKeys.dashboards(), params],
    queryFn: () => analyticsApi.getDashboards(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useDashboard(id: string | null) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(id || ""),
    queryFn: () => analyticsApi.getDashboard(id!),
    enabled: !!id,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Dashboard>) => analyticsApi.createDashboard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
      showSuccessToast("Dashboard created successfully");
    },
    onError: (error) => showErrorToast(error, "Failed to create dashboard"),
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Dashboard> }) =>
      analyticsApi.updateDashboard(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard(variables.id) });
      showSuccessToast("Dashboard updated successfully");
    },
    onError: (error) => showErrorToast(error, "Failed to update dashboard"),
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => analyticsApi.deleteDashboard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
      showSuccessToast("Dashboard deleted successfully");
    },
    onError: (error) => showErrorToast(error, "Failed to delete dashboard"),
  });
}

// Reports
export function useReports(params?: { enabled?: boolean; format?: string }) {
  return useQuery({
    queryKey: [...analyticsKeys.reports(), params],
    queryFn: () => analyticsApi.getReports(params),
    staleTime: 60 * 1000,
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: analyticsKeys.report(id || ""),
    queryFn: () => analyticsApi.getReport(id!),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Report>) => analyticsApi.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
      showSuccessToast("Report created successfully");
    },
    onError: (error) => showErrorToast(error, "Failed to create report"),
  });
}

export function useRunReport() {
  return useMutation({
    mutationFn: (id: string) => analyticsApi.runReport(id),
    onSuccess: () => showSuccessToast("Report started successfully"),
    onError: (error) => showErrorToast(error, "Failed to run report"),
  });
}

// Explorations
export function useExplorations() {
  return useQuery({
    queryKey: analyticsKeys.explorations(),
    queryFn: () => analyticsApi.getExplorations(),
    staleTime: 60 * 1000,
  });
}

// Queries
export function useQueries(params?: { folder?: string; public?: boolean; search?: string }) {
  return useQuery({
    queryKey: [...analyticsKeys.queries(), params],
    queryFn: () => analyticsApi.getQueries(params),
    staleTime: 60 * 1000,
  });
}
