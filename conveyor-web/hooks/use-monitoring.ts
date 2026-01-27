import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  monitoringApi,
  SystemHealth,
  Alert,
  AuditLog,
  MetricSnapshot,
  SystemOverview,
} from "@/lib/api/monitoring";

export function useSystemHealth() {
  return useQuery<SystemHealth[]>({
    queryKey: ["system-health"],
    queryFn: monitoringApi.getCurrentHealth,
    staleTime: 30 * 1000,
  });
}

export function useSystemOverview() {
  return useQuery<SystemOverview>({
    queryKey: ["system-overview"],
    queryFn: monitoringApi.getSystemOverview,
    staleTime: 30 * 1000,
  });
}

export function useAlerts(status?: string) {
  return useQuery<Alert[]>({
    queryKey: ["alerts", status],
    queryFn: () => monitoringApi.getAlerts(status ? { status } : undefined),
    staleTime: 30 * 1000,
  });
}

export function useAlertSummary() {
  return useQuery({
    queryKey: ["alert-summary"],
    queryFn: monitoringApi.getAlertSummary,
    staleTime: 30 * 1000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => monitoringApi.acknowledgeAlert(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => monitoringApi.dismissAlert(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useAuditLogs(params?: any) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => monitoringApi.getAuditLogs(params),
    staleTime: 30 * 1000,
  });
}

export function useAuditLogSummary() {
  return useQuery({
    queryKey: ["audit-log-summary"],
    queryFn: monitoringApi.getAuditLogSummary,
    staleTime: 30 * 1000,
  });
}

export function useMetrics(params?: any) {
  return useQuery<MetricSnapshot[]>({
    queryKey: ["metrics", params],
    queryFn: () => monitoringApi.getMetrics(params),
    staleTime: 30 * 1000,
  });
}
