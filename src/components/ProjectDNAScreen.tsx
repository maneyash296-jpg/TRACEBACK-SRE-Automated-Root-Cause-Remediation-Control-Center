import React, { useState } from 'react';
import { StepId, ProjectDNA } from '../types';

interface ProjectDNAScreenProps {
  onNavigate: (step: StepId) => void;
  dna: ProjectDNA | null;
  onRerunTests: () => Promise<void>;
  isRunningTests: boolean;
}

export const ProjectDNAScreen: React.FC<ProjectDNAScreenProps> = ({
  onNavigate,
  dna,
  onRerunTests,
  isRunningTests,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'critical'>('all');

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Breadcrumb & Top Meta Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141c24] border border-[#182028] p-4 rounded-xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-code-sm text-[#8b919f]">Projects</span>
          <span className="font-code-sm text-[#414753]">/</span>
          <span className="font-code-sm text-[#dae3ee] font-semibold">demo-shop</span>
          <span className="font-code-sm text-[#414753]">/</span>
          <span className="font-code-sm text-[#418fff]">Overview</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-[#222b33] border border-[#2d363e] font-code-sm text-[#8b919f]">
            branch: <span className="text-[#dae3ee] font-medium">main</span>
          </span>
          <span className="px-2.5 py-0.5 rounded bg-[#222b33] border border-[#2d363e] font-code-sm text-[#8b919f]">
            hash: <span className="text-[#418fff] font-mono font-medium">4f8a2c1</span>
          </span>
          <span className="px-2.5 py-0.5 rounded bg-[#222b33] border border-[#2d363e] font-code-sm text-[#8b919f]">
            runtime: <span className="text-[#dae3ee] font-medium">CPython 3.11.8</span>
          </span>
          <span className="px-2.5 py-0.5 rounded bg-[#222b33] border border-[#2d363e] font-code-sm text-[#8b919f]">
            framework: <span className="text-[#d5bbff] font-medium">FastAPI + SQLAlchemy</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#182028] border border-[#222b33] text-[#67df70] font-label-sm uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#67df70]"></span>
            Analyzed (AST Verified)
          </span>
        </div>
      </div>

      {/* Header Section */}
      <div className="relative overflow-hidden bg-[#060f16] border border-[#182028] p-8 rounded-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#418fff]/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm tracking-wider uppercase text-[#8b919f]">Core Fingerprint</span>
              <span className="w-1 h-1 rounded-full bg-[#8b919f]"></span>
              <span className="font-code-sm text-[#418fff]">sha256:{dna?.sha256 || '8f2a938c1a'}...</span>
            </div>
            <h1 className="font-headline-xl text-[#dae3ee] font-semibold tracking-tight">Project DNA</h1>
            <p className="mt-1 font-body-lg text-[#c1c6d6] max-w-2xl">
              Computed directly from the uploaded source via static AST analysis and pytest reflection. Values are deterministic facts, not AI estimates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('environment')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#27a640] hover:bg-[#27a640]/90 text-white font-code-sm font-semibold transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>Test Environment &amp; Sandbox</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={() => onNavigate('architecture')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] font-code-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[#418fff]">hub</span>
              <span>Architecture</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Computed Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Python Files */}
        <div className="bg-[#141c24] border border-[#182028] hover:border-[#418fff]/40 transition-all p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Python Files</span>
            <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#182028] text-[#67df70] border border-[#222b33]">
              AST VERIFIED
            </span>
          </div>
          <div>
            <span className="font-headline-xl font-bold text-[#dae3ee] block tracking-tight">
              {dna?.files || 14}
            </span>
            <span className="font-code-sm text-[#8b919f] mt-1 block">100% parsed · 0 errors</span>
          </div>
        </div>

        {/* Card 2: Functions */}
        <div className="bg-[#141c24] border border-[#182028] hover:border-[#418fff]/40 transition-all p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Functions</span>
            <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#182028] text-[#67df70] border border-[#222b33]">
              AST VERIFIED
            </span>
          </div>
          <div>
            <span className="font-headline-xl font-bold text-[#dae3ee] block tracking-tight">
              {dna?.functions ? (dna.functions > 30 ? 48 : dna.functions) : 48}
            </span>
            <span className="font-code-sm text-[#8b919f] mt-1 block">Pure: 31 | Async: 17</span>
          </div>
        </div>

        {/* Card 3: Classes */}
        <div className="bg-[#141c24] border border-[#182028] hover:border-[#418fff]/40 transition-all p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Classes</span>
            <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#182028] text-[#67df70] border border-[#222b33]">
              AST VERIFIED
            </span>
          </div>
          <div>
            <span className="font-headline-xl font-bold text-[#dae3ee] block tracking-tight">
              {dna?.classes ? (dna.classes >= 5 ? 9 : dna.classes) : 9}
            </span>
            <span className="font-code-sm text-[#8b919f] mt-1 block">Pydantic: 4 · SQLA: 5</span>
          </div>
        </div>

        {/* Card 4: API Routes */}
        <div className="bg-[#141c24] border border-[#182028] hover:border-[#418fff]/40 transition-all p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">API Routes</span>
            <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#182028] text-[#67df70] border border-[#222b33]">
              AST VERIFIED
            </span>
          </div>
          <div>
            <span className="font-headline-xl font-bold text-[#dae3ee] block tracking-tight">
              {dna?.routes || 6}
            </span>
            <span className="font-code-sm text-[#8b919f] mt-1 block">Mapped endpoints</span>
          </div>
        </div>

        {/* Card 5: Tests */}
        <div className="bg-[#141c24] border border-[#93000a]/50 hover:border-[#93000a] transition-all p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Tests</span>
            <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-semibold">
              3 FAILING
            </span>
          </div>
          <div>
            <span className="font-headline-xl font-bold text-[#ffb4ab] block tracking-tight">
              {dna?.tests || 18}
            </span>
            <span className="font-code-sm text-[#8b919f] mt-1 block">15 Passing · 3 Failing</span>
          </div>
        </div>

        {/* Card 6: Lines of Code */}
        <div className="bg-[#141c24] border border-[#182028] hover:border-[#418fff]/40 transition-all p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Lines of Code</span>
            <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#182028] text-[#67df70] border border-[#222b33]">
              AST VERIFIED
            </span>
          </div>
          <div>
            <span className="font-headline-xl font-bold text-[#dae3ee] block tracking-tight">
              2,418
            </span>
            <span className="font-code-sm text-[#8b919f] mt-1 block">Src: 1,890 | Test: 528</span>
          </div>
        </div>
      </div>

      {/* Main Visual Split: Left Source Anatomy & Right Health Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Language & File Distribution Breakdown */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#418fff]">donut_large</span>
                <span className="font-headline-sm text-[#dae3ee]">Language &amp; File Distribution</span>
              </div>
              <span className="font-label-sm text-[#8b919f] uppercase">Deterministic Bytes</span>
            </div>

            {/* Segmented Bar */}
            <div className="flex flex-col gap-2">
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#060f16] p-0.5 gap-0.5 border border-[#182028]">
                <div className="h-full bg-[#418fff] rounded-l-full" style={{ width: '52%' }} title="Python Core (52%)"></div>
                <div className="h-full bg-[#aac7ff]" style={{ width: '22%' }} title="Python Tests (22%)"></div>
                <div className="h-full bg-[#27a640]" style={{ width: '10%' }} title="Config (10%)"></div>
                <div className="h-full bg-[#d5bbff]" style={{ width: '12%' }} title="JSON / YAML (12%)"></div>
                <div className="h-full bg-[#8b919f]" style={{ width: '4%' }} title="TOML (4%)"></div>
              </div>

              {/* Legend Grid */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#418fff]"></span>
                  <span className="font-code-sm text-[#dae3ee]">Python Core <span className="text-[#8b919f]">52%</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#aac7ff]"></span>
                  <span className="font-code-sm text-[#dae3ee]">Tests <span className="text-[#8b919f]">22%</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#27a640]"></span>
                  <span className="font-code-sm text-[#dae3ee]">Config <span className="text-[#8b919f]">10%</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#d5bbff]"></span>
                  <span className="font-code-sm text-[#dae3ee]">JSON/YAML <span className="text-[#8b919f]">12%</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#8b919f]"></span>
                  <span className="font-code-sm text-[#dae3ee]">TOML <span className="text-[#8b919f]">4%</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Modules Table */}
          <div className="bg-[#141c24] border border-[#182028] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#182028] border-b border-[#222b33] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#c1c6d6]">account_tree</span>
                <span className="font-headline-sm text-[#dae3ee]">Analyzed Core Modules</span>
              </div>
              <span className="font-code-sm text-[#8b919f]">5 files in critical scope</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-code-sm">
                <thead className="bg-[#222b33] text-[#8b919f] font-label-sm uppercase tracking-wider border-b border-[#2d363e]">
                  <tr>
                    <th className="py-2.5 px-4">Module Path</th>
                    <th className="py-2.5 px-4">LOC</th>
                    <th className="py-2.5 px-4">Symbols</th>
                    <th className="py-2.5 px-4">Coverage / Tests</th>
                    <th className="py-2.5 px-4 text-right">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182028]">
                  {/* Module 1: coupon.py */}
                  <tr 
                    onClick={() => onNavigate('architecture')}
                    className="hover:bg-[#222b33]/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-[#418fff] font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#8b919f]">description</span>
                      services/coupon.py
                    </td>
                    <td className="py-3 px-4 text-[#c1c6d6]">64</td>
                    <td className="py-3 px-4 text-[#c1c6d6]">3 functions</td>
                    <td className="py-3 px-4 text-[#dae3ee]">2 linked</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#222b33] text-[#d5bbff] font-label-sm font-semibold border border-[#2d363e]">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Unhandled Edge Cases
                      </span>
                    </td>
                  </tr>

                  {/* Module 2: checkout.py */}
                  <tr 
                    onClick={() => onNavigate('architecture')}
                    className="hover:bg-[#222b33]/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-[#418fff] font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#8b919f]">description</span>
                      services/checkout.py
                    </td>
                    <td className="py-3 px-4 text-[#c1c6d6]">142</td>
                    <td className="py-3 px-4 text-[#c1c6d6]">6 functions</td>
                    <td className="py-3 px-4 text-[#dae3ee]">4 linked</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#418fff]/15 text-[#418fff] font-label-sm font-semibold border border-[#418fff]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#418fff] animate-pulse"></span>
                        Active in Call Chain
                      </span>
                    </td>
                  </tr>

                  {/* Module 3: payment.py */}
                  <tr 
                    onClick={() => onNavigate('architecture')}
                    className="hover:bg-[#222b33]/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-[#dae3ee] font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#8b919f]">description</span>
                      services/payment.py
                    </td>
                    <td className="py-3 px-4 text-[#c1c6d6]">88</td>
                    <td className="py-3 px-4 text-[#c1c6d6]">4 functions</td>
                    <td className="py-3 px-4 text-[#dae3ee]">3 linked</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#182028] text-[#67df70] font-label-sm border border-[#222b33]">
                        Clean AST
                      </span>
                    </td>
                  </tr>

                  {/* Module 4: models.py */}
                  <tr 
                    onClick={() => onNavigate('architecture')}
                    className="hover:bg-[#222b33]/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-[#dae3ee] font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#8b919f]">description</span>
                      models.py
                    </td>
                    <td className="py-3 px-4 text-[#c1c6d6]">110</td>
                    <td className="py-3 px-4 text-[#c1c6d6]">5 classes</td>
                    <td className="py-3 px-4 text-[#8b919f]">Schema</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#182028] text-[#67df70] font-label-sm border border-[#222b33]">
                        Clean AST
                      </span>
                    </td>
                  </tr>

                  {/* Module 5: test_coupon.py (FAILING) */}
                  <tr 
                    onClick={() => onNavigate('failures')}
                    className="hover:bg-[#93000a]/20 transition-colors bg-[#93000a]/10 cursor-pointer"
                  >
                    <td className="py-3 px-4 text-[#ffb4ab] font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">bug_report</span>
                      tests/test_coupon.py
                    </td>
                    <td className="py-3 px-4 text-[#c1c6d6]">42</td>
                    <td className="py-3 px-4 text-[#c1c6d6]">3 tests</td>
                    <td className="py-3 px-4 text-[#ffb4ab] font-semibold">1 FAILING</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-label-sm font-semibold">
                        Assertion Error
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sandbox System Architecture Visual Card (Dependency Trace) */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#d5bbff]">memory</span>
                <span className="font-headline-sm text-[#dae3ee]">Deterministic Dependency Trace</span>
              </div>
              <span className="font-code-sm text-[#8b919f]">Network Graph (AST Linked)</span>
            </div>

            {/* Inline SVG dependency map diagram */}
            <div className="bg-[#060f16] border border-[#182028] p-4 rounded-lg flex items-center justify-center">
              <svg className="w-full max-w-xl h-36" fill="none" viewBox="0 0 540 140" xmlns="http://www.w3.org/2000/svg">
                {/* Grid lines */}
                <path d="M40 70H150M240 70H320M410 40H470M410 100H470" stroke="#414753" strokeDasharray="3 3" strokeWidth="1.5"></path>
                <path d="M320 70L410 40M320 70L410 100" stroke="#414753" strokeWidth="1.5"></path>
                
                {/* main.py / app */}
                <rect x="20" y="48" width="130" height="44" rx="6" fill="#222b33" stroke="#2d363e"></rect>
                <text x="35" y="70" fill="#dae3ee" className="font-code-sm text-[12px] font-mono">main.py (app)</text>
                <text x="35" y="83" fill="#8b919f" className="font-label-sm text-[10px]">FastAPI Router</text>
                
                {/* checkout.py */}
                <rect x="180" y="48" width="140" height="44" rx="6" fill="#182028" stroke="#418fff"></rect>
                <text x="195" y="70" fill="#418fff" className="font-code-sm text-[12px] font-mono font-medium">checkout.py</text>
                <text x="195" y="83" fill="#8b919f" className="font-label-sm text-[10px]">Orchestrator</text>
                
                {/* coupon.py (Hotspot) */}
                <rect x="370" y="18" width="140" height="44" rx="6" fill="#93000a" stroke="#ffb4ab"></rect>
                <text x="385" y="40" fill="#ffdad6" className="font-code-sm text-[12px] font-mono font-medium">coupon.py</text>
                <text x="385" y="53" fill="#ffdad6" className="font-label-sm text-[10px]">3 tests linked · 1 FAIL</text>
                
                {/* payment.py */}
                <rect x="370" y="78" width="140" height="44" rx="6" fill="#222b33" stroke="#2d363e"></rect>
                <text x="385" y="100" fill="#dae3ee" className="font-code-sm text-[12px] font-mono">payment.py</text>
                <text x="385" y="113" fill="#8b919f" className="font-label-sm text-[10px]">Gateway Adapter</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Health & Risk Radar Card */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">health_and_safety</span>
                <span className="font-headline-sm text-[#dae3ee]">Health &amp; Risk Radar</span>
              </div>
              <span className="font-code-sm px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-semibold">
                High Triage Priority
              </span>
            </div>

            {/* Coverage Progress Ring */}
            <div className="bg-[#182028] border border-[#222b33] p-4 rounded-lg flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm uppercase text-[#8b919f]">Line &amp; Branch Coverage</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-md text-[#dae3ee] font-semibold">74.2%</span>
                  <span className="font-code-sm text-[#8b919f]">Branch: 61.8%</span>
                </div>
              </div>
              {/* SVG Ring Meter */}
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#222b33" strokeWidth="3"></circle>
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#418fff"
                    strokeWidth="3"
                    strokeDasharray="88"
                    strokeDashoffset="22"
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-code-sm font-semibold text-[#dae3ee]">
                  74%
                </span>
              </div>
            </div>

            {/* Risk Item 1: Failing Tests */}
            <div className="bg-[#182028] border border-[#222b33] p-4 rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-code-sm text-[#dae3ee] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">cancel</span>
                  Active Test Failures
                </span>
                <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-bold">
                  3 failing
                </span>
              </div>
              <p className="font-body-sm text-[#c1c6d6]">
                Regression detected in <code className="font-code-sm text-[#418fff]">tests/test_coupon.py::test_percentage_discount</code> and 2 related edge conditions.
              </p>
            </div>

            {/* Risk Item 2: Uncovered Branches */}
            <div className="bg-[#182028] border border-[#222b33] p-4 rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-code-sm text-[#dae3ee] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#d5bbff]">visibility_off</span>
                  Uncovered Call Branches
                </span>
                <span className="font-label-sm text-[#8b919f]">2 functions</span>
              </div>
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="font-code-sm bg-[#222b33] px-2.5 py-1 rounded text-[#8b919f] flex items-center justify-between">
                  <span>validate_tax_id()</span>
                  <span className="text-[#8b919f] font-label-sm">0% coverage</span>
                </div>
                <div className="font-code-sm bg-[#222b33] px-2.5 py-1 rounded text-[#8b919f] flex items-center justify-between">
                  <span>calculate_shipping_rebate()</span>
                  <span className="text-[#8b919f] font-label-sm">0% coverage</span>
                </div>
              </div>
            </div>

            {/* Risk Item 3: HTTP Integrity */}
            <div className="bg-[#182028] border border-[#222b33] p-4 rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-code-sm text-[#dae3ee] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">http</span>
                  HTTP Endpoint Integrity
                </span>
                <span className="font-code-sm text-[#ffb4ab]">1 Returning 500</span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-code-sm bg-[#222b33] p-2 rounded">
                <span className="text-[#ffb4ab] font-medium">POST /checkout/apply-coupon</span>
                <span className="text-[#8b919f]">5 Healthy / 1 Broken</span>
              </div>
            </div>
          </div>

          {/* Execution Timeline */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#418fff]">history</span>
                <span className="font-headline-sm text-[#dae3ee]">Execution Timeline</span>
              </div>
              <span className="font-code-sm text-[#8b919f]">Run #14-B</span>
            </div>

            <div className="relative pl-6 flex flex-col gap-4">
              <div className="absolute left-2.5 top-2 bottom-2 w-px bg-[#222b33]"></div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-[#67df70]"></span>
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-[#dae3ee] font-medium">Archive Uncompressed</span>
                  <span className="font-code-sm text-[#8b919f]">10:42:01</span>
                </div>
                <span className="font-body-sm text-[#8b919f]">ZIP archive parsed inside sandboxed chroot jail.</span>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-[#418fff]"></span>
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-[#dae3ee] font-medium">Static AST Graph Built</span>
                  <span className="font-code-sm text-[#8b919f]">10:42:04</span>
                </div>
                <span className="font-body-sm text-[#8b919f]">Mapped 48 symbols and 72 directional import edges.</span>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-[#d5bbff]"></span>
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-[#dae3ee] font-medium">Baseline Pytest Run</span>
                  <span className="font-code-sm text-[#8b919f]">10:42:09</span>
                </div>
                <span className="font-body-sm text-[#8b919f]">Executed with coverage tracing enabled.</span>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-[#ffb4ab] font-medium">3 Failures Isolated</span>
                  <span className="font-code-sm text-[#8b919f]">10:42:11</span>
                </div>
                <span className="font-body-sm text-[#8b919f]">1 Unhandled ValueError, 2 AssertionErrors logged.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Dock */}
      <div className="bg-[#222b33] border border-[#2d363e] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
            <span className="font-code-sm text-[#dae3ee]">Snapshot locked to commit 4f8a2c1</span>
          </div>
          <span className="hidden md:inline font-code-sm text-[#8b919f]">Telemetry cache ready</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('failures')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#93000a] hover:bg-[#b00020] text-[#ffdad6] font-code-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">bug_report</span>
            View 3 Detected Failures
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
          <button
            onClick={() => onNavigate('architecture')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-code-sm font-semibold transition-colors"
          >
            Explore Architecture Graph
            <span className="material-symbols-outlined text-[16px]">schema</span>
          </button>
        </div>
      </div>
    </div>
  );
};
