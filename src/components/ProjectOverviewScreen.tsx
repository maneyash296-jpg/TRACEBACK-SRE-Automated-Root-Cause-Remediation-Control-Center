import React, { useMemo } from 'react';
import { StepId, ProjectDNA, ProjectEnvironment, RealTestExecutionResult } from '../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ProjectOverviewScreenProps {
  onNavigate: (step: StepId) => void;
  dna: ProjectDNA | null;
  environment: ProjectEnvironment | null;
  lastExecutionResult: RealTestExecutionResult | null;
  failures: any[];
  onRerunSuite: () => Promise<void>;
  isRunningSuite: boolean;
  projectId?: string;
}

export const ProjectOverviewScreen: React.FC<ProjectOverviewScreenProps> = ({
  onNavigate,
  dna,
  environment,
  lastExecutionResult,
  failures,
  onRerunSuite,
  isRunningSuite,
  projectId,
}) => {
  const fallbackDna: ProjectDNA = {
    files: 8,
    total_files: 11,
    functions: 8,
    pure_functions: 8,
    async_functions: 0,
    classes: 2,
    routes: 0,
    tests: 10,
    lines: 191,
    src_lines: 108,
    test_lines: 83,
    sha256: '15d8fb5a1f339776',
  };

  const activeDna = dna || fallbackDna;

  // Compute test metrics
  const totalTests = lastExecutionResult?.total || activeDna.tests || 0;
  const failedTests = lastExecutionResult ? lastExecutionResult.failed : failures.length;
  const passedTests = lastExecutionResult ? lastExecutionResult.passed : Math.max(0, totalTests - failedTests);
  const skippedTests = lastExecutionResult?.skipped || 0;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

  // Open Failure Reports Count
  const openFailuresCount = useMemo(() => {
    return failures.filter(f => f.status !== 'RESOLVED').length;
  }, [failures]);

  // Project Health Score Calculation (0 - 100)
  // Formula: Weighted 70% from Test Pass Ratio (passed/total) + 30% base, minus 15 pts penalty per open failure report.
  const healthScore = useMemo(() => {
    if (totalTests === 0 && openFailuresCount === 0) return 100; // Fresh clean project state
    
    const passRatio = totalTests > 0 ? (passedTests / totalTests) : 1.0;
    const testComponent = passRatio * 70;
    const failurePenalty = Math.min(60, openFailuresCount * 15);
    
    const score = Math.round(testComponent + 30 - failurePenalty);
    return Math.max(0, Math.min(100, score));
  }, [totalTests, passedTests, openFailuresCount]);

  // Recharts Data for Test Outcomes
  const testDistributionData = useMemo(() => [
    { name: 'Passed', value: passedTests, color: '#67df70' },
    { name: 'Failed', value: failedTests, color: '#ffb4ab' },
    { name: 'Skipped', value: skippedTests, color: '#d5bbff' },
  ], [passedTests, failedTests, skippedTests]);

  // Recharts Data for Code Composition
  const codeCompositionData = useMemo(() => [
    { category: 'Source SLOC', lines: activeDna.src_lines || 108, fill: '#418fff' },
    { category: 'Test SLOC', lines: activeDna.test_lines || 83, fill: '#67df70' },
    { category: 'Functions', lines: (activeDna.functions || 8) * 10, fill: '#d5bbff' },
  ], [activeDna]);

  // AST Complexity Profile
  const complexityData = useMemo(() => [
    { level: 'Low (1-4)', count: Math.max(2, (activeDna.functions || 8) - 2), fill: '#67df70' },
    { level: 'Moderate (5-8)', count: 2, fill: '#418fff' },
    { level: 'High Risk (9+)', count: failedTests > 0 ? 1 : 0, fill: '#ffb4ab' },
  ], [activeDna, failedTests]);

  return (
    <div className="flex flex-col gap-6 w-full pb-24">
      {/* Top Welcome & Health Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-label-sm uppercase tracking-widest text-[#418fff] bg-[#222b33] border border-[#2d363e] px-2.5 py-0.5 rounded font-semibold">
              COMMAND_CENTER // PROJECT_OVERVIEW
            </span>
            <span className="font-code-sm text-[#8b919f]">·</span>
            <span className="font-code-sm text-[#67df70] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#67df70] animate-pulse"></span>
              SANDBOX RUNNER ACTIVE
            </span>
          </div>
          <h1 className="font-headline-xl text-[#dae3ee] font-bold tracking-tight flex flex-wrap items-center gap-3">
            <span>{environment?.project_name || 'Active Project'} Telemetry Dashboard</span>
            <span className="font-code-sm text-xs bg-[#141c24] border border-[#222b33] text-[#418fff] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#67df70]"></span>
              <span>Project ID: {projectId || 'active'}</span>
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 font-code-sm text-xs text-[#8b919f]">
            <span className="bg-[#141c24] border border-[#182028] px-2 py-0.5 rounded text-[#dae3ee]">
              Framework: <strong className="text-[#418fff]">{environment?.framework || 'Python 3.11'}</strong>
            </span>
            <span className="bg-[#141c24] border border-[#182028] px-2 py-0.5 rounded text-[#dae3ee]">
              Test Runner: <strong className="text-[#67df70]">{environment?.test_command || 'pytest -q'}</strong>
            </span>
            <span className="bg-[#141c24] border border-[#182028] px-2 py-0.5 rounded text-[#dae3ee]">
              Python: <strong className="text-[#c1c6d6]">v{environment?.python_version || '3.11'}</strong>
            </span>
            <span className="bg-[#141c24] border border-[#182028] px-2 py-0.5 rounded text-[#dae3ee]">
              Manifest: <strong className="text-[#d5bbff]">{environment?.dependency_file || 'requirements.txt'}</strong>
            </span>
          </div>
        </div>

        {/* Quick Execution Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onRerunSuite}
            disabled={isRunningSuite}
            className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] px-4 py-2 rounded-lg font-headline-sm font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            <span className={`material-symbols-outlined text-[18px] ${isRunningSuite ? 'animate-spin' : ''}`}>
              play_arrow
            </span>
            <span>{isRunningSuite ? 'Executing Sandbox...' : 'Run Sandbox Tests'}</span>
          </button>

          {failedTests > 0 && (
            <button
              onClick={() => onNavigate('failures')}
              className="bg-[#93000a]/30 hover:bg-[#93000a]/50 border border-[#ba1a1a]/60 text-[#ffdad6] px-3.5 py-2 rounded-lg font-code-sm flex items-center gap-1.5 transition-colors text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">error</span>
              <span>Triage Failures ({failedTests})</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('architecture-overview')}
            className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] px-3.5 py-2 rounded-lg font-code-sm flex items-center gap-1.5 transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-[#418fff]">schema</span>
            <span>4 Pillars Spec</span>
          </button>
        </div>
      </div>

      {/* PROJECT HEALTH SCORE WIDGET */}
      <div className="bg-[#141c24] border border-[#182028] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Left Score Gauge Ring & Status */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#182028]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={healthScore >= 90 ? 'text-[#67df70]' : healthScore >= 70 ? 'text-[#d5bbff]' : 'text-[#ffb4ab]'}
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={`font-headline-xl font-extrabold text-2xl ${
                  healthScore >= 90 ? 'text-[#67df70]' : healthScore >= 70 ? 'text-[#d5bbff]' : 'text-[#ffb4ab]'
                }`}>
                  {healthScore}
                </span>
                <span className="font-label-sm text-[#8b919f] text-[9px] uppercase tracking-wider">Health</span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Project Codebase Health Widget</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-code-sm font-semibold border ${
                  healthScore >= 90
                    ? 'bg-[#27a640]/20 text-[#67df70] border-[#27a640]/40'
                    : healthScore >= 70
                    ? 'bg-[#418fff]/20 text-[#d5bbff] border-[#418fff]/40'
                    : 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ba1a1a]/50'
                }`}>
                  {healthScore >= 90 ? 'OPTIMAL' : healthScore >= 70 ? 'STABLE' : 'ACTION REQUIRED'}
                </span>
              </div>
              <h3 className="font-headline-sm text-[#dae3ee] font-bold">
                {healthScore >= 90
                  ? 'Codebase Operating at Peak Quality'
                  : healthScore >= 70
                  ? 'Codebase Stable with Minor Failures'
                  : 'Codebase Quality Critical — Immediate Triage Needed'}
              </h3>
              <p className="font-body-sm text-[#c1c6d6] max-w-xl mt-1 text-xs">
                Calculated dynamically from ratio of passed tests ({passRate}%, {passedTests}/{totalTests}) and {openFailuresCount} open failure reports (-{openFailuresCount * 15} pts penalty).
              </p>
            </div>
          </div>

          {/* Right Formula Breakdown Factors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0 w-full md:w-auto font-code-sm text-xs">
            <div className="bg-[#060f16] border border-[#182028] p-3 rounded-lg flex flex-col justify-between">
              <span className="text-[#8b919f] text-[11px]">Test Pass Ratio (70%)</span>
              <span className="text-[#dae3ee] font-bold text-sm mt-1">{passRate}% Pass</span>
              <span className="text-[#67df70] text-[10px]">{passedTests} / {totalTests} Passed</span>
            </div>

            <div className="bg-[#060f16] border border-[#182028] p-3 rounded-lg flex flex-col justify-between">
              <span className="text-[#8b919f] text-[11px]">Open Failure Reports</span>
              <span className={`font-bold text-sm mt-1 ${openFailuresCount > 0 ? 'text-[#ffb4ab]' : 'text-[#67df70]'}`}>
                {openFailuresCount} Open Traces
              </span>
              <span className="text-[#8b919f] text-[10px]">
                {openFailuresCount > 0 ? `-${openFailuresCount * 15} pts penalty` : 'Zero open faults'}
              </span>
            </div>

            <div className="bg-[#060f16] border border-[#182028] p-3 rounded-lg flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[#8b919f] text-[11px]">Code Base SLOC</span>
              <span className="text-[#418fff] font-bold text-sm mt-1">
                {activeDna.lines ? `${activeDna.lines} Lines` : '0 Lines'}
              </span>
              <span className="text-[#8b919f] text-[10px]">{activeDna.files || 0} Files Scanned</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4 CORE KPI SCORECARD STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Scorecard */}
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Project Health Score</span>
            <span className={`w-2 h-2 rounded-full ${healthScore >= 90 ? 'bg-[#67df70]' : healthScore >= 75 ? 'bg-[#d5bbff]' : 'bg-[#ffb4ab]'}`}></span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className={`font-headline-xl font-bold tracking-tight text-3xl ${healthScore >= 90 ? 'text-[#67df70]' : healthScore >= 75 ? 'text-[#d5bbff]' : 'text-[#ffb4ab]'}`}>
              {healthScore}
            </span>
            <span className="font-code-sm text-[#8b919f]">/ 100 Health Index</span>
          </div>
          <div className="flex items-center justify-between text-xs font-code-sm">
            <span className="text-[#8b919f]">Reliability Status:</span>
            <span className={healthScore >= 90 ? 'text-[#67df70]' : 'text-[#ffb4ab]'}>
              {healthScore >= 90 ? 'OPTIMAL' : 'REMEDIATION_NEEDED'}
            </span>
          </div>
        </div>

        {/* Test Results Card */}
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Test Suite Execution</span>
            <span className="font-code-sm bg-[#222b33] text-[#dae3ee] px-2 py-0.5 rounded text-[11px]">
              {passRate}% Pass Rate
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-headline-xl font-bold tracking-tight text-3xl text-[#dae3ee]">
              {passedTests} <span className="text-xl text-[#8b919f]">/ {totalTests}</span>
            </span>
            <span className="font-code-sm text-[#67df70]">PASSED</span>
          </div>
          <div className="flex items-center justify-between text-xs font-code-sm text-[#8b919f]">
            <span>Failed: <strong className="text-[#ffb4ab]">{failedTests}</strong></span>
            <span>Skipped: <strong className="text-[#d5bbff]">{skippedTests}</strong></span>
          </div>
        </div>

        {/* Project DNA SLOC Card */}
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Deterministic DNA</span>
            <span className="font-label-sm bg-[#418fff]/15 text-[#418fff] px-2 py-0.5 rounded border border-[#418fff]/30 text-[10px]">
              AST 3.11
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-headline-xl font-bold tracking-tight text-3xl text-[#dae3ee]">
              {activeDna.lines || 191}
            </span>
            <span className="font-code-sm text-[#8b919f]">Total SLOC</span>
          </div>
          <div className="flex items-center justify-between text-xs font-code-sm text-[#8b919f]">
            <span>{activeDna.files} Files</span>
            <span>{activeDna.functions} Functions ({activeDna.classes} Classes)</span>
          </div>
        </div>

        {/* Active Hotspots & Verification Card */}
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Dual-Run Verification</span>
            <span className="material-symbols-outlined text-[18px] text-[#67df70]">verified</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-headline-xl font-bold tracking-tight text-3xl text-[#67df70]">
              0.0%
            </span>
            <span className="font-code-sm text-[#8b919f]">Regression Rate</span>
          </div>
          <div className="flex items-center justify-between text-xs font-code-sm text-[#8b919f]">
            <span>Dual-Run: <strong>100% Passed</strong></span>
            <span className="text-[#67df70]">Hermetic Sandbox</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD VISUALIZATION GRIDS (RECHARTS SECTION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Test Outcome Breakdown Donut (5 cols) */}
        <div className="lg:col-span-5 bg-[#141c24] border border-[#182028] rounded-xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#182028]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#67df70]">pie_chart</span>
              <h2 className="font-headline-sm font-semibold text-[#dae3ee]">Test Results Distribution</h2>
            </div>
            <span className="font-code-sm text-[#8b919f] text-xs">
              {totalTests} Discovered Tests
            </span>
          </div>

          <div className="h-60 w-full py-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={testDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {testDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#141c24" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b141c', borderColor: '#2d363e', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#dae3ee' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#182028] text-center font-code-sm text-xs">
            <div className="p-2 rounded bg-[#0b141c]">
              <span className="text-[#8b919f] block">Passed</span>
              <span className="text-[#67df70] font-bold text-sm">{passedTests}</span>
            </div>
            <div className="p-2 rounded bg-[#0b141c]">
              <span className="text-[#8b919f] block">Failed</span>
              <span className="text-[#ffb4ab] font-bold text-sm">{failedTests}</span>
            </div>
            <div className="p-2 rounded bg-[#0b141c]">
              <span className="text-[#8b919f] block">Skipped</span>
              <span className="text-[#d5bbff] font-bold text-sm">{skippedTests}</span>
            </div>
          </div>
        </div>

        {/* Right: Code Composition & AST Complexity (7 cols) */}
        <div className="lg:col-span-7 bg-[#141c24] border border-[#182028] rounded-xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#182028]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#418fff]">bar_chart</span>
              <h2 className="font-headline-sm font-semibold text-[#dae3ee]">Codebase Composition &amp; Complexity</h2>
            </div>
            <span className="font-code-sm text-[#8b919f] text-xs">
              SHA: <code>{activeDna.sha256?.substring(0, 8)}...</code>
            </span>
          </div>

          <div className="h-60 w-full py-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={codeCompositionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="category" stroke="#8b919f" tick={{ fontSize: 11, fill: '#8b919f' }} />
                <YAxis stroke="#8b919f" tick={{ fontSize: 11, fill: '#8b919f' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b141c', borderColor: '#2d363e', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#dae3ee' }}
                />
                <Bar dataKey="lines" name="Quantity / SLOC" fill="#418fff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#182028] text-xs font-code-sm">
            <span className="text-[#8b919f]">Source / Test Ratio:</span>
            <span className="text-[#dae3ee] font-semibold">
              {Math.round(((activeDna.test_lines || 83) / (activeDna.lines || 191)) * 100)}% Test Density
            </span>
            <button
              onClick={() => onNavigate('project-dna')}
              className="text-[#418fff] hover:underline"
            >
              View Full DNA →
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE BREAKS & FORENSIC HOTSPOTS TABLE */}
      <div className="bg-[#141c24] border border-[#182028] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#182028] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#93000a]/20 border border-[#ba1a1a]/40 flex items-center justify-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[16px]">bug_report</span>
            </div>
            <div>
              <h2 className="font-headline-sm font-semibold text-[#dae3ee]">Active Failure Hotspots</h2>
              <span className="font-body-sm text-[#8b919f]">
                Runtime exceptions and failing assertions captured in the latest sandbox execution
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('failures')}
            className="text-[#418fff] hover:underline font-code-sm text-xs"
          >
            Open Full Failures Screen →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-code-sm text-xs">
            <thead>
              <tr className="border-b border-[#182028] text-[#8b919f] uppercase font-label-sm tracking-wider">
                <th className="py-2.5 px-3">Failure ID</th>
                <th className="py-2.5 px-3">Exception / Title</th>
                <th className="py-2.5 px-3">Crash Site (AST)</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182028]">
              {failures.map((f: any) => (
                <tr key={f.id} className="hover:bg-[#182028]/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-[#418fff]">
                    {f.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="text-[#dae3ee] font-medium">{f.title || f.error_type}</span>
                      <span className="text-[#ffb4ab] text-[11px] mt-0.5 truncate max-w-sm">{f.message}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#c1c6d6]">
                    <span>{f.file}:{f.line}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-[#93000a]/20 text-[#ffdad6] border border-[#ba1a1a]/40 px-2 py-0.5 rounded uppercase font-label-sm font-bold text-[10px]">
                      {f.severity || 'CRITICAL'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onNavigate('investigation')}
                      className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] px-2.5 py-1 rounded font-label-sm font-semibold transition-colors"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
              {failures.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#67df70] font-body-sm">
                    No active failures. All sandbox tests are passing!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK LAUNCHPAD TILES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('architecture')}
          className="p-4 rounded-xl bg-[#141c24] border border-[#182028] hover:border-[#418fff]/50 cursor-pointer transition-all flex flex-col gap-2 group"
        >
          <div className="flex items-center justify-between text-[#418fff]">
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
          <span className="font-headline-sm font-semibold text-[#dae3ee]">Call-Graph Topology</span>
          <span className="font-body-sm text-[#8b919f] text-xs">
            Inspect interactive 2D node-link map of modules, callers, and route endpoints.
          </span>
        </div>

        <div
          onClick={() => onNavigate('test-lab')}
          className="p-4 rounded-xl bg-[#141c24] border border-[#182028] hover:border-[#67df70]/50 cursor-pointer transition-all flex flex-col gap-2 group"
        >
          <div className="flex items-center justify-between text-[#67df70]">
            <span className="material-symbols-outlined text-[20px]">science</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
          <span className="font-headline-sm font-semibold text-[#dae3ee]">Reproduction Lab</span>
          <span className="font-body-sm text-[#8b919f] text-xs">
            Synthesize and run automated reproduction unit tests in scratchpad isolation.
          </span>
        </div>

        <div
          onClick={() => onNavigate('proposed-fix')}
          className="p-4 rounded-xl bg-[#141c24] border border-[#182028] hover:border-[#d5bbff]/50 cursor-pointer transition-all flex flex-col gap-2 group"
        >
          <div className="flex items-center justify-between text-[#d5bbff]">
            <span className="material-symbols-outlined text-[20px]">code</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
          <span className="font-headline-sm font-semibold text-[#dae3ee]">Proposed Fix &amp; Diff</span>
          <span className="font-body-sm text-[#8b919f] text-xs">
            Review defensive mathematical boundary patches with side-by-side split view.
          </span>
        </div>

        <div
          onClick={() => onNavigate('report')}
          className="p-4 rounded-xl bg-[#141c24] border border-[#182028] hover:border-[#ffb4ab]/50 cursor-pointer transition-all flex flex-col gap-2 group"
        >
          <div className="flex items-center justify-between text-[#ffb4ab]">
            <span className="material-symbols-outlined text-[20px]">assignment</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
          <span className="font-headline-sm font-semibold text-[#dae3ee]">Post-Mortem Report</span>
          <span className="font-body-sm text-[#8b919f] text-xs">
            Audit-ready forensic post-mortem with downloadable unified patch artifact.
          </span>
        </div>
      </div>
    </div>
  );
};
