import { apiClient, getAuthOptions } from "./client";

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types
export interface Plan {
  id: string;
  name: string;
  description: string;
  plan_type: "free" | "starter" | "professional" | "enterprise";
  price_monthly: string;
  price_yearly: string;
  max_users: number;
  max_pipelines: number;
  max_storage_gb: number;
  max_queries_per_day: number;
  features: Record<string, any>;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  workspace: string;
  workspace_name: string;
  plan: Plan;
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired";
  billing_cycle: "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  usage_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
}

export interface WorkspaceMember {
  id: string;
  workspace: string;
  user: WorkspaceMemberUser;
  role: "owner" | "admin" | "developer" | "analyst" | "viewer";
  status: "active" | "invited" | "suspended" | "deactivated";
  invited_by: string;
  invited_by_email: string;
  invited_at: string;
  joined_at: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspended_by_email: string | null;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivated_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: string;
  owner_email: string;
  owner_name: string;
  status: "active" | "suspended" | "trial" | "cancelled";
  settings: Record<string, any>;
  member_count: number;
  subscription: Subscription;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
  plan_id: string;
}

export interface InviteMemberData {
  email: string;
  role: "admin" | "developer" | "analyst" | "viewer";
  message?: string;
}

export interface InviteMemberResponse {
  detail: string;
  member: WorkspaceMember;
}

export interface UpdateMemberRoleData {
  role: "admin" | "developer" | "analyst" | "viewer";
}

export interface MemberActionResponse {
  detail: string;
  member: WorkspaceMember;
}

// API Client
export const workspaceApi = {
  // Plans
  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<PaginatedResponse<Plan>>(
      "/api/plans/"
    );
    return response.results;
  },

  async getPlan(planId: string): Promise<Plan> {
    return apiClient.get(`/api/plans/${planId}/`);
  },

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get<PaginatedResponse<Workspace>>(
      "/api/workspaces/",
      getAuthOptions()
    );
    return response.results;
  },

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    return apiClient.get(`/api/workspaces/${workspaceId}/`, getAuthOptions());
  },

  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    return apiClient.post("/api/workspaces/", data, getAuthOptions());
  },

  async updateWorkspace(
    workspaceId: string,
    data: Partial<Workspace>
  ): Promise<Workspace> {
    return apiClient.patch(`/api/workspaces/${workspaceId}/`, data, getAuthOptions());
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    return apiClient.delete(`/api/workspaces/${workspaceId}/`, getAuthOptions());
  },

  async switchWorkspace(workspaceId: string): Promise<{
    detail: string;
    workspace: Workspace;
    membership: WorkspaceMember;
  }> {
    return apiClient.post("/api/workspaces/switch/", {
      workspace_id: workspaceId,
    }, getAuthOptions());
  },

  // Subscription
  async getSubscription(workspaceId: string): Promise<Subscription> {
    return apiClient.get(`/api/workspaces/${workspaceId}/subscription/`, getAuthOptions());
  },

  // Members
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await apiClient.get<PaginatedResponse<WorkspaceMember>>(
      `/api/workspaces/${workspaceId}/members/`,
      getAuthOptions()
    );
    return response.results;
  },

  async inviteMember(
    workspaceId: string,
    data: InviteMemberData
  ): Promise<InviteMemberResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/invite_member/`,
      data,
      getAuthOptions()
    );
  },

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: string
  ): Promise<MemberActionResponse> {
    return apiClient.patch(
      `/api/workspaces/${workspaceId}/members/${memberId}/role/`,
      { role },
      getAuthOptions()
    );
  },

  async suspendMember(
    workspaceId: string,
    memberId: string
  ): Promise<MemberActionResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/members/${memberId}/suspend/`,
      {},
      getAuthOptions()
    );
  },

  async activateMember(
    workspaceId: string,
    memberId: string
  ): Promise<MemberActionResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/members/${memberId}/activate/`,
      {},
      getAuthOptions()
    );
  },

  async deactivateMember(
    workspaceId: string,
    memberId: string
  ): Promise<MemberActionResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/members/${memberId}/deactivate/`,
      {},
      getAuthOptions()
    );
  },

  async removeMember(
    workspaceId: string,
    memberId: string
  ): Promise<{ detail: string }> {
    return apiClient.delete(
      `/api/workspaces/${workspaceId}/members/${memberId}/`,
      getAuthOptions()
    );
  },
};
