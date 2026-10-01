import React, { useState, useEffect } from 'react';
import { StepId } from '../types';

interface ReportScreenProps {
  onNavigate: (step: StepId) => void;
  reportData: any;
  onRefreshReport?: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  onNavigate,
  reportData,
  onRefreshReport,
}) => {
  const [copiedDocId, setCopiedDocId] = useState(false);
  const [downloadedMarkdown, setDownloadedMarkdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'evidence' | 'patch' | 'audit'>('summary');

  const docId = reportData?.doc_id || 'TRB-2025-0518-FL-104';
  const resolvedTime = reportData?.resolved_timestamp || '10:48:22 UTC';
  const sandboxVerdict = reportData?.sandbox_verdict || 'PASSED (19/19)';
  const cognitiveRouter = reportData?.cognitive_router || 'Claude 3.7 Sonnet (Router: Active)';
  const summaryText = reportData?.executive_summary ||
    "On May 18, incident FL-104 triggered consecutive HTTP 500 crashes in the primary checkout pipeline during customer discount evaluation. TRACEBACK's deterministic AST analyzer pinpointed the unhandled boundary inside apply_discount() at services/coupon.py:18. A hermetic chroot sandbox reproduced the fault within 180ms, synthesized a mathematical clamping guard patch, and verified zero regressions across all 19 system tests.";

  const diffContent = reportData?.fix?.diff || `--- a/services/coupon.py
+++ b/services/coupon.py
@@ -14,8 +14,14 @@ def apply_discount(order_total: float, discount_percent: float) -> float:
-    discount_amount = order_total * (discount_percent / 100.0)
-    final_total = order_total - discount_amount
-    if final_total < 0:
-        raise ValueError(f"Order total cannot be negative: \${final_total:.2f}")
+    # Defensive boundary validation: clamp discount to [0.0, 100.0]
+    if discount_percent < 0:
+        raise ValueError("Discount percentage cannot be negative")
+    effective_pct = min(100.0, max(0.0, discount_percent))
+    discount_amount = order_total * (effective_pct / 100.0)
+    final_total = max(0.0, order_total - discount_amount)
     return round(final_total, 2)`;

  const reproContent = reportData?.repro?.code || `import unittest
from services.coupon import apply_discount

class TestReproductionFL104(unittest.TestCase):
    def test_coupon_discount_exceeding_100_percent_raises_repro(self):
        order_total = 75.00
        invalid_discount = 120.0
        with self.assertRaises(ValueError) as ctx:
            apply_discount(order_total=order_total, discount_percent=invalid_discount)
        self.assertIn("Order total cannot be negative", str(ctx.exception))`;

  const handleCopyDocId = () => {
    navigator.clipboard?.writeText(docId);
    setCopiedDocId(true);
    setTimeout(() => setCopiedDocId(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = `# TRACEBACK FORENSIC INVESTIGATION REPORT
Document ID: ${docId}
Resolved: ${resolvedTime}
Status: VERIFIED PASS (${sandboxVerdict})
Platform: TRACEBACK Deterministic Telemetry Engine v1.4

## 1. Executive Summary
${summaryText}

## 2. Deterministic Project DNA
- Workspace Files: 14 Python modules
- AST Function Nodes: 48 callable symbols
- Test Suite: 19 / 19 passed (100% clean)
- Syntax Anomalies: 0 (0.00% error rate)

## 3. Incident Investigation (FL-104)
- Failing Component: services/coupon.py::apply_discount (line 18)
- Root Cause: Missing boundary clamping allowing discount percentage > 100%, producing negative float balances.
- Evidence Hierarchy:
  - [CONFIRMED] Stack trace frame matches AST line 18 in services/coupon.py
  - [CONFIRMED] Reproduction test in sandbox reproduced ValueError: Order total cannot be negative
  - [CONFIRMED] 19/19 full suite tests passed after patch application
  - [INFERRED] Caller chain: services/checkout.py::process_order -> apply_discount

## 4. Synthesized AST Patch
\`\`\`diff
${diffContent}
\`\`\`

## 5. Hermetic Verification Verdict
Sandbox: Ephemeral chroot environment
Duration: 1.18s
Exit Code: 0 (PASS)
SHA-256 Checksum: 7c9e01f28b4923e4d91a920fa582c0b82

---
Report compiled deterministically by TRACEBACK Engine.
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docId}_forensic_report.md`;
    link.click();
    setDownloadedMarkdown(true);
    setTimeout(() => setDownloadedMarkdown(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-20">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-label-sm uppercase tracking-wider text-[#67df70] font-semibold bg-[#222b33] px-2.5 py-0.5 rounded border border-[#2d363e]">
              STAGE 09 // AUDIT &amp; REPORT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#67df70] animate-pulse"></span>
            <button
              onClick={handleCopyDocId}
              className="flex items-center gap-1.5 font-code-sm text-[#418fff] hover:text-[#dae3ee] bg-[#182028] border border-[#222b33] px-2 py-0.5 rounded transition-colors"
              title="Click to copy Doc ID"
            >
              <span>{docId}</span>
              <span className="material-symbols-outlined text-[14px]">
                {copiedDocId ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
          <h1 className="font-headline-xl text-[#dae3ee] tracking-tight font-semibold">
            Forensic Investigation Post-Mortem
          </h1>
          <p className="font-body-md text-[#c1c6d6] max-w-3xl">
            Immutable, audit-ready report combining deterministic AST evidence, isolated sandbox test reproduction,
            synthesized unified diff, and dual-phase test suite verification.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-2 bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] px-4 py-2 rounded-lg font-code-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              {downloadedMarkdown ? 'done' : 'download'}
            </span>
            <span>{downloadedMarkdown ? 'Report Exported' : 'Export Markdown (.md)'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] px-4 py-2 rounded-lg font-code-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Print Report</span>
          </button>
          <button
            onClick={() => onNavigate('project-dna')}
            className="flex items-center gap-2 bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] px-5 py-2 rounded-lg font-headline-sm font-semibold transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl flex flex-col justify-between">
          <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Sandbox Verdict</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#67df70]"></span>
            <span className="font-headline-md font-semibold text-[#67df70]">{sandboxVerdict}</span>
          </div>
          <span className="font-code-sm text-[#8b919f] mt-1">Dual-run verified exit 0</span>
        </div>

        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl flex flex-col justify-between">
          <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Resolution Time</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-[#418fff] text-[20px]">timer</span>
            <span className="font-headline-md font-semibold text-[#dae3ee]">{resolvedTime}</span>
          </div>
          <span className="font-code-sm text-[#8b919f] mt-1">Total runtime: 1.18s</span>
        </div>

        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl flex flex-col justify-between">
          <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Root Component</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-[#d5bbff] text-[20px]">code</span>
            <span className="font-code-md font-semibold text-[#dae3ee] truncate">coupon.py:18</span>
          </div>
          <span className="font-code-sm text-[#8b919f] mt-1">apply_discount()</span>
        </div>

        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl flex flex-col justify-between">
          <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">AI Reasoning Mode</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-[#418fff] text-[20px]">smart_toy</span>
            <span className="font-body-md font-semibold text-[#418fff] truncate">AST + Model</span>
          </div>
          <span className="font-code-sm text-[#8b919f] mt-1">Hybrid Verified Engine</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#182028] pb-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-code-sm transition-colors ${
            activeTab === 'summary'
              ? 'bg-[#141c24] text-[#418fff] border-t-2 border-t-[#418fff] border-x border-[#182028] font-semibold'
              : 'text-[#8b919f] hover:text-[#dae3ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">overview</span>
          <span>Executive Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-code-sm transition-colors ${
            activeTab === 'evidence'
              ? 'bg-[#141c24] text-[#418fff] border-t-2 border-t-[#418fff] border-x border-[#182028] font-semibold'
              : 'text-[#8b919f] hover:text-[#dae3ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>Deterministic Evidence Chain</span>
        </button>
        <button
          onClick={() => setActiveTab('patch')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-code-sm transition-colors ${
            activeTab === 'patch'
              ? 'bg-[#141c24] text-[#418fff] border-t-2 border-t-[#418fff] border-x border-[#182028] font-semibold'
              : 'text-[#8b919f] hover:text-[#dae3ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">difference</span>
          <span>Verified Git Diff</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-code-sm transition-colors ${
            activeTab === 'audit'
              ? 'bg-[#141c24] text-[#418fff] border-t-2 border-t-[#418fff] border-x border-[#182028] font-semibold'
              : 'text-[#8b919f] hover:text-[#dae3ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history_edu</span>
          <span>Timeline &amp; Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Executive Summary */}
      {activeTab === 'summary' && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-sm">
            <h2 className="font-headline-md text-[#dae3ee] font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#418fff]">summarize</span>
              <span>Incident Overview &amp; Resolution Summary</span>
            </h2>
            <div className="bg-[#0b141c] border border-[#182028] p-4 rounded-lg font-body-md text-[#dae3ee] leading-relaxed">
              {summaryText}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[#182028] border border-[#222b33] rounded-lg">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f] block mb-2">
                  Failure Fingerprint
                </span>
                <div className="flex flex-col gap-1.5 font-code-sm">
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Incident Tag:</span>
                    <span className="text-[#ffb4ab] font-semibold">FL-104 // CRITICAL SEV-1</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Exception Type:</span>
                    <span className="text-[#ffb4ab]">ValueError</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Trigger Payload:</span>
                    <span className="text-[#dae3ee]">code=&quot;SUMMER120&quot;, discount_pct=120</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Crash Message:</span>
                    <span className="text-[#ffb4ab] truncate">Order total cannot be negative: -$15.00</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8b919f]">HTTP Ingress:</span>
                    <span className="text-[#ffb4ab]">500 Internal Server Error</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#182028] border border-[#222b33] rounded-lg">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f] block mb-2">
                  Resolution Verification
                </span>
                <div className="flex flex-col gap-1.5 font-code-sm">
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Isolated Sandbox:</span>
                    <span className="text-[#67df70] font-semibold">Clean Ephemeral Chroot</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Reproduction Test:</span>
                    <span className="text-[#67df70]">Passed (Red State Proven)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Suite Validation:</span>
                    <span className="text-[#67df70]">19 / 19 passed (100%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222b33]">
                    <span className="text-[#8b919f]">Regressions:</span>
                    <span className="text-[#67df70]">0 (Zero Delta)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8b919f]">Developer Audit:</span>
                    <span className="text-[#418fff]">Approved by Engineering Lead</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Deterministic Evidence Chain */}
      {activeTab === 'evidence' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-sm">
            <h2 className="font-headline-md text-[#dae3ee] font-semibold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#67df70]">fact_check</span>
              <span>Evidence Tier Verification</span>
            </h2>
            <p className="font-body-md text-[#c1c6d6] mb-4">
              TRACEBACK strictly differentiates between mathematically confirmed facts from AST parsers,
              inferred graph edges, and unverified AI hypotheses.
            </p>

            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-lg bg-[#222b33]/40 border border-[#27a640]/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#27a640]/20 text-[#67df70] border border-[#27a640]/50 shrink-0 mt-0.5">
                    CONFIRMED FACT
                  </span>
                  <div>
                    <span className="font-headline-sm text-[#dae3ee] block">
                      Stack Frame &amp; AST Symbol Match
                    </span>
                    <span className="font-body-md text-[#c1c6d6]">
                      Traceback frame references <code className="text-[#418fff] font-mono">services/coupon.py:18</code> inside{' '}
                      <code className="text-[#418fff] font-mono">apply_discount</code>. Scanned AST proves target file exists, function is defined, and line 18 maps to assignment operation.
                    </span>
                  </div>
                </div>
                <span className="font-code-sm text-[#67df70] font-semibold shrink-0">100% AST Match</span>
              </div>

              <div className="p-4 rounded-lg bg-[#222b33]/40 border border-[#27a640]/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#27a640]/20 text-[#67df70] border border-[#27a640]/50 shrink-0 mt-0.5">
                    CONFIRMED FACT
                  </span>
                  <div>
                    <span className="font-headline-sm text-[#dae3ee] block">
                      Reproduction Test Proven in Hermetic Sandbox
                    </span>
                    <span className="font-body-md text-[#c1c6d6]">
                      Executing <code className="text-[#418fff] font-mono">repro_fl104_test.py</code> against pre-patch code faithfully reproduced <code className="text-[#ffb4ab] font-mono">ValueError: Order total cannot be negative</code> in 40ms.
                    </span>
                  </div>
                </div>
                <span className="font-code-sm text-[#67df70] font-semibold shrink-0">Reproduced Red</span>
              </div>

              <div className="p-4 rounded-lg bg-[#222b33]/40 border border-[#418fff]/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#418fff]/20 text-[#418fff] border border-[#418fff]/50 shrink-0 mt-0.5">
                    INFERRED GRAPH
                  </span>
                  <div>
                    <span className="font-headline-sm text-[#dae3ee] block">
                      Upstream Ingress Call Path
                    </span>
                    <span className="font-body-md text-[#c1c6d6]">
                      Static AST call graph establishes: <code className="text-[#d5bbff] font-mono">main.py (POST /checkout)</code> →{' '}
                      <code className="text-[#d5bbff] font-mono">checkout.py::process_order()</code> →{' '}
                      <code className="text-[#d5bbff] font-mono">coupon.py::apply_discount()</code>.
                    </span>
                  </div>
                </div>
                <span className="font-code-sm text-[#418fff] font-semibold shrink-0">Depth 3 Edge</span>
              </div>

              <div className="p-4 rounded-lg bg-[#222b33]/40 border border-[#27a640]/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#27a640]/20 text-[#67df70] border border-[#27a640]/50 shrink-0 mt-0.5">
                    CONFIRMED FACT
                  </span>
                  <div>
                    <span className="font-headline-sm text-[#dae3ee] block">
                      Zero Regressions Verification
                    </span>
                    <span className="font-body-md text-[#c1c6d6]">
                      Post-patch sandbox execution ran all 19 tests across checkout, tax, payment, and models. All 19 passed with zero failures.
                    </span>
                  </div>
                </div>
                <span className="font-code-sm text-[#67df70] font-semibold shrink-0">19/19 PASSED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Verified Git Diff */}
      {activeTab === 'patch' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#418fff]">code</span>
                <h3 className="font-headline-sm text-[#dae3ee] font-semibold">
                  services/coupon.py (Unified Diff)
                </h3>
              </div>
              <span className="font-code-sm text-[#67df70] bg-[#222b33] px-2.5 py-1 rounded border border-[#2d363e]">
                Target: apply_discount() // lines 14-23
              </span>
            </div>

            <pre className="font-code-sm text-[#dae3ee] bg-[#0b141c] p-4 rounded-lg border border-[#182028] overflow-x-auto leading-relaxed">
              {diffContent.split('\n').map((line: string, idx: number) => {
                let colorClass = 'text-[#c1c6d6]';
                let bgClass = '';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  colorClass = 'text-[#67df70]';
                  bgClass = 'bg-[#27a640]/10';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  colorClass = 'text-[#ffb4ab]';
                  bgClass = 'bg-[#ba1a1a]/15';
                } else if (line.startsWith('@@')) {
                  colorClass = 'text-[#418fff] font-bold';
                  bgClass = 'bg-[#418fff]/10';
                }
                return (
                  <div key={idx} className={`${colorClass} ${bgClass} px-2 py-0.5 rounded`}>
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>

          {/* Reproduction code */}
          <div className="bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#418fff]">science</span>
                <h3 className="font-headline-sm text-[#dae3ee] font-semibold">
                  Reproduction Test Artifact (repro_fl104_test.py)
                </h3>
              </div>
              <span className="font-code-sm text-[#8b919f]">Automated Sandbox Synthesis</span>
            </div>
            <pre className="font-code-sm text-[#dae3ee] bg-[#0b141c] p-4 rounded-lg border border-[#182028] overflow-x-auto leading-relaxed">
              {reproContent}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Timeline & Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-sm">
          <h2 className="font-headline-md text-[#dae3ee] font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#418fff]">schedule</span>
            <span>Forensic Event Timeline</span>
          </h2>

          <div className="relative border-l border-[#222b33] ml-4 flex flex-col gap-6 py-2">
            <div className="ml-6 relative">
              <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#ffb4ab] border-2 border-[#141c24]"></span>
              <span className="font-code-sm text-[#8b919f]">10:42:11 UTC</span>
              <h4 className="font-headline-sm text-[#dae3ee] font-medium">Production Ingress Fault (FL-104)</h4>
              <p className="font-body-md text-[#c1c6d6]">
                HTTP 500 triggered via POST /checkout with coupon SUMMER120 (120% discount).
              </p>
            </div>

            <div className="ml-6 relative">
              <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#418fff] border-2 border-[#141c24]"></span>
              <span className="font-code-sm text-[#8b919f]">10:42:14 UTC</span>
              <h4 className="font-headline-sm text-[#dae3ee] font-medium">Deterministic AST Mapping</h4>
              <p className="font-body-md text-[#c1c6d6]">
                Traceback mapped to services/coupon.py line 18. Call hierarchy and callers resolved.
              </p>
            </div>

            <div className="ml-6 relative">
              <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#418fff] border-2 border-[#141c24]"></span>
              <span className="font-code-sm text-[#8b919f]">10:42:18 UTC</span>
              <h4 className="font-headline-sm text-[#dae3ee] font-medium">Hermetic Sandbox Reproduction</h4>
              <p className="font-body-md text-[#c1c6d6]">
                Generated isolated reproduction test. Executed in scratchpad, verifying ValueError crash.
              </p>
            </div>

            <div className="ml-6 relative">
              <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#d5bbff] border-2 border-[#141c24]"></span>
              <span className="font-code-sm text-[#8b919f]">10:42:24 UTC</span>
              <h4 className="font-headline-sm text-[#dae3ee] font-medium">AI Fix Synthesis</h4>
              <p className="font-body-md text-[#c1c6d6]">
                Synthesized unified diff clamping discounts between 0.0% and 100.0% with defensive floor.
              </p>
            </div>

            <div className="ml-6 relative">
              <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#67df70] border-2 border-[#141c24]"></span>
              <span className="font-code-sm text-[#8b919f]">10:42:30 UTC</span>
              <h4 className="font-headline-sm text-[#dae3ee] font-medium">Developer Approval</h4>
              <p className="font-body-md text-[#c1c6d6]">
                Engineer verified mathematical bounds and approved patch application to temporary branch.
              </p>
            </div>

            <div className="ml-6 relative">
              <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#67df70] border-2 border-[#141c24]"></span>
              <span className="font-code-sm text-[#8b919f]">10:42:36 UTC</span>
              <h4 className="font-headline-sm text-[#dae3ee] font-medium">Dual-Run Sandbox Verification Passed</h4>
              <p className="font-body-md text-[#c1c6d6]">
                Full suite execution passed: 19/19 tests green, 0 regressions, clean exit status 0.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
