import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceData,
  InviteMemberData,
  InviteMemberResponse,
  MemberActionResponse,
} from "@/lib/api/workspace";
import { workspaceApi } from "@/lib/api/workspace";

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: () => workspaceApi.getWorkspaces(),
    staleTime: 30 * 1000,
  });
}

export function useWorkspace(workspaceId: string | null) {
  return useQuery<Workspace>({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceApi.getWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkspaceData) =>
      workspaceApi.createWorkspace(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: Partial<Workspace>;
    }) => workspaceApi.updateWorkspace(workspaceId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      workspaceApi.deleteWorkspace(workspaceId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useSwitchWorkspace() {
  return useMutation({
    mutationFn: (workspaceId: string) =>
      workspaceApi.switchWorkspace(workspaceId),
  });
}

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}

export function useInviteWorkspaceMember() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: InviteMemberData;
    }) => workspaceApi.inviteMember(workspaceId, data),
  });
}

export function useUpdateWorkspaceMemberRole() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
      role,
    }: {
      workspaceId: string;
      memberId: string;
      role: string;
    }) => workspaceApi.updateMemberRole(workspaceId, memberId, role),
  });
}

export function useSuspendWorkspaceMember() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
    }) => workspaceApi.suspendMember(workspaceId, memberId),
  });
}

export function useActivateWorkspaceMember() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
    }) => workspaceApi.activateMember(workspaceId, memberId),
  });
}

export function useDeactivateWorkspaceMember() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
    }) => workspaceApi.deactivateMember(workspaceId, memberId),
  });
}

export function useRemoveWorkspaceMember() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
    }) => workspaceApi.removeMember(workspaceId, memberId),
  });
}
