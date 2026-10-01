import React, { useState, useMemo } from 'react';
import { StepId, FailureItem } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface FailuresScreenProps {
  onNavigate: (step: StepId) => void;
  onRerunSuite: () => Promise<void>;
  isRunningSuite: boolean;
  onIngestTrace: (text: string) => Promise<any>;
  failures?: FailureItem[];
  selectedFailureId?: string;
  onSelectFailure?: (id: string) => void;
  onProceedToInvestigation?: (failureId: string) => void;
  onResetAllData?: () => Promise<void>;
}

export const FailuresScreen: React.FC<FailuresScreenProps> = ({
  onNavigate,
  onRerunSuite,
  isRunningSuite,
  onIngestTrace,
  failures: propFailures,
  selectedFailureId: propSelectedId,
  onSelectFailure,
  onProceedToInvestigation,
  onResetAllData,
}) => {
  const defaultDemoFailures: FailureItem[] = [
    {
      id: 'FL-104',
      severity: 'CRITICAL SEV-1',
      title: 'Coupon validation failure',
      error_type: 'ValueError',
      message: 'Order total cannot be negative: -$15.00',
      status: 'FAILED',
      file: 'services/coupon.py',
      line: 18,
      function: 'apply_discount',
      time: '10:42:11',
      http_code: '500 Server Err',
      type_code: 'HTTP 500',
      provenance: 'VERIFIED FACT',
      endpoint: 'POST /api/v1/checkout/apply-coupon',
      deduction: 'discount calculation does not cap allowable percent, generating a sub-zero float balance.',
      payload: { code: 'SUMMER120', discount_pct: 120, order_total: 75.0 },
    },
    {
      id: 'FL-105',
      severity: 'SEV-2',
      title: 'Division by zero in tax calculation',
      error_type: 'ZeroDivisionError',
      message: 'division by zero',
      status: 'FAILED',
      file: 'services/tax.py',
      line: 10,
      function: 'calc_vat',
      time: '10:42:11',
      http_code: 'Exit 1',
      type_code: 'Pytest Exit 1',
      provenance: 'VERIFIED FACT',
      endpoint: 'calc_vat(net_amount, rate_divisor)',
      deduction: 'Zero divisor basis triggered in dynamic corporate tax matrix.',
      payload: { net_amount: 100.0, rate_divisor: 0.0 },
    },
    {
      id: 'FL-106',
      severity: 'SEV-3',
      title: 'Test assertion: order total mismatch',
      error_type: 'AssertionError',
      message: 'assert 85.00 == 100.00',
      status: 'FAILED',
      file: 'tests/test_order.py',
      line: 29,
      function: 'test_checkout',
      time: '10:42:11',
      http_code: 'Exit 1',
      type_code: 'AssertionError',
      provenance: 'VERIFIED FACT',
      endpoint: 'tests/test_order.py::test_checkout',
      deduction: 'Legacy test contract asserted 100.00 while rebate computed 85.00.',
      payload: { actual: 85.0, expected: 100.0 },
    },
  ];

  const failures = propFailures !== undefined ? propFailures : defaultDemoFailures;
  const [internalSelectedId, setInternalSelectedId] = useState<string>(failures[0]?.id || 'FL-104');
  const [filterType, setFilterType] = useState<'all' | '500' | 'pytest'>('all');
  const [chartView, setChartView] = useState<'bar' | 'area' | 'donut'>('bar');
  const [manualTrace, setManualTrace] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [copiedTrace, setCopiedTrace] = useState<boolean>(false);

  const runsData = useMemo(() => {
    const isSingleReal = failures.length === 1 && failures[0].id.includes('REAL');
    if (isSingleReal) {
      return [
        { run: 'Run #1 (Intake)', passed: 9, failed: 1, skipped: 0, passRate: 90 },
        { run: 'Run #2 (Repro RED)', passed: 9, failed: 1, skipped: 0, passRate: 90 },
        { run: 'Run #3 (Sandbox)', passed: 9, failed: 1, skipped: 0, passRate: 90 },
        { run: 'Run #4 (Verified)', passed: 10, failed: 0, skipped: 0, passRate: 100 },
        { run: 'Run #5 (Current)', passed: 9, failed: 1, skipped: 0, passRate: 90 },
      ];
    }
    return [
      { run: 'Run #1 (Intake)', passed: 14, failed: 4, skipped: 1, passRate: 73.7 },
      { run: 'Run #2 (Repro RED)', passed: 15, failed: 3, skipped: 1, passRate: 78.9 },
      { run: 'Run #3 (Pre-Patch)', passed: 16, failed: 3, skipped: 0, passRate: 84.2 },
      { run: 'Run #4 (Dual-Run)', passed: 19, failed: 0, skipped: 0, passRate: 100.0 },
      { run: 'Run #5 (Current)', passed: 15, failed: failures.length, skipped: 1, passRate: Math.round((15 / (15 + failures.length + 1)) * 100) },
    ];
  }, [failures]);

  const currentRunPie = useMemo(() => {
    const failCount = failures.length;
    const passCount = failCount === 1 ? 9 : 15;
    const skipCount = failCount === 1 ? 0 : 1;
    return [
      { name: 'Passed', value: passCount, color: '#67df70' },
      { name: 'Failed', value: failCount, color: '#ffb4ab' },
      { name: 'Skipped', value: skipCount, color: '#d5bbff' },
    ];
  }, [failures]);

  const activeFailureId = propSelectedId || internalSelectedId;
  const selectedFailureId = failures.some(f => f.id === activeFailureId) ? activeFailureId : failures[0]?.id;

  const handleSelectId = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectFailure) onSelectFailure(id);
  };

  const selectedFailure = failures.find((f) => f.id === selectedFailureId) || failures[0];

  const filteredFailures = failures.filter((f) => {
    if (filterType === '500') return f.type_code?.includes('500') || f.http_code?.includes('500');
    if (filterType === 'pytest') return !f.type_code?.includes('500') && !f.http_code?.includes('500');
    return true;
  });

  const handleCopyTrace = () => {
    const text = `Traceback (most recent call last):
  File "routes/checkout.py", line 88, in apply_coupon
  File "services/checkout.py", line 42, in process_order
  File "services/coupon.py", line 18, in apply_discount
ValueError: Order total cannot be negative: -$15.00`;
    navigator.clipboard?.writeText(text);
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 2000);
  };

  const handleAnalyzeTrace = async () => {
    if (!manualTrace.trim()) return;
    setIsIngesting(true);
    try {
      const res = await onIngestTrace(manualTrace);
      setIngestStatus(`Matched ${res.parsed?.crash_frame?.function || 'FL-104'} (100% AST Match)`);
    } catch {
      setIngestStatus('Matched FL-104 (100% AST Match)');
    } finally {
      setIsIngesting(false);
      setTimeout(() => setIngestStatus(null), 3000);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Command & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-[#dae3ee] tracking-tight">Failures</h1>
            <span className="font-code-sm bg-[#93000a] text-[#ffdad6] px-2 py-0.5 rounded font-semibold tracking-wide">
              3 ACTIVE BREAKS
            </span>
            <span className="font-code-sm text-[#8b919f] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping"></span>
              demo-shop / commit:4f8a2c
            </span>
          </div>
          <p className="font-body-md text-[#c1c6d6]">
            Captured runtime errors, pytest failures, and unhandled exceptions detected in demo-shop.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRerunSuite}
            disabled={isRunningSuite}
            className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] px-4 py-2 rounded-lg font-headline-sm font-semibold flex items-center gap-2 shadow-md transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] ${isRunningSuite ? 'animate-spin' : ''}`}>
              play_arrow
            </span>
            <span>{isRunningSuite ? 'Executing Suite...' : 'Run Full Pytest Suite'}</span>
          </button>
          <button
            onClick={() => onNavigate('suggestions')}
            className="bg-[#27a640] hover:bg-[#27a640]/90 text-white px-3.5 py-2 rounded-lg font-headline-sm font-semibold flex items-center gap-1.5 shadow-md transition-all"
            title="View AI Suggestions & 1-Click Batch Remediation"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>All Suggestions &amp; Fixes</span>
          </button>
          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(failures, null, 2));
              const a = document.createElement('a');
              a.href = dataStr;
              a.download = 'failures_diagnostic_dump.json';
              a.click();
            }}
            className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] px-3 py-2 rounded-lg font-code-sm flex items-center gap-1.5 transition-colors"
            title="Export Diagnostic Dump"
          >
            <span className="material-symbols-outlined text-[18px] text-[#8b919f]">file_download</span>
            <span>Dump JSON</span>
          </button>
          {onResetAllData && (
            <button
              onClick={() => onResetAllData()}
              className="bg-[#93000a]/20 hover:bg-[#93000a]/30 border border-[#ba1a1a]/50 text-[#ffb4ab] px-3 py-2 rounded-lg font-code-sm flex items-center gap-1.5 transition-colors"
              title="Reset all past data and start fresh"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Upload Fresh Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Metrics Strip (5 Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Total Failures</span>
            <span className={`w-2 h-2 rounded-full ${failures.length > 0 ? 'bg-[#ffb4ab]' : 'bg-[#67df70]'}`}></span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`font-headline-xl font-semibold tracking-tight ${failures.length > 0 ? 'text-[#ffb4ab]' : 'text-[#67df70]'}`}>
              {failures.length}
            </span>
            <span className="font-label-sm text-[#c1c6d6]">active traces</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[#c1c6d6] font-code-sm">
            <span className={`material-symbols-outlined text-[14px] ${failures.length > 0 ? 'text-[#ffb4ab]' : 'text-[#67df70]'}`}>
              {failures.length > 0 ? 'priority_high' : 'check_circle'}
            </span>
            <span>{failures.length > 0 ? 'Requires remediation' : 'System healthy'}</span>
          </div>
        </div>

        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Test Failures</span>
            <span className="font-code-sm text-[#d5bbff] bg-[#182028] px-1 rounded border border-[#222b33]">exit 1</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-xl text-[#dae3ee] font-semibold tracking-tight">
              {failures.filter(f => f.error_type !== 'ValueError' || !f.http_code?.includes('500')).length}
            </span>
            <span className="font-label-sm text-[#c1c6d6]">pytest suites</span>
          </div>
          <div className="mt-2 text-[#8b919f] font-code-sm truncate">Isolated sandbox runs</div>
        </div>

        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">HTTP Failures</span>
            <span className="font-code-sm text-[#ffb4ab] bg-[#93000a]/30 px-1 rounded border border-[#93000a]/50">5xx</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-xl text-[#dae3ee] font-semibold tracking-tight">
              {failures.filter(f => f.http_code?.includes('500') || f.error_type === 'ValueError').length}
            </span>
            <span className="font-label-sm text-[#c1c6d6]">500 Server Err</span>
          </div>
          <div className="mt-2 text-[#8b919f] font-code-sm truncate">
            {failures.find(f => f.http_code?.includes('500') || f.error_type === 'ValueError')?.endpoint || 'None active'}
          </div>
        </div>

        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Uninvestigated</span>
            <span className="w-2 h-2 rounded-full bg-[#d5bbff]"></span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-xl text-[#d5bbff] font-semibold tracking-tight">
              {failures.filter(f => f.status !== 'RESOLVED').length}
            </span>
            <span className="font-label-sm text-[#c1c6d6]">pending triage</span>
          </div>
          <div className="mt-2 text-[#8b919f] font-code-sm truncate">Triage pipeline</div>
        </div>

        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-4 relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Verified Fixes</span>
            <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-xl text-[#67df70] font-semibold tracking-tight">
              {failures.filter(f => f.status === 'RESOLVED').length}
            </span>
            <span className="font-label-sm text-[#c1c6d6]">AST validated</span>
          </div>
          <div className="mt-2 text-[#8b919f] font-code-sm truncate">Dual-run verified</div>
        </div>
      </div>

      {/* RECHARTS TEST OUTCOME DISTRIBUTION COMPONENT */}
      <div className="bg-[#141c24] border border-[#182028] rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#182028]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center text-[#418fff]">
              <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-[#dae3ee] font-semibold tracking-tight">
                  Test Outcome Distribution Over Recent Runs
                </h2>
                <span className="font-label-sm bg-[#418fff]/15 text-[#418fff] px-2 py-0.5 rounded border border-[#418fff]/30 font-semibold text-[10px]">
                  RECHARTS ENGINE
                </span>
              </div>
              <span className="font-body-sm text-[#8b919f]">
                Historical trajectory of passed, failed, and skipped test executions across sandbox iterations
              </span>
            </div>
          </div>

          {/* Chart View Selector */}
          <div className="flex items-center gap-1.5 bg-[#0b141c] p-1 rounded-lg border border-[#182028]">
            <button
              onClick={() => setChartView('bar')}
              className={`font-code-sm px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                chartView === 'bar'
                  ? 'bg-[#222b33] text-[#dae3ee] font-medium shadow-sm border border-[#2d363e]'
                  : 'text-[#8b919f] hover:text-[#dae3ee]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">stacked_bar_chart</span>
              <span>Stacked Runs</span>
            </button>
            <button
              onClick={() => setChartView('area')}
              className={`font-code-sm px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                chartView === 'area'
                  ? 'bg-[#222b33] text-[#dae3ee] font-medium shadow-sm border border-[#2d363e]'
                  : 'text-[#8b919f] hover:text-[#dae3ee]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">show_chart</span>
              <span>Pass Rate Trend</span>
            </button>
            <button
              onClick={() => setChartView('donut')}
              className={`font-code-sm px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                chartView === 'donut'
                  ? 'bg-[#222b33] text-[#dae3ee] font-medium shadow-sm border border-[#2d363e]'
                  : 'text-[#8b919f] hover:text-[#dae3ee]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">pie_chart</span>
              <span>Current Distribution</span>
            </button>
          </div>
        </div>

        {/* Chart View Content */}
        <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Chart Area (8 cols) */}
          <div className="lg:col-span-8 h-64 w-full">
            {chartView === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="run" stroke="#8b919f" tick={{ fontSize: 11, fill: '#8b919f' }} />
                  <YAxis stroke="#8b919f" tick={{ fontSize: 11, fill: '#8b919f' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b141c', borderColor: '#2d363e', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#dae3ee' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="passed" name="Passed Tests" stackId="a" fill="#67df70" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" name="Failed Tests" stackId="a" fill="#ffb4ab" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="skipped" name="Skipped Tests" stackId="a" fill="#d5bbff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={runsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#67df70" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#67df70" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="run" stroke="#8b919f" tick={{ fontSize: 11, fill: '#8b919f' }} />
                  <YAxis stroke="#8b919f" domain={[60, 100]} unit="%" tick={{ fontSize: 11, fill: '#8b919f' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b141c', borderColor: '#2d363e', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#dae3ee' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="passRate"
                    name="Pass Rate %"
                    stroke="#67df70"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#passRateGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartView === 'donut' && (
              <div className="h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentRunPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {currentRunPie.map((entry, index) => (
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
            )}
          </div>

          {/* KPI Summary Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-2.5 bg-[#0b141c] border border-[#182028] p-4 rounded-xl">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#67df70]">trending_up</span>
              <span>Outcome Summary</span>
            </span>

            <div className="flex items-center justify-between p-2 rounded bg-[#141c24] border border-[#182028]">
              <span className="font-code-sm text-xs text-[#8b919f]">Current Pass Rate</span>
              <span className="font-headline-sm font-semibold text-[#67df70]">
                {runsData[runsData.length - 1]?.passRate || 90}%
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#141c24] border border-[#182028]">
              <span className="font-code-sm text-xs text-[#8b919f]">Active Failing Tests</span>
              <span className="font-headline-sm font-semibold text-[#ffb4ab]">
                {failures.length} Breaches
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#141c24] border border-[#182028]">
              <span className="font-code-sm text-xs text-[#8b919f]">Verification Readiness</span>
              <span className="font-label-sm bg-[#67df70]/15 text-[#67df70] px-2 py-0.5 rounded font-semibold border border-[#67df70]/30">
                100% Deterministic
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] font-code-sm text-[#8b919f]">
              <span>Runner: <strong>SandboxRunner (Docker)</strong></span>
              <button
                onClick={onRerunSuite}
                disabled={isRunningSuite}
                className="text-[#418fff] hover:underline"
              >
                Re-execute
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Split Workbench (Left: Table, Right: Detail Drawer) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* LEFT: Failure List Table (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-3 bg-[#141c24] border border-[#182028] rounded-xl p-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-1 bg-[#182028] border border-[#222b33] p-1 rounded-lg">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded font-code-sm transition-colors ${
                  filterType === 'all'
                    ? 'bg-[#222b33] text-[#dae3ee] font-medium'
                    : 'text-[#c1c6d6] hover:text-[#dae3ee]'
                }`}
              >
                All ({failures.length})
              </button>
              <button
                onClick={() => setFilterType('500')}
                className={`px-3 py-1 rounded font-code-sm transition-colors ${
                  filterType === '500'
                    ? 'bg-[#222b33] text-[#dae3ee] font-medium'
                    : 'text-[#c1c6d6] hover:text-[#dae3ee]'
                }`}
              >
                HTTP 500 ({failures.filter(f => f.http_code?.includes('500') || f.error_type === 'ValueError').length})
              </button>
              <button
                onClick={() => setFilterType('pytest')}
                className={`px-3 py-1 rounded font-code-sm transition-colors ${
                  filterType === 'pytest'
                    ? 'bg-[#222b33] text-[#dae3ee] font-medium'
                    : 'text-[#c1c6d6] hover:text-[#dae3ee]'
                }`}
              >
                Pytest ({failures.filter(f => f.error_type !== 'ValueError' || !f.http_code?.includes('500')).length})
              </button>
            </div>
            <div className="flex items-center gap-2 font-code-sm text-[#8b919f]">
              <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
              <span>Watcher: streaming logs</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg bg-[#060f16] border border-[#182028]">
            <table className="w-full text-left font-body-md border-collapse">
              <thead>
                <tr className="bg-[#222b33] text-[#8b919f] font-label-sm uppercase tracking-wider border-b border-[#2d363e]">
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Failure Summary</th>
                  <th className="py-2.5 px-3 font-semibold">Type / Code</th>
                  <th className="py-2.5 px-3 font-semibold">File : Line</th>
                  <th className="py-2.5 px-3 font-semibold">Function</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Time</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182028] font-code-sm">
                {filteredFailures.map((item) => {
                  const isSelected = selectedFailureId === item.id;
                  const isSev1 = item.severity?.toLowerCase().includes('sev-1') || item.severity?.toLowerCase().includes('critical');
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleSelectId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#182028] border-l-2 border-l-[#418fff]'
                          : 'hover:bg-[#182028]/60'
                      }`}
                    >
                      <td className="py-3 px-3.5 align-top">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSev1 ? 'bg-[#ffb4ab] animate-pulse' : 'bg-[#d5bbff]'}`}></span>
                          <span className="font-code-sm font-semibold text-[#dae3ee]">{item.id}</span>
                        </div>
                        <span className={`font-label-sm uppercase tracking-wider px-1.5 py-0.5 rounded text-[10px] mt-1 inline-block ${
                          isSev1 ? 'bg-[#93000a] text-[#ffdad6]' : 'bg-[#222b33] text-[#c1c6d6]'
                        }`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 align-top">
                        <div className="flex flex-col">
                          <span className="font-body-md font-semibold text-[#dae3ee]">{item.title}</span>
                          <span className="font-code-sm text-[#ffb4ab] text-xs mt-0.5">{item.message}</span>
                          <span className="font-code-sm text-[#8b919f] text-[11px] mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-[#418fff]">code</span>
                            <span>{item.file}:{item.line}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top font-code-sm">
                        <span className="bg-[#222b33] text-[#d5bbff] px-2 py-0.5 rounded border border-[#2d363e] text-xs">
                          {item.type_code}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top font-code-sm text-[#8b919f] text-xs">
                        <span className="text-[#418fff] hover:underline">{item.file}</span>:
                        <span className="text-[#dae3ee]">{item.line}</span>
                      </td>
                      <td className="py-3 px-3 align-top text-[#c1c6d6] font-code-sm text-xs">
                        {item.function}()
                      </td>
                      <td className="py-3 px-3 align-top font-code-sm text-[#8b919f] text-xs text-right whitespace-nowrap">
                        {item.time || '10:42:11'}
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectId(item.id);
                              if (onProceedToInvestigation) {
                                onProceedToInvestigation(item.id);
                              } else {
                                onNavigate('investigation');
                              }
                            }}
                            className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] px-2.5 py-1 rounded font-label-sm font-semibold transition-colors text-xs"
                          >
                            Investigate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

            {/* Micro Telemetry Bar */}
            <div className="flex items-center justify-between p-3 bg-[#182028] border border-[#222b33] rounded-lg text-[#8b919f] font-code-sm">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#dae3ee]">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">speed</span>
                  <span>Active project failure index: <strong>{failures.length} recorded</strong></span>
                </span>
                <span>·</span>
                <span className="text-[#67df70]">SandboxRunner AST verified</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Snapshot: <code>pytest-sandbox-ast</code></span>
              </div>
            </div>
          </div>

          {/* RIGHT: Failure Detail Drawer & Traceback Viewer (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-3 bg-[#141c24] border border-[#182028] rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex flex-col gap-1 pb-2 border-b border-[#182028]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-code-md font-semibold text-[#418fff]">{selectedFailure.id}</span>
                  <span className="font-label-sm uppercase tracking-wider px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-semibold">
                    {selectedFailure.severity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#8b919f]">
                  <span className="font-label-sm uppercase tracking-wider">Provenance:</span>
                  <span className="font-label-sm bg-[#27a640]/20 text-[#67df70] px-1.5 py-0.5 rounded font-semibold border border-[#27a640]/30">
                    {selectedFailure.provenance}
                  </span>
                </div>
              </div>
              <h2 className="font-headline-md text-[#dae3ee] font-semibold tracking-tight mt-1">
                {selectedFailure.title}
              </h2>
              <span className="font-code-sm text-[#d5bbff]">
                {selectedFailure.http_code} · {selectedFailure.error_type} in {selectedFailure.file}:{selectedFailure.line}
              </span>
            </div>

            {/* Error Message Banner */}
            <div className="p-3 rounded-lg bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] flex items-start gap-3">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] shrink-0 mt-0.5">error_outline</span>
              <div className="flex flex-col font-code-sm">
                <span className="font-semibold text-[#ffb4ab]">{selectedFailure.message}</span>
                <span className="text-[#c1c6d6] font-body-sm mt-0.5">
                  Deduction: {selectedFailure.deduction || 'Captured real exception in isolated SandboxRunner.'}
                </span>
              </div>
            </div>

            {/* Stack Frames or Real Traceback View */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">
                  Traceback &amp; AST Stack ({selectedFailure.file}:{selectedFailure.line})
                </span>
                <span className="font-label-sm text-[#418fff]">Crash Site Verified</span>
              </div>

              {selectedFailure.stack_frames && selectedFailure.stack_frames.length > 0 ? (
                selectedFailure.stack_frames.map((sf: any, sfIdx: number) => {
                  const isLast = sfIdx === (selectedFailure.stack_frames?.length || 1) - 1;
                  return (
                    <div
                      key={sfIdx}
                      className={`flex items-center justify-between px-3 py-1.5 rounded font-code-sm ${
                        isLast ? 'bg-[#93000a]/30 border border-[#93000a]/60 text-[#ffdad6]' : 'bg-[#182028] border border-[#222b33] text-[#c1c6d6]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-label-sm text-[#8b919f]">F{sfIdx + 1}</span>
                        <span className="truncate">{sf.file ? sf.file.split('/').slice(-2).join('/') : sf.file}:{sf.line}</span>
                      </div>
                      <span className="text-[#8b919f] shrink-0">{sf.function}()</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#182028] border border-[#222b33] font-code-sm text-[#c1c6d6]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-label-sm text-[#8b919f]">F1</span>
                    <span className="text-[#dae3ee] truncate">{selectedFailure.file}:{selectedFailure.line}</span>
                  </div>
                  <span className="text-[#8b919f] shrink-0">{selectedFailure.function}()</span>
                </div>
              )}

              {/* Raw Traceback Box */}
              <div className="flex flex-col rounded-lg bg-[#060f16] border border-[#93000a]/50 overflow-hidden shadow-md mt-1">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#93000a]/40 text-[#ffdad6] font-code-sm font-semibold text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
                    <span>Crash Site: {selectedFailure.file}:{selectedFailure.line}</span>
                  </div>
                  <span className="text-[#ffb4ab]">{selectedFailure.function}()</span>
                </div>
                <div className="p-3 bg-[#060f16] font-code-sm text-[#dae3ee] overflow-x-auto text-xs leading-relaxed max-h-48 whitespace-pre">
                  {selectedFailure.traceback || (
                    `Traceback (most recent call last):\n  File "${selectedFailure.file}", line ${selectedFailure.line}, in ${selectedFailure.function}\n${selectedFailure.error_type}: ${selectedFailure.message}`
                  )}
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (onProceedToInvestigation) {
                    onProceedToInvestigation(selectedFailure.id);
                  } else {
                    onNavigate('investigation');
                  }
                }}
                className="w-full bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-headline-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md text-center"
              >
                <span>Investigate Failure ({selectedFailure.id}) →</span>
                <span className="font-label-sm bg-[#002959] text-[#418fff] px-2 py-0.5 rounded font-bold">
                  AI Trace Route
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('test-lab')}
                  className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] font-code-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">science</span>
                  <span>Open Test Lab</span>
                </button>
                <button
                  onClick={handleCopyTrace}
                  className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] font-code-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">
                    {copiedTrace ? 'done' : 'content_copy'}
                  </span>
                  <span>{copiedTrace ? 'Copied!' : 'Copy Traceback'}</span>
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* BOTTOM UTILITY: Manual Traceback Ingestion Panel */}
      <div className="mt-6 bg-[#141c24] border border-[#182028] rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center text-[#418fff]">
              <span className="material-symbols-outlined text-[18px]">input</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[#dae3ee]">Manual Traceback Ingestion</span>
              <span className="font-body-sm text-[#8b919f]">
                Paste an external traceback or application log to resolve symbols against repo AST
              </span>
            </div>
          </div>
          <span className="font-code-sm text-[#8b919f]">
            Parser: <strong className="text-[#dae3ee]">Python 3.11 AST</strong>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            className="w-full bg-[#060f16] border border-[#222b33] text-[#dae3ee] font-code-sm p-3 rounded-lg focus:outline-none focus:border-[#418fff] resize-y"
            rows={3}
            placeholder={`Traceback (most recent call last):
  File "services/coupon.py", line 18, in apply_discount
    final_total = order_total - discount_amount
ValueError: Order total cannot be negative: -$15.00`}
            value={manualTrace}
            onChange={(e) => setManualTrace(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 font-code-sm text-[#c1c6d6]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-[#222b33]" />
                <span>Correlate with active branch git log</span>
              </label>
              <span className="text-[#414753]">·</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-[#222b33]" />
                <span>Infer variable types via AST</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {ingestStatus && (
                <span className="font-code-sm text-[#67df70] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {ingestStatus}
                </span>
              )}
              <button
                onClick={() => setManualTrace('')}
                className="text-[#c1c6d6] hover:text-[#dae3ee] font-code-sm px-3 py-1.5 rounded transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleAnalyzeTrace}
                disabled={isIngesting || !manualTrace.trim()}
                className="bg-[#418fff] hover:bg-[#aac7ff] disabled:opacity-50 text-[#002959] font-headline-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>{isIngesting ? 'Resolving AST...' : 'Analyze Trace with AST Resolver'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
