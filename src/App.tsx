import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useChainStore } from './store/useChainStore'
import { nodeTypes } from './nodes'
import NodeEditor from './components/NodeEditor'
import ResponsePanel from './components/ResponsePanel'
import { Play, Plus, Trash2, Link2 } from 'lucide-react'

export default function App() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, clearResults, runChain,
    selectedId, selectNode,
    isRunning,
  } = useChainStore()

  const onPaneClick = useCallback(() => selectNode(null), [selectNode])

  return (
    <div className="h-screen bg-[#0c0c10] text-[#e4e4f0] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 h-12 bg-[#111118] border-b border-[#1f1f2e] shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-violet-400" />
          <span className="font-semibold text-sm">querycanvas</span>
        </div>
        <span className="text-xs text-zinc-600">Visual REST API chain builder</span>
        <div className="flex-1" />
        <button
          onClick={addNode}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[#2a2a38] text-zinc-400 hover:text-zinc-200 hover:border-[#3a3a50] transition-colors"
        >
          <Plus size={12} /> Add Node
        </button>
        <button
          onClick={clearResults}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[#2a2a38] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Trash2 size={12} /> Clear
        </button>
        <button
          onClick={() => { void runChain() }}
          disabled={isRunning}
          className={`flex items-center gap-1.5 text-xs px-4 py-1.5 rounded font-semibold transition-all ${
            isRunning
              ? 'bg-violet-500/30 text-violet-300 cursor-not-allowed'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          <Play size={12} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Running...' : 'Run Chain'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <main className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            fitView
            colorMode="dark"
            defaultEdgeOptions={{ animated: true, style: { stroke: '#3a3a50' } }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e1e2e" />
            <Controls />
            <MiniMap nodeColor="#1c1c26" maskColor="rgba(12,12,16,0.8)" />

            <Panel position="bottom-center">
              <div className="bg-[#111118]/90 backdrop-blur-sm border border-[#2a2a38] rounded-lg px-4 py-2 text-[10px] text-zinc-600 flex items-center gap-4">
                <span>{nodes.length} nodes</span>
                <span>{edges.length} connections</span>
                <span>Drag handles to connect nodes</span>
              </div>
            </Panel>
          </ReactFlow>
        </main>

        {/* Right sidebar */}
        <aside className="w-72 shrink-0 bg-[#111118] border-l border-[#1f1f2e] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#1f1f2e] shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              {selectedId ? 'Node Config' : 'Chain Editor'}
            </span>
          </div>

          <NodeEditor />

          {selectedId && (
            <>
              <div className="px-3 py-2 border-t border-b border-[#1f1f2e] bg-[#0c0c10]/30 shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Response</span>
              </div>
              <div className="flex flex-col overflow-hidden" style={{ height: '40%' }}>
                <ResponsePanel />
              </div>
            </>
          )}

          {!selectedId && (
            <div className="p-3 border-t border-[#1f1f2e] text-[10px] text-zinc-700 leading-relaxed space-y-2">
              <p><span className="text-zinc-500">1.</span> Add nodes for each API endpoint</p>
              <p><span className="text-zinc-500">2.</span> Connect them to define execution order</p>
              <p><span className="text-zinc-500">3.</span> Use <code className="text-zinc-600">{'{{var}}'}</code> to inject data from previous responses</p>
              <p><span className="text-zinc-500">4.</span> Click Run Chain to execute</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
