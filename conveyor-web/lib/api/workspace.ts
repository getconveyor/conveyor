import { apiClient, getAuthOptions } from "./client";

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
    return apiClient.get("/api/plans/");
  },

  async getPlan(planId: string): Promise<Plan> {
    return apiClient.get(`/api/plans/${planId}/`);
  },

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return apiClient.get("/api/workspaces/", getAuthOptions());
  },

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    return apiClient.get(`/api/workspaces/${workspaceId}/`);
  },

  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    return apiClient.post("/api/workspaces/", data);
  },

  async updateWorkspace(
    workspaceId: string,
    data: Partial<Workspace>
  ): Promise<Workspace> {
    return apiClient.patch(`/api/workspaces/${workspaceId}/`, data);
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    return apiClient.delete(`/api/workspaces/${workspaceId}/`);
  },

  async switchWorkspace(workspaceId: string): Promise<{
    detail: string;
    workspace: Workspace;
    membership: WorkspaceMember;
  }> {
    return apiClient.post("/api/workspaces/switch/", {
      workspace_id: workspaceId,
    });
  },

  // Subscription
  async getSubscription(workspaceId: string): Promise<Subscription> {
    return apiClient.get(`/api/workspaces/${workspaceId}/subscription/`);
  },

  // Members
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return apiClient.get(`/api/workspaces/${workspaceId}/members/`);
  },

  async inviteMember(
    workspaceId: string,
    data: InviteMemberData
  ): Promise<InviteMemberResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/invite_member/`,
      data
    );
  },

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: string
  ): Promise<MemberActionResponse> {
    return apiClient.patch(
      `/api/workspaces/${workspaceId}/members/${memberId}/role/`,
      { role }
    );
  },

  async suspendMember(
    workspaceId: string,
    memberId: string
  ): Promise<MemberActionResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/members/${memberId}/suspend/`
    );
  },

  async activateMember(
    workspaceId: string,
    memberId: string
  ): Promise<MemberActionResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/members/${memberId}/activate/`
    );
  },

  async deactivateMember(
    workspaceId: string,
    memberId: string
  ): Promise<MemberActionResponse> {
    return apiClient.post(
      `/api/workspaces/${workspaceId}/members/${memberId}/deactivate/`
    );
  },

  async removeMember(
    workspaceId: string,
    memberId: string
  ): Promise<{ detail: string }> {
    return apiClient.delete(
      `/api/workspaces/${workspaceId}/members/${memberId}/`
    );
  },
};
