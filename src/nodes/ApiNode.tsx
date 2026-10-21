import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import type { ApiNodeData, HttpMethod } from '../types'
import { useChainStore } from '../store/useChainStore'

export type ApiNode = Node<ApiNodeData, 'apiNode'>

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  POST:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  PUT:    'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PATCH:  'bg-orange-500/15 text-orange-300 border-orange-500/30',
  DELETE: 'bg-red-500/15 text-red-300 border-red-500/30',
}

const STATUS_RING: Record<string, string> = {
  idle:    'border-[#2a2a38]',
  running: 'border-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.3)]',
  success: 'border-emerald-500/60',
  error:   'border-red-500/60',
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 ${
      status === 'running' ? 'bg-violet-400 animate-pulse' :
      status === 'success' ? 'bg-emerald-400' :
      status === 'error'   ? 'bg-red-400' : 'bg-zinc-700'
    }`} />
  )
}

export const ApiNodeComponent = memo(function ApiNodeComponent({ id, data, selected }: NodeProps<ApiNode>) {
  const selectNode = useChainStore((s) => s.selectNode)
  const d = data as ApiNodeData

  const domain = (() => {
    try { return new URL(d.url).hostname }
    catch { return d.url.slice(0, 28) }
  })()

  return (
    <div
      onClick={() => selectNode(id)}
      className={`w-52 bg-[#1c1c26] border rounded-xl overflow-hidden cursor-pointer transition-all ${
        selected ? 'border-violet-500/60 shadow-[0_0_16px_rgba(124,58,237,0.25)]' : STATUS_RING[d.status]
      }`}
    >
      <Handle type="target" position={Position.Left}
        className="!w-3 !h-3 !bg-[#2a2a38] !border-[#3a3a50] hover:!bg-violet-500 transition-colors" />

      <div className="px-3 py-2 bg-[#111118] border-b border-[#2a2a38] flex items-center gap-2">
        <StatusDot status={d.status} />
        <span className="text-xs font-semibold text-[#e4e4f0] truncate flex-1">{d.label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_COLOR[d.method]}`}>
          {d.method}
        </span>
      </div>

      <div className="px-3 py-2 space-y-1">
        <p className="text-[11px] font-mono text-zinc-400 truncate">{domain}</p>
        {d.response && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-mono font-semibold ${
              (d.response as { statusCode: number }).statusCode >= 400 ? 'text-red-400' :
              (d.response as { statusCode: number }).statusCode >= 300 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {(d.response as { statusCode: number }).statusCode}
            </span>
            <span className="text-[10px] text-zinc-600">{(d.response as { duration: number }).duration}ms</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right}
        className="!w-3 !h-3 !bg-[#2a2a38] !border-[#3a3a50] hover:!bg-violet-500 transition-colors" />
    </div>
  )
})
