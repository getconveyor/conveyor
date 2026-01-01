import { apiClient } from './client'

// Paginated response type
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Types

export interface Connection {
    id: string
    workspace?: string
    name: string
    type: string
    host?: string
    port?: string
    database?: string
    username?: string
    ssl?: boolean
    status: 'active' | 'inactive' | 'error' | 'testing'
    last_tested: string | null
    config?: Record<string, any>
    created_by?: string
    created_at: string
    updated_at: string
}

export interface CreateConnectionData {
    name: string
    type: string
    host: string
    port?: string
    database?: string
    username?: string
    password?: string
    ssl?: boolean
    config?: Record<string, any>
}

export interface DataSource {
    id: string
    workspace?: string
    connection?: string
    connection_details?: {
        name: string
        type: string
    }
    // List view fields
    connection_name?: string
    connection_type?: string

    name: string
    type: string
    tables?: Record<string, any>
    status: 'active' | 'inactive' | 'error' | 'syncing'
    last_sync: string | null
    record_count: number
    created_at: string
    updated_at?: string
}

export interface Pipeline {
    id: string
    workspace?: string
    name: string
    description?: string
    status: 'active' | 'paused' | 'error' | 'running' | 'idle'

    source_connection?: string
    source_connection_details?: {
        name: string
        type: string
    }
    // List view fields
    source_name?: string

    destination_connection?: string
    destination_connection_details?: {
        name: string
        type: string
    }
    // List view fields
    destination_name?: string

    schedule?: string
    last_run: string | null
    next_run: string | null
    run_count: number
    success_rate: number
    records_processed?: number
    config?: Record<string, any>
    created_by?: string
    created_at: string
    updated_at?: string
    is_scheduled: boolean
}

export interface CreatePipelineData {
    name: string
    description?: string
    source_connection: string
    destination_connection: string
    config?: Record<string, any>
    schedule?: string
}

export interface PipelineRun {
    id: string
    pipeline?: string
    pipeline_name?: string
    status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
    start_time: string | null
    end_time: string | null
    duration: number | null
    records_processed: number | null
    bytes_processed?: number | null
    errors?: Record<string, any> | null
    metrics?: Record<string, any> | null
    triggered_by?: 'manual' | 'schedule' | 'api'
    created_at: string
}

export interface Schedule {
    id: string
    workspace?: string
    pipeline?: string
    pipeline_name?: string
    name: string
    cron_expression: string
    timezone?: string
    enabled: boolean
    last_run: string | null
    next_run: string | null
    created_at?: string
    updated_at?: string
}

// API Client
export const integrationApi = {
    // Connections
    async getConnections(): Promise<Connection[]> {
        const response = await apiClient.get<PaginatedResponse<Connection>>('/api/integration/connections/')
        return response.results
    },

    async getConnection(id: string): Promise<Connection> {
        return apiClient.get(`/api/integration/connections/${id}/`)
    },

    async createConnection(data: CreateConnectionData): Promise<Connection> {
        return apiClient.post('/api/integration/connections/', data)
    },

    async updateConnection(id: string, data: Partial<Connection>): Promise<Connection> {
        return apiClient.patch(`/api/integration/connections/${id}/`, data)
    },

    async deleteConnection(id: string): Promise<void> {
        return apiClient.delete(`/api/integration/connections/${id}/`)
    },

    async testConnection(id: string): Promise<{ success: boolean; message: string }> {
        return apiClient.post(`/api/integration/connections/${id}/test/`)
    },

    // Data Sources
    async getDataSources(): Promise<DataSource[]> {
        const response = await apiClient.get<PaginatedResponse<DataSource>>('/api/integration/data-sources/')
        return response.results
    },

    async getDataSource(id: string): Promise<DataSource> {
        return apiClient.get(`/api/integration/data-sources/${id}/`)
    },

    async syncDataSource(id: string): Promise<void> {
        return apiClient.post(`/api/integration/data-sources/${id}/sync/`)
    },

    // Pipelines
    async getPipelines(): Promise<Pipeline[]> {
        const response = await apiClient.get<PaginatedResponse<Pipeline>>('/api/integration/pipelines/')
        return response.results
    },

    async getPipeline(id: string): Promise<Pipeline> {
        return apiClient.get(`/api/integration/pipelines/${id}/`)
    },

    async createPipeline(data: CreatePipelineData): Promise<Pipeline> {
        return apiClient.post('/api/integration/pipelines/', data)
    },

    async updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline> {
        return apiClient.patch(`/api/integration/pipelines/${id}/`, data)
    },

    async deletePipeline(id: string): Promise<void> {
        return apiClient.delete(`/api/integration/pipelines/${id}/`)
    },

    async triggerPipeline(id: string): Promise<PipelineRun> {
        return apiClient.post(`/api/integration/pipelines/${id}/trigger/`)
    },

    // Pipeline Runs
    async getPipelineRuns(pipelineId?: string): Promise<PipelineRun[]> {
        const query = pipelineId ? `?pipeline=${pipelineId}` : ''
        const response = await apiClient.get<PaginatedResponse<PipelineRun>>(`/api/integration/pipeline-runs/${query}`)
        return response.results
    },

    async getPipelineRun(id: string): Promise<PipelineRun> {
        return apiClient.get(`/api/integration/pipeline-runs/${id}/`)
    },

    async cancelPipelineRun(id: string): Promise<void> {
        return apiClient.post(`/api/integration/pipeline-runs/${id}/cancel/`)
    },

    // Schedules
    async getSchedules(): Promise<Schedule[]> {
        const response = await apiClient.get<PaginatedResponse<Schedule>>('/api/integration/schedules/')
        return response.results
    },

    async createSchedule(data: { pipeline: string; cron_expression: string; name?: string }): Promise<Schedule> {
        return apiClient.post('/api/integration/schedules/', data)
    },

    async deleteSchedule(id: string): Promise<void> {
        return apiClient.delete(`/api/integration/schedules/${id}/`)
    },
}
