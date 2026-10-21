import { useState } from 'react'
import { useChainStore } from '../store/useChainStore'

function prettyJson(str: string): string {
  try { return JSON.stringify(JSON.parse(str), null, 2) }
  catch { return str }
}

export default function ResponsePanel() {
  const { nodes, selectedId } = useChainStore((s) => ({
    nodes: s.nodes,
    selectedId: s.selectedId,
  }))

  const [tab, setTab] = useState<'body' | 'headers'>('body')

  const node = nodes.find((n) => n.id === selectedId)
  const res = node?.data.response

  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[11px] text-zinc-700">Select a node to view its response</p>
      </div>
    )
  }

  if (!res) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[11px] text-zinc-700">Run the chain to see the response</p>
      </div>
    )
  }

  const statusColor = res.statusCode >= 400 ? 'text-red-400' :
    res.statusCode >= 300 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[#1f1f2e] bg-[#0c0c10]/50 shrink-0">
        <span className={`text-sm font-bold font-mono ${statusColor}`}>
          {res.statusCode}
        </span>
        <span className="text-xs text-zinc-600">{res.statusText}</span>
        <span className="text-xs text-zinc-700 ml-auto">{res.duration}ms</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1f1f2e] shrink-0">
        {(['body', 'headers'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[11px] capitalize transition-colors ${
              tab === t ? 'text-violet-300 border-b border-violet-500' : 'text-zinc-600 hover:text-zinc-400'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {tab === 'body' ? (
          <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap break-all">
            {prettyJson(res.body)}
          </pre>
        ) : (
          <div className="space-y-1">
            {Object.entries(res.headers).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[11px]">
                <span className="font-mono text-zinc-500 shrink-0">{k}:</span>
                <span className="font-mono text-zinc-400 break-all">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
