import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import type { ApiNodeData, FlowEdgeData, HttpMethod } from '../types'
import type { ApiNode } from '../nodes/ApiNode'

type FlowEdge = Edge<FlowEdgeData>

interface ChainStore {
  nodes: ApiNode[]
  edges: FlowEdge[]
  selectedId: string | null
  isRunning: boolean

  onNodesChange: (changes: NodeChange<ApiNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void
  onConnect: (connection: Connection) => void

  addNode: () => void
  updateNodeData: (id: string, patch: Partial<ApiNodeData>) => void
  selectNode: (id: string | null) => void
  runChain: () => Promise<void>
  clearResults: () => void
}

const DEFAULT_HEADERS = [{ key: 'Content-Type', value: 'application/json' }]

let nodeCounter = 3

const INITIAL_NODES: ApiNode[] = [
  {
    id: '1',
    type: 'apiNode',
    position: { x: 80, y: 180 },
    data: {
      label: 'Fetch Users',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users',
      headers: DEFAULT_HEADERS,
      body: '',
      status: 'idle',
    },
  },
  {
    id: '2',
    type: 'apiNode',
    position: { x: 420, y: 180 },
    data: {
      label: 'Fetch Posts',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts?userId=1',
      headers: DEFAULT_HEADERS,
      body: '',
      status: 'idle',
    },
  },
]

const INITIAL_EDGES: FlowEdge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    data: { jsonPath: '$[0].id', targetVar: 'userId' },
  },
]

function resolveTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`)
}

function extractJsonPath(json: string, path: string): string {
  try {
    const obj = JSON.parse(json) as unknown
    const clean = path.replace(/^\$/, '')
    const parts = clean.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
    let cur: unknown = obj
    for (const part of parts) {
      if (cur == null || typeof cur !== 'object') return ''
      cur = (cur as Record<string, unknown>)[part]
    }
    return String(cur ?? '')
  } catch {
    return ''
  }
}

export const useChainStore = create<ChainStore>()(
  persist(
    (set, get) => ({
      nodes: INITIAL_NODES,
      edges: INITIAL_EDGES,
      selectedId: null,
      isRunning: false,

      onNodesChange: (changes) =>
        set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

      onEdgesChange: (changes) =>
        set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

      onConnect: (connection) =>
        set((s) => ({
          edges: addEdge(
            { ...connection, animated: true, data: { jsonPath: '$[0].id', targetVar: 'id' } },
            s.edges
          ) as FlowEdge[],
        })),

      addNode: () => {
        nodeCounter++
        const id = String(nodeCounter)
        const newNode: ApiNode = {
          id,
          type: 'apiNode',
          position: { x: 80 + Math.random() * 400, y: 80 + Math.random() * 200 },
          data: {
            label: `Request ${id}`,
            method: 'GET' as HttpMethod,
            url: 'https://jsonplaceholder.typicode.com/todos/1',
            headers: DEFAULT_HEADERS,
            body: '',
            status: 'idle',
          },
        }
        set((s) => ({ nodes: [...s.nodes, newNode], selectedId: id }))
      },

      updateNodeData: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
          ),
        })),

      selectNode: (id) => set({ selectedId: id }),

      clearResults: () =>
        set((s) => ({
          nodes: s.nodes.map((n) => ({
            ...n,
            data: { ...n.data, status: 'idle' as const, response: undefined },
          })),
        })),

      runChain: async () => {
        const { nodes, edges, updateNodeData } = get()
        set({ isRunning: true })

        // Topological sort
        const inDegree = new Map<string, number>()
        const adjList = new Map<string, string[]>()
        for (const n of nodes) { inDegree.set(n.id, 0); adjList.set(n.id, []) }
        for (const e of edges) {
          inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
          adjList.get(e.source)?.push(e.target)
        }
        const queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id)
        const order: string[] = []
        while (queue.length) {
          const id = queue.shift()!
          order.push(id)
          for (const next of adjList.get(id) ?? []) {
            const deg = (inDegree.get(next) ?? 1) - 1
            inDegree.set(next, deg)
            if (deg === 0) queue.push(next)
          }
        }
        for (const n of nodes) if (!order.includes(n.id)) order.push(n.id)

        const responseMap = new Map<string, string>()

        for (const id of order) {
          const node = get().nodes.find((n) => n.id === id)
          if (!node) continue

          const inEdges = edges.filter((e) => e.target === id)
          const vars: Record<string, string> = {}
          for (const edge of inEdges) {
            const srcBody = responseMap.get(edge.source) ?? ''
            if (edge.data?.jsonPath && edge.data?.targetVar) {
              vars[String(edge.data.targetVar)] = extractJsonPath(srcBody, String(edge.data.jsonPath))
            }
          }

          const url = resolveTemplate(node.data.url, vars)
          const body = resolveTemplate(node.data.body, vars)

          updateNodeData(id, { status: 'running' })
          const t0 = Date.now()

          try {
            const headers: Record<string, string> = {}
            for (const h of node.data.headers) {
              if (h.key.trim()) headers[h.key.trim()] = resolveTemplate(h.value, vars)
            }
            const opts: RequestInit = { method: node.data.method, headers }
            if (body && !['GET', 'DELETE'].includes(node.data.method)) opts.body = body

            const res = await fetch(url, opts)
            const text = await res.text()
            const duration = Date.now() - t0
            responseMap.set(id, text)
            updateNodeData(id, {
              status: 'success',
              response: {
                statusCode: res.status,
                statusText: res.statusText,
                body: text,
                duration,
                headers: Object.fromEntries(res.headers.entries()),
              },
            })
          } catch (err) {
            updateNodeData(id, {
              status: 'error',
              response: {
                statusCode: 0,
                statusText: String(err),
                body: '',
                duration: Date.now() - t0,
                headers: {},
              },
            })
          }
        }

        set({ isRunning: false })
      },
    }),
    {
      name: 'querycanvas-chain',
      partialize: (s) => ({
        nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, status: 'idle' as const, response: undefined } })),
        edges: s.edges,
      }),
    }
  )
)
