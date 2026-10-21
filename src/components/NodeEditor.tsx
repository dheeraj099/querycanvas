import { useChainStore } from '../store/useChainStore'
import type { ApiNodeData, HttpMethod, HeaderEntry } from '../types'
import { Plus, Trash2 } from 'lucide-react'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET:    'text-emerald-300',
  POST:   'text-blue-300',
  PUT:    'text-amber-300',
  PATCH:  'text-orange-300',
  DELETE: 'text-red-300',
}

export default function NodeEditor() {
  const { nodes, selectedId, updateNodeData } = useChainStore((s) => ({
    nodes: s.nodes,
    selectedId: s.selectedId,
    updateNodeData: s.updateNodeData,
  }))

  const node = nodes.find((n) => n.id === selectedId)
  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[11px] text-zinc-700 text-center leading-relaxed px-4">
          Select a node to edit its<br />URL, method, headers and body
        </p>
      </div>
    )
  }

  const d = node.data
  const nodeId = node.id

  function patch(p: Partial<ApiNodeData>) { updateNodeData(nodeId, p) }

  function addHeader() {
    patch({ headers: [...d.headers, { key: '', value: '' }] })
  }

  function updateHeader(i: number, field: keyof HeaderEntry, val: string) {
    const headers = d.headers.map((h, idx) => idx === i ? { ...h, [field]: val } : h)
    patch({ headers })
  }

  function removeHeader(i: number) {
    patch({ headers: d.headers.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* Label */}
      <div>
        <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">Label</label>
        <input
          value={d.label}
          onChange={(e) => patch({ label: e.target.value })}
          className="w-full bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1.5 text-xs text-[#e4e4f0] outline-none focus:border-violet-500/50"
        />
      </div>

      {/* Method + URL */}
      <div>
        <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">Request</label>
        <div className="flex gap-1.5">
          <select
            value={d.method}
            onChange={(e) => patch({ method: e.target.value as HttpMethod })}
            className={`bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1.5 text-xs font-bold outline-none focus:border-violet-500/50 ${METHOD_COLOR[d.method]}`}
          >
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={d.url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1.5 text-xs font-mono text-zinc-300 outline-none focus:border-violet-500/50 min-w-0"
          />
        </div>
        <p className="text-[10px] text-zinc-700 mt-1">Use <code className="text-zinc-600">{'{{varName}}'}</code> to inject values from previous nodes</p>
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-zinc-600 uppercase tracking-wider">Headers</label>
          <button onClick={addHeader}
            className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-violet-400 transition-colors">
            <Plus size={10} /> Add
          </button>
        </div>
        <div className="space-y-1">
          {d.headers.map((h, i) => (
            <div key={i} className="flex gap-1">
              <input
                value={h.key}
                onChange={(e) => updateHeader(i, 'key', e.target.value)}
                placeholder="Key"
                className="w-32 bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1 text-[11px] font-mono text-zinc-400 outline-none focus:border-violet-500/50"
              />
              <input
                value={h.value}
                onChange={(e) => updateHeader(i, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1 text-[11px] font-mono text-zinc-400 outline-none focus:border-violet-500/50 min-w-0"
              />
              <button onClick={() => removeHeader(i)}
                className="text-zinc-700 hover:text-red-400 transition-colors px-1">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      {!['GET', 'DELETE'].includes(d.method) && (
        <div>
          <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">Body</label>
          <textarea
            value={d.body}
            onChange={(e) => patch({ body: e.target.value })}
            placeholder={'{\n  "key": "value"\n}'}
            rows={6}
            className="w-full bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1.5 text-[11px] font-mono text-zinc-300 outline-none focus:border-violet-500/50 resize-none leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
