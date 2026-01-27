import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transformationApi, Notebook } from "@/lib/api/transformation";

export function useNotebooks() {
  return useQuery<Notebook[]>({
    queryKey: ["notebooks"],
    queryFn: () => transformationApi.getNotebooks(),
    staleTime: 30 * 1000,
  });
}

export function useNotebook(notebookId: string | null) {
  return useQuery<Notebook>({
    queryKey: ["notebook", notebookId],
    queryFn: () => transformationApi.getNotebook(notebookId!),
    enabled: !!notebookId,
  });
}

export function useJobs() {
  return useQuery<Notebook[]>({
    queryKey: ["jobs"],
    queryFn: () => transformationApi.getJobs(),
    staleTime: 30 * 1000,
  });
}

export function useSchedulableNotebooks() {
  return useQuery<Notebook[]>({
    queryKey: ["schedulable-notebooks"],
    queryFn: () => transformationApi.getSchedulableNotebooks(),
    staleTime: 30 * 1000,
  });
}

export function useRunNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notebookId: string) =>
      transformationApi.runNotebook(notebookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
    },
  });
}

export function useCreateNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => transformationApi.createNotebook(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
  });
}

export function useDuplicateNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notebookId: string) =>
      transformationApi.duplicateNotebook(notebookId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
  });
}

export function useDeleteNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notebookId: string) =>
      transformationApi.deleteNotebook(notebookId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
  });
}

export function useUpdateNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ notebookId, data }: { notebookId: string; data: any }) =>
      transformationApi.updateNotebook(notebookId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
  });
}

export function useExportNotebook() {
  return useMutation({
    mutationFn: (notebookId: string) =>
      transformationApi.exportNotebook(notebookId),
  });
}
