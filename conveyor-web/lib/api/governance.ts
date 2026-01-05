/**
 * Governance API client for data catalog, lineage, quality rules, and policies
 */

import { apiClient, getAuthOptions } from "./client";

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types matching backend models

export interface DataAsset {
  id: string;
  workspace: string;
  name: string;
  description: string;
  asset_type: "table" | "view" | "file" | "stream" | "api" | "other";
  schema_name: string | null;
  table_name: string | null;
  location: string | null;
  format: string | null;
  owner: string | null;
  owner_name: string | null;
  tags: string;
  tags_list?: string[];
  metadata: Record<string, any>;
  is_certified: boolean;
  certified_by: string | null;
  certified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataLineage {
  id: string;
  source_asset: string;
  source_asset_name: string;
  target_asset: string;
  target_asset_name: string;
  transformation_type: string;
  transformation_logic: string | null;
  pipeline: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LineageGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    certified: boolean;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>;
}

export interface DataQualityRule {
  id: string;
  workspace: string;
  name: string;
  description: string;
  rule_type: string;
  data_asset: string | null;
  asset_name: string | null;
  column_name: string | null;
  expression: string;
  threshold: number;
  severity: "critical" | "high" | "medium" | "low";
  is_active: boolean;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataQualityResult {
  id: string;
  rule: string;
  rule_name: string;
  rule_severity: string;
  passed: boolean;
  actual_value: string | null;
  expected_value: string | null;
  records_checked: number;
  records_failed: number;
  failure_percentage: number;
  error_message: string | null;
  execution_time_ms: number;
  executed_at: string;
}

export interface DataQualitySummary {
  total_rules: number;
  active_rules: number;
  passed_checks: number;
  failed_checks: number;
  pass_rate: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface GlossaryTerm {
  id: string;
  workspace: string;
  term: string;
  definition: string;
  category: string | null;
  synonyms: string | null;
  related_terms: string[];
  related_terms_data: Array<{ id: string; term: string }>;
  owner: string | null;
  owner_name: string | null;
  status: "draft" | "pending" | "approved" | "deprecated";
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  workspace: string;
  name: string;
  description: string;
  policy_type: string;
  rules: Record<string, any>;
  applies_to: Record<string, any>;
  enforcement_level: "advisory" | "warning" | "blocking";
  is_active: boolean;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogSummary {
  total_assets: number;
  certified_assets: number;
  by_type: Array<{ asset_type: string; count: number }>;
  recent_updates: DataAsset[];
}

export interface PolicySummary {
  total_policies: number;
  active_policies: number;
  by_type: Array<{ policy_type: string; count: number }>;
  by_enforcement: Array<{ enforcement_level: string; count: number }>;
}

// API Client
export const governanceApi = {
  // Data Assets (Catalog)
  async getAssets(params?: {
    type?: string;
    certified?: boolean;
    search?: string;
    tags?: string;
  }): Promise<DataAsset[]> {
    const response = await apiClient.get<PaginatedResponse<DataAsset>>(
      "/api/governance/assets/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getAsset(id: string): Promise<DataAsset> {
    return apiClient.get<DataAsset>(
      `/api/governance/assets/${id}/`,
      getAuthOptions()
    );
  },

  async createAsset(data: Partial<DataAsset>): Promise<DataAsset> {
    return apiClient.post<DataAsset>(
      "/api/governance/assets/",
      data,
      getAuthOptions()
    );
  },

  async updateAsset(id: string, data: Partial<DataAsset>): Promise<DataAsset> {
    return apiClient.patch<DataAsset>(
      `/api/governance/assets/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteAsset(id: string): Promise<void> {
    return apiClient.delete(`/api/governance/assets/${id}/`, getAuthOptions());
  },

  async certifyAsset(id: string): Promise<DataAsset> {
    return apiClient.post<DataAsset>(
      `/api/governance/assets/${id}/certify/`,
      {},
      getAuthOptions()
    );
  },

  async uncertifyAsset(id: string): Promise<DataAsset> {
    return apiClient.post<DataAsset>(
      `/api/governance/assets/${id}/uncertify/`,
      {},
      getAuthOptions()
    );
  },

  async getCatalogSummary(): Promise<CatalogSummary> {
    return apiClient.get<CatalogSummary>(
      "/api/governance/assets/summary/",
      getAuthOptions()
    );
  },

  // Data Lineage
  async getLineage(params?: { asset?: string }): Promise<DataLineage[]> {
    const response = await apiClient.get<PaginatedResponse<DataLineage>>(
      "/api/governance/lineage/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getLineageGraph(params?: {
    asset?: string;
    depth?: number;
  }): Promise<LineageGraph> {
    return apiClient.get<LineageGraph>("/api/governance/lineage/graph/", {
      ...getAuthOptions(),
      params,
    });
  },

  async createLineage(data: Partial<DataLineage>): Promise<DataLineage> {
    return apiClient.post<DataLineage>(
      "/api/governance/lineage/",
      data,
      getAuthOptions()
    );
  },

  // Quality Rules
  async getQualityRules(params?: {
    asset?: string;
    type?: string;
    severity?: string;
    active?: boolean;
  }): Promise<DataQualityRule[]> {
    const response = await apiClient.get<PaginatedResponse<DataQualityRule>>(
      "/api/governance/quality-rules/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getQualityRule(id: string): Promise<DataQualityRule> {
    return apiClient.get<DataQualityRule>(
      `/api/governance/quality-rules/${id}/`,
      getAuthOptions()
    );
  },

  async createQualityRule(
    data: Partial<DataQualityRule>
  ): Promise<DataQualityRule> {
    return apiClient.post<DataQualityRule>(
      "/api/governance/quality-rules/",
      data,
      getAuthOptions()
    );
  },

  async updateQualityRule(
    id: string,
    data: Partial<DataQualityRule>
  ): Promise<DataQualityRule> {
    return apiClient.patch<DataQualityRule>(
      `/api/governance/quality-rules/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteQualityRule(id: string): Promise<void> {
    return apiClient.delete(
      `/api/governance/quality-rules/${id}/`,
      getAuthOptions()
    );
  },

  async runQualityRule(id: string): Promise<DataQualityResult> {
    return apiClient.post<DataQualityResult>(
      `/api/governance/quality-rules/${id}/run/`,
      {},
      getAuthOptions()
    );
  },

  async toggleQualityRule(id: string): Promise<DataQualityRule> {
    return apiClient.post<DataQualityRule>(
      `/api/governance/quality-rules/${id}/toggle_active/`,
      {},
      getAuthOptions()
    );
  },

  // Quality Results
  async getQualityResults(params?: {
    rule?: string;
    passed?: boolean;
  }): Promise<DataQualityResult[]> {
    const response = await apiClient.get<PaginatedResponse<DataQualityResult>>(
      "/api/governance/quality-results/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getQualitySummary(): Promise<DataQualitySummary> {
    return apiClient.get<DataQualitySummary>(
      "/api/governance/quality-results/summary/",
      getAuthOptions()
    );
  },

  // Glossary
  async getGlossaryTerms(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<GlossaryTerm[]> {
    const response = await apiClient.get<PaginatedResponse<GlossaryTerm>>(
      "/api/governance/glossary/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getGlossaryTerm(id: string): Promise<GlossaryTerm> {
    return apiClient.get<GlossaryTerm>(
      `/api/governance/glossary/${id}/`,
      getAuthOptions()
    );
  },

  async createGlossaryTerm(data: Partial<GlossaryTerm>): Promise<GlossaryTerm> {
    return apiClient.post<GlossaryTerm>(
      "/api/governance/glossary/",
      data,
      getAuthOptions()
    );
  },

  async updateGlossaryTerm(
    id: string,
    data: Partial<GlossaryTerm>
  ): Promise<GlossaryTerm> {
    return apiClient.patch<GlossaryTerm>(
      `/api/governance/glossary/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteGlossaryTerm(id: string): Promise<void> {
    return apiClient.delete(
      `/api/governance/glossary/${id}/`,
      getAuthOptions()
    );
  },

  async approveGlossaryTerm(id: string): Promise<GlossaryTerm> {
    return apiClient.post<GlossaryTerm>(
      `/api/governance/glossary/${id}/approve/`,
      {},
      getAuthOptions()
    );
  },

  async getGlossaryCategories(): Promise<string[]> {
    return apiClient.get<string[]>(
      "/api/governance/glossary/categories/",
      getAuthOptions()
    );
  },

  // Policies
  async getPolicies(params?: {
    type?: string;
    active?: boolean;
  }): Promise<Policy[]> {
    const response = await apiClient.get<PaginatedResponse<Policy>>(
      "/api/governance/policies/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getPolicy(id: string): Promise<Policy> {
    return apiClient.get<Policy>(
      `/api/governance/policies/${id}/`,
      getAuthOptions()
    );
  },

  async createPolicy(data: Partial<Policy>): Promise<Policy> {
    return apiClient.post<Policy>(
      "/api/governance/policies/",
      data,
      getAuthOptions()
    );
  },

  async updatePolicy(id: string, data: Partial<Policy>): Promise<Policy> {
    return apiClient.patch<Policy>(
      `/api/governance/policies/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deletePolicy(id: string): Promise<void> {
    return apiClient.delete(
      `/api/governance/policies/${id}/`,
      getAuthOptions()
    );
  },

  async togglePolicy(id: string): Promise<Policy> {
    return apiClient.post<Policy>(
      `/api/governance/policies/${id}/toggle_active/`,
      {},
      getAuthOptions()
    );
  },

  async getPolicySummary(): Promise<PolicySummary> {
    return apiClient.get<PolicySummary>(
      "/api/governance/policies/summary/",
      getAuthOptions()
    );
  },
};

export default governanceApi;
