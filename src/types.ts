export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type NodeStatus = 'idle' | 'running' | 'success' | 'error'

export interface HeaderEntry { key: string; value: string }

export interface ApiNodeData extends Record<string, unknown> {
  label: string
  method: HttpMethod
  url: string
  headers: HeaderEntry[]
  body: string
  status: NodeStatus
  response?: {
    statusCode: number
    statusText: string
    body: string
    duration: number
    headers: Record<string, string>
  }
}

export interface FlowEdgeData extends Record<string, unknown> {
  jsonPath: string
  targetVar: string
}
