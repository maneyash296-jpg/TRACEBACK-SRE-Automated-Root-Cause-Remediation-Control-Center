import React, { useState } from 'react';
import { StepId, GraphNode, GraphEdge } from '../types';

interface ArchitectureScreenProps {
  onNavigate: (step: StepId) => void;
  graphData: { nodes: GraphNode[]; edges: GraphEdge[] } | null;
}

export const ArchitectureScreen: React.FC<ArchitectureScreenProps> = ({
  onNavigate,
  graphData,
}) => {
  const [searchQuery, setSearchQuery] = useState('coupon.apply_discount');
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'calls' | 'imports' | 'tests'>('all');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string>('coupon.apply_discount');

  return (
    <div className="flex flex-col w-full gap-4 pb-16">
      {/* Header & Telemetry Control Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm uppercase tracking-wider text-[#418fff] font-semibold">
              STAGE 03 // STATIC &amp; RUNTIME TELEMETRY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#418fff] animate-pulse"></span>
            <span className="font-code-sm text-[#8b919f]">AST Graph Hash: 8b1f-v4</span>
          </div>
          <h1 className="font-headline-lg text-[#dae3ee] tracking-tight font-semibold">Architecture</h1>
          <p className="font-body-md text-[#c1c6d6] max-w-3xl">
            Explore imports, function calls, and component relationships derived from deterministic AST parsing and call-graph telemetry.
          </p>
        </div>

        {/* Telemetry KPI Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#182028] border border-[#222b33] px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="font-label-sm text-[#8b919f] uppercase">Parsed Nodes</span>
            <span className="font-code-md font-semibold text-[#dae3ee]">148</span>
          </div>
          <div className="bg-[#182028] border border-[#222b33] px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="font-label-sm text-[#8b919f] uppercase">Active Edges</span>
            <span className="font-code-md font-semibold text-[#418fff]">312</span>
          </div>
          <div className="bg-[#93000a]/25 border border-[#93000a]/50 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-ping"></span>
            <span className="font-label-sm text-[#ffb4ab] font-semibold">1 Hotspot Exception</span>
          </div>
        </div>
      </div>

      {/* Interactive Graph Control Toolbar */}
      <div className="bg-[#141c24] border border-[#182028] p-2 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center flex-wrap gap-2">
          {/* Search Input */}
          <div className="relative flex items-center min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 text-[#8b919f] text-[18px]">search</span>
            <input
              className="w-full bg-[#060f16] border border-[#222b33] text-[#dae3ee] font-code-sm pl-9 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-[#418fff]"
              placeholder="Search symbol or file (e.g. coupon, process_order)..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#8b919f] hover:text-[#dae3ee]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Node Type Toggles */}
          <div className="flex items-center gap-1 bg-[#060f16] p-1 rounded-lg border border-[#222b33]">
            <span className="px-2.5 py-1 rounded text-[#418fff] bg-[#222b33] font-code-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check</span> Modules
            </span>
            <span className="px-2.5 py-1 rounded text-[#418fff] bg-[#222b33] font-code-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check</span> Functions
            </span>
            <span className="px-2.5 py-1 rounded text-[#418fff] bg-[#222b33] font-code-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check</span> API Routes
            </span>
            <span className="px-2.5 py-1 rounded text-[#418fff] bg-[#222b33] font-code-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check</span> Tests
            </span>
          </div>

          {/* Edge Category Tabs */}
          <div className="flex items-center bg-[#060f16] p-1 rounded-lg border border-[#222b33]">
            <button
              onClick={() => setEdgeFilter('all')}
              className={`px-2.5 py-1 rounded font-code-sm ${
                edgeFilter === 'all'
                  ? 'bg-[#418fff] text-[#002959] font-medium'
                  : 'text-[#c1c6d6] hover:text-[#dae3ee]'
              }`}
            >
              All Edges
            </button>
            <button
              onClick={() => setEdgeFilter('calls')}
              className={`px-2.5 py-1 rounded font-code-sm ${
                edgeFilter === 'calls'
                  ? 'bg-[#418fff] text-[#002959] font-medium'
                  : 'text-[#c1c6d6] hover:text-[#dae3ee]'
              }`}
            >
              CALLS only
            </button>
            <button
              onClick={() => setEdgeFilter('imports')}
              className={`px-2.5 py-1 rounded font-code-sm ${
                edgeFilter === 'imports'
                  ? 'bg-[#418fff] text-[#002959] font-medium'
                  : 'text-[#c1c6d6] hover:text-[#dae3ee]'
              }`}
            >
              IMPORTS only
            </button>
            <button
              onClick={() => setEdgeFilter('tests')}
              className={`px-2.5 py-1 rounded font-code-sm ${
                edgeFilter === 'tests'
                  ? 'bg-[#418fff] text-[#002959] font-medium'
                  : 'text-[#c1c6d6] hover:text-[#dae3ee]'
              }`}
            >
              TESTS only
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#060f16] rounded-lg p-0.5 border border-[#222b33]">
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 hover:bg-[#222b33] text-[#c1c6d6] hover:text-[#dae3ee] rounded"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
            <span className="font-code-sm text-[#8b919f] px-2">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 hover:bg-[#222b33] text-[#c1c6d6] hover:text-[#dae3ee] rounded"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
          </div>
          <button
            onClick={() => setZoomLevel(100)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#060f16] border border-[#222b33] hover:bg-[#222b33] text-[#c1c6d6] rounded-lg font-code-sm"
          >
            <span className="material-symbols-outlined text-[16px]">crop_free</span>
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Workbench Tri-Pane Area: Center Canvas + Inspector Drawer */}
      <div className="flex flex-col lg:flex-row gap-4 w-full items-start">
        {/* Schematic Canvas Container */}
        <div className="flex-1 w-full bg-[#060f16] border border-[#182028] rounded-xl overflow-hidden shadow-lg relative min-h-[720px] select-none">
          {/* Sub-grid Background Layer */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="archGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#222b33" strokeWidth="0.5" />
                  <circle cx="32" cy="0" r="1" fill="#414753" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#archGrid)" />
            </svg>
          </div>

          {/* Graph Legend Overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-[#141c24]/90 backdrop-blur-md p-3 rounded-lg border border-[#222b33] shadow-md pointer-events-auto">
            <div className="flex items-center justify-between pb-1 border-b border-[#182028]">
              <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Legend</span>
              <span className="font-code-sm text-[#418fff]">v1.4 Live Call-Graph</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-code-sm">
              <div className="flex items-center gap-1.5 text-[#c1c6d6]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#418fff]"></span>
                <span>API Route</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#c1c6d6]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#222b33]"></span>
                <span>Function</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#c1c6d6]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#182028]"></span>
                <span>Module File</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#c1c6d6]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#d5bbff]"></span>
                <span>Pytest Spec</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#ffb4ab] col-span-2 pt-1 border-t border-[#182028]">
                <span className="w-3 h-0.5 bg-[#ffb4ab]"></span>
                <span className="font-medium text-[10px]">Failure Hotspot Trace (HTTP 500)</span>
              </div>
            </div>
          </div>

          {/* Minimap Overlay Bottom-Left */}
          <div className="absolute bottom-4 left-4 z-20 w-36 h-28 bg-[#141c24]/95 border border-[#222b33] rounded-lg p-2 shadow-md hidden sm:flex flex-col justify-between">
            <span className="font-label-sm uppercase text-[#8b919f]">Cluster Minimap</span>
            <div className="relative w-full h-20 bg-[#060f16] rounded overflow-hidden border border-[#182028]">
              <div className="absolute top-2 left-3 w-4 h-2 bg-[#418fff]/40 rounded-xs"></div>
              <div className="absolute top-5 left-8 w-5 h-3 bg-[#2d363e] rounded-xs"></div>
              <div className="absolute top-8 left-16 w-6 h-3 bg-[#418fff] rounded-xs ring-1 ring-[#418fff]"></div>
              <div className="absolute top-12 left-24 w-4 h-3 bg-[#d5bbff]/50 rounded-xs"></div>
              <div className="absolute top-1 left-2 w-24 h-16 border border-[#418fff]/50 rounded"></div>
            </div>
          </div>

          {/* Main SVG Directed Edges Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 980 720" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrow-calls" markerWidth="6" markerHeight="6" refX="8" refY="5" viewBox="0 0 10 10" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#418fff" />
              </marker>
              <marker id="arrow-imports" markerWidth="6" markerHeight="6" refX="8" refY="5" viewBox="0 0 10 10" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#8b919f" />
              </marker>
              <marker id="arrow-failure" markerWidth="7" markerHeight="7" refX="8" refY="5" viewBox="0 0 10 10" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#ffb4ab" />
              </marker>
              <marker id="arrow-tests" markerWidth="6" markerHeight="6" refX="8" refY="5" viewBox="0 0 10 10" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#d5bbff" />
              </marker>
            </defs>

            {/* Edge 1: POST /checkout -> checkout.process_order [CALLS] */}
            <path d="M 230 180 C 290 180, 270 270, 330 270" fill="none" stroke="#418fff" strokeWidth="2" markerEnd="url(#arrow-calls)" />
            <rect x="250" y="210" width="52" height="16" rx="4" fill="#182028" stroke="#222b33" />
            <text x="276" y="222" fill="#418fff" textAnchor="middle" className="text-[10px] font-mono">CALLS</text>

            {/* Edge 2: checkout.process_order -> coupon.apply_discount [FAILURE HOTSPOT] */}
            <path d="M 480 270 C 530 270, 520 380, 570 380" fill="none" stroke="#ffb4ab" strokeWidth="6" strokeOpacity="0.25" />
            <path d="M 480 270 C 530 270, 520 380, 570 380" fill="none" stroke="#ffb4ab" strokeWidth="2.5" strokeDasharray="5 3" markerEnd="url(#arrow-failure)" className="animate-pulse" />
            <g transform="translate(480, 316)">
              <rect width="118" height="20" rx="4" fill="#93000a" stroke="#ffb4ab" />
              <text x="59" y="14" fill="#ffdad6" textAnchor="middle" className="text-[10px] font-mono font-bold tracking-wider">FAILURE HOTSPOT</text>
            </g>

            {/* Edge 3: checkout.process_order -> payment.charge [CALLS] */}
            <path d="M 480 270 C 530 270, 530 160, 590 160" fill="none" stroke="#418fff" strokeWidth="1.75" markerEnd="url(#arrow-calls)" />
            <rect x="510" y="195" width="52" height="16" rx="4" fill="#182028" stroke="#222b33" />
            <text x="536" y="207" fill="#418fff" textAnchor="middle" className="text-[10px] font-mono">CALLS</text>

            {/* Edge 4: coupon.apply_discount -> models.Coupon [IMPORTS] */}
            <path d="M 730 400 C 790 400, 780 510, 820 510" fill="none" stroke="#8b919f" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrow-imports)" />
            <rect x="744" y="445" width="60" height="16" rx="4" fill="#182028" stroke="#222b33" />
            <text x="774" y="457" fill="#8b919f" textAnchor="middle" className="text-[10px] font-mono">IMPORTS</text>

            {/* Edge 5: test_coupon.py -> coupon.apply_discount [TESTS (Amber / Dashed)] */}
            <path d="M 330 520 C 440 520, 480 420, 570 410" fill="none" stroke="#d5bbff" strokeWidth="1.75" strokeDasharray="4 3" markerEnd="url(#arrow-tests)" />
            <g transform="translate(400, 482)">
              <rect width="132" height="18" rx="4" fill="#222b33" stroke="#2d363e" />
              <text x="66" y="13" fill="#d5bbff" textAnchor="middle" className="text-[10px] font-mono font-medium">TESTS (INCOMPLETE)</text>
            </g>

            {/* Edge 6: checkout.process_order -> database.save_order [CALLS] */}
            <path d="M 410 305 C 410 380, 410 400, 410 420" fill="none" stroke="#418fff" strokeWidth="1.5" markerEnd="url(#arrow-calls)" />
          </svg>

          {/* Interactive Nodes Layer */}
          <div className="relative w-[980px] h-[720px] pointer-events-auto">
            {/* Node 1: API Route Container */}
            <div className="absolute top-16 left-10 p-3 rounded-xl bg-[#141c24]/80 border border-[#222b33] shadow-md flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[#8b919f] font-code-sm">
                <span className="material-symbols-outlined text-[16px]">folder</span>
                <span className="font-medium text-[#c1c6d6]">api/routes.py</span>
              </div>
              <div 
                onClick={() => setSelectedNode('api.checkout.apply_coupon_route')}
                className="flex items-center gap-2.5 bg-[#418fff]/15 hover:bg-[#418fff]/25 px-3 py-2 rounded-lg cursor-pointer transition-all border border-[#418fff]/30 shadow-sm"
              >
                <div className="w-6 h-6 rounded bg-[#418fff] flex items-center justify-center text-[#002959] font-code-sm font-bold text-[10px]">
                  POST
                </div>
                <div className="flex flex-col">
                  <span className="font-code-md text-[#418fff] font-semibold">/checkout/apply-coupon</span>
                  <span className="font-label-sm text-[#8b919f]">HTTP 200/500 Entrypoint</span>
                </div>
              </div>
            </div>

            {/* Node 2: checkout.process_order */}
            <div 
              onClick={() => setSelectedNode('checkout.process_order')}
              className="absolute top-56 left-80 w-52 bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] p-3.5 rounded-xl shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Function</span>
                <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
              </div>
              <div className="font-code-md text-[#dae3ee] font-semibold truncate">
                checkout.process_order
              </div>
              <div className="font-code-sm text-[#8b919f] mt-1 truncate">services/checkout.py:42</div>
              <div className="mt-2 pt-1 border-t border-[#182028] flex items-center justify-between text-[#8b919f] text-[11px] font-mono">
                <span>Calls: 3</span>
                <span>CC: 6</span>
              </div>
            </div>

            {/* Node 3: payment.charge */}
            <div 
              onClick={() => setSelectedNode('payment.charge')}
              className="absolute top-32 left-[580px] w-48 bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] p-3.5 rounded-xl shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Function</span>
                <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
              </div>
              <div className="font-code-md text-[#dae3ee] font-semibold truncate">
                payment.charge
              </div>
              <div className="font-code-sm text-[#8b919f] mt-1 truncate">services/payment.py:12</div>
            </div>

            {/* Node 4: database.save_order */}
            <div 
              onClick={() => setSelectedNode('database.save_order')}
              className="absolute top-[430px] left-80 w-48 bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] p-3.5 rounded-xl shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Function</span>
                <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
              </div>
              <div className="font-code-md text-[#dae3ee] font-semibold truncate">
                database.save_order
              </div>
              <div className="font-code-sm text-[#8b919f] mt-1 truncate">db/repository.py:88</div>
            </div>

            {/* Node 5: SELECTED TARGET - coupon.apply_discount (The Hotspot) */}
            <div className="absolute top-72 left-[550px] p-4 rounded-xl bg-[#141c24]/90 border border-[#93000a]/50 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[#8b919f] font-code-sm">
                  <span className="material-symbols-outlined text-[16px]">folder</span>
                  <span className="font-medium text-[#c1c6d6]">services/coupon.py</span>
                </div>
                <span className="font-label-sm text-[#ffb4ab] font-semibold bg-[#93000a] px-1.5 py-0.5 rounded">
                  HOTSPOT
                </span>
              </div>

              <div 
                onClick={() => setSelectedNode('coupon.apply_discount')}
                className="relative w-64 bg-[#2d363e] p-4 rounded-xl shadow-2xl cursor-pointer transition-all transform scale-[1.03] ring-2 ring-[#418fff] ring-offset-2 ring-offset-[#060f16]"
              >
                <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#418fff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#418fff] text-[9px] text-[#002959] font-bold items-center justify-center">
                    ✓
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-label-sm uppercase tracking-wider text-[#418fff] font-bold">Selected Target</span>
                  <span className="font-code-sm text-[#ffb4ab] bg-[#93000a] px-1.5 rounded font-mono font-semibold">
                    500 Hotspot
                  </span>
                </div>
                <div className="font-code-lg text-[#dae3ee] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#418fff] text-[18px]">functions</span>
                  <span className="text-[#418fff] truncate">coupon.apply_discount</span>
                </div>
                <div className="font-code-sm text-[#8b919f] mt-1">services/coupon.py:18-36</div>
                <div className="mt-2.5 pt-1.5 border-t border-[#222b33] flex items-center justify-between text-[#c1c6d6] font-code-sm bg-[#060f16]/60 px-2 py-1 rounded">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                    <span>Failing (FL-104)</span>
                  </span>
                  <span className="text-[#8b919f]">CC: 4</span>
                </div>
              </div>
            </div>

            {/* Node 6: Data Model - models.Coupon */}
            <div 
              onClick={() => setSelectedNode('models.Coupon')}
              className="absolute top-[490px] left-[810px] w-44 bg-[#182028] border border-[#222b33] p-3.5 rounded-xl shadow-md cursor-pointer hover:bg-[#222b33] transition-colors"
            >
              <div className="flex items-center gap-1 text-[#8b919f] font-label-sm uppercase mb-1">
                <span className="material-symbols-outlined text-[14px]">data_object</span>
                <span>Data Model</span>
              </div>
              <div className="font-code-md text-[#dae3ee] font-semibold truncate">models.Coupon</div>
              <div className="font-code-sm text-[#8b919f] mt-1 truncate">models.py:112</div>
            </div>

            {/* Node 7: Test Node - tests/test_coupon.py */}
            <div 
              onClick={() => setSelectedNode('tests/test_coupon.py')}
              className="absolute top-[490px] left-16 w-72 bg-[#222b33]/90 hover:bg-[#2d363e] border border-[#2d363e] p-3.5 rounded-xl shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm uppercase tracking-wider text-[#d5bbff] font-semibold">Pytest Spec</span>
                <span className="w-2 h-2 rounded-full bg-[#d5bbff]"></span>
              </div>
              <div className="font-code-md text-[#d5bbff] font-semibold truncate">tests/test_coupon.py</div>
              <div className="font-code-sm text-[#8b919f] mt-1 truncate">::test_percentage_discount</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-label-sm bg-[#93000a] text-[#ffdad6] px-1.5 py-0.5 rounded font-mono">1 Failed</span>
                <span className="font-label-sm bg-[#27a640]/30 text-[#67df70] px-1.5 py-0.5 rounded font-mono">2 Passed</span>
              </div>
            </div>
          </div>

          {/* Quick Canvas Status Float Bar */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 bg-[#141c24]/90 backdrop-blur-md border border-[#222b33] px-3.5 py-1.5 rounded-lg shadow-md font-code-sm text-[#8b919f]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
              <span>Deterministic Trace Synced</span>
            </div>
            <span>|</span>
            <span>Resolution: 980x720</span>
          </div>
        </div>

        {/* Right-Side Inspector Drawer: Component Details */}
        <div className="w-full lg:w-[420px] bg-[#141c24] border border-[#182028] rounded-xl flex flex-col shadow-xl overflow-hidden shrink-0">
          <div className="p-3.5 bg-[#182028] border-b border-[#222b33] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#418fff] text-[20px]">view_in_ar</span>
              <span className="font-code-md font-semibold text-[#dae3ee]">Component Inspector</span>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5 max-h-[780px] overflow-y-auto">
            {/* Header Identification */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-sm bg-[#418fff]/15 text-[#418fff] border border-[#418fff]/30 px-2 py-0.5 rounded font-mono font-semibold">
                  Python Function (AST Verified)
                </span>
                <span className="font-label-sm bg-[#222b33] text-[#8b919f] border border-[#2d363e] px-2 py-0.5 rounded font-mono">
                  Symbol ID: fn_84f9
                </span>
              </div>
              <h2 className="font-headline-md text-[#dae3ee] font-semibold tracking-tight mt-1 flex items-center gap-2">
                <span>coupon.apply_discount</span>
              </h2>
              <div className="flex items-center gap-2 text-[#c1c6d6] font-code-sm">
                <span className="material-symbols-outlined text-[16px] text-[#8b919f]">description</span>
                <span className="hover:text-[#418fff] cursor-pointer underline decoration-dotted">
                  services/coupon.py:18-36
                </span>
                <span className="text-[#8b919f]">(Lines 18–36)</span>
              </div>
            </div>

            {/* Failure Warning Banner */}
            <div className="bg-[#93000a]/25 border border-[#93000a]/50 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] shrink-0 mt-0.5">warning</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-code-sm font-semibold text-[#ffb4ab]">Failure Link Detected</span>
                <p className="font-body-sm text-[#ffdad6]">
                  Associated with <strong>Failure #FL-104</strong>: HTTP 500 Negative Order Total during coupon deduction execution.
                </p>
              </div>
            </div>

            {/* Metric Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#182028] border border-[#222b33] p-3.5 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Cyclomatic Complexity</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-sm font-semibold text-[#dae3ee]">4</span>
                  <span className="font-code-sm text-[#67df70] font-medium">Low Risk</span>
                </div>
              </div>
              <div className="bg-[#182028] border border-[#222b33] p-3.5 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Effective Lines</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-sm font-semibold text-[#dae3ee]">18</span>
                  <span className="font-code-sm text-[#8b919f]">SLOC</span>
                </div>
              </div>
            </div>

            {/* Direct Dependencies */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f] font-semibold">
                  Direct Dependencies (Outgoing)
                </span>
                <span className="font-code-sm text-[#8b919f]">2 targets</span>
              </div>
              <div className="flex flex-col gap-1 bg-[#182028] border border-[#222b33] p-2 rounded-lg">
                <div className="flex items-center justify-between p-1.5 hover:bg-[#222b33] rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[#8b919f] text-[16px]">call_made</span>
                    <span className="font-code-sm text-[#dae3ee] truncate">models.order.get_total</span>
                  </div>
                  <span className="font-label-sm text-[#8b919f]">INTERNAL</span>
                </div>
                <div className="flex items-center justify-between p-1.5 hover:bg-[#222b33] rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[#8b919f] text-[16px]">call_made</span>
                    <span className="font-code-sm text-[#dae3ee] truncate">math.floor</span>
                  </div>
                  <span className="font-label-sm text-[#8b919f]">STDLIB</span>
                </div>
              </div>
            </div>

            {/* Used By (Callers) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f] font-semibold">
                  Used By (Incoming Callers)
                </span>
                <span className="font-code-sm text-[#8b919f]">2 callers</span>
              </div>
              <div className="flex flex-col gap-1 bg-[#182028] border border-[#222b33] p-2 rounded-lg">
                <div className="flex items-center justify-between p-1.5 hover:bg-[#222b33] rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[#418fff] text-[16px]">call_received</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-code-sm text-[#dae3ee] font-medium truncate">checkout.process_order</span>
                      <span className="font-code-sm text-[#8b919f]">checkout.py:42</span>
                    </div>
                  </div>
                  <span className="font-label-sm bg-[#418fff]/15 text-[#418fff] px-1.5 py-0.5 rounded border border-[#418fff]/30">
                    EXEC HOT
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 hover:bg-[#222b33] rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[#418fff] text-[16px]">call_received</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-code-sm text-[#dae3ee] font-medium truncate">api.checkout.apply_coupon_route</span>
                      <span className="font-code-sm text-[#8b919f]">api/routes.py:108</span>
                    </div>
                  </div>
                  <span className="font-label-sm bg-[#222b33] text-[#8b919f] px-1.5 py-0.5 rounded border border-[#2d363e]">
                    HANDLER
                  </span>
                </div>
              </div>
            </div>

            {/* Test Coverage Status */}
            <div className="flex flex-col gap-2 bg-[#182028] border border-[#222b33] p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f] font-semibold">
                  Test Coverage Status
                </span>
                <span className="font-code-sm text-[#d5bbff] font-medium">50% Line Hit</span>
              </div>
              <div className="w-full bg-[#060f16] h-2 rounded-full overflow-hidden flex my-1 border border-[#222b33]">
                <div className="bg-[#67df70] w-1/2 h-full"></div>
                <div className="bg-[#ffb4ab] w-1/2 h-full"></div>
              </div>
              <div className="flex items-center justify-between text-code-sm mt-0.5">
                <span className="text-[#67df70] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#67df70]"></span>
                  1 Test Passing
                </span>
                <span className="text-[#ffb4ab] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                  1 Test Failing
                </span>
              </div>
              <div className="mt-1 p-2 bg-[#060f16] border border-[#222b33] rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-[#d5bbff] text-[16px] shrink-0 mt-0.5">lightbulb</span>
                <span className="font-body-sm text-[#d5bbff]">
                  Coverage gap detected: No test assertion exists for edge condition <code className="font-code-sm bg-[#222b33] px-1 rounded text-[#dae3ee]">discount_percent &gt;= 100</code>.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => onNavigate('investigation')}
                className="w-full bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] py-2.5 px-4 rounded-lg font-code-md font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">bug_report</span>
                <span>Investigate Failure in `apply_discount`</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('failures')}
                  className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] py-2 px-3 rounded-lg font-code-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">bug_report</span>
                  <span>View Failure FL-104</span>
                </button>
                <button
                  onClick={() => onNavigate('test-lab')}
                  className="bg-[#182028] hover:bg-[#222b33] border border-[#222b33] text-[#c1c6d6] hover:text-[#dae3ee] py-2 px-3 rounded-lg font-code-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">science</span>
                  <span>Open Test Lab</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
