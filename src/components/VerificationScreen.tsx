import React, { useState } from 'react';
import { StepId, VerificationResult } from '../types';

interface VerificationScreenProps {
  onNavigate: (step: StepId) => void;
  verificationResult: VerificationResult | null;
  fixData?: any;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  onNavigate,
  verificationResult,
  fixData,
}) => {
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [patchDownloaded, setPatchDownloaded] = useState(false);

  const handleDownloadPatch = () => {
    const patchContent = `--- a/services/coupon.py
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
     return round(final_total, 2)
`;
    const blob = new Blob([fixData?.diff || patchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fixData?.affected_file ? `${fixData.affected_file.replace(/[\/\.]/g, '_')}_fix.patch` : 'verified_fix.patch';
    link.click();
    setPatchDownloaded(true);
    setTimeout(() => setPatchDownloaded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm uppercase tracking-wider text-[#67df70]">
              Step 8 of 9 // Deterministic Engine
            </span>
            <span className="w-1 h-1 rounded-full bg-[#8b919f]"></span>
            <span className="font-code-sm text-[#8b919f]">Sandbox Execution: #SBX-88219</span>
          </div>
          <h1 className="font-headline-xl text-[#dae3ee] tracking-tight">Verification</h1>
          <p className="font-body-md text-[#c1c6d6] max-w-2xl">
            Automated test suite validation following fix application on sandbox copy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-code-sm">
          <div className="flex items-center gap-1.5 bg-[#222b33] border border-[#2d363e] text-[#dae3ee] px-3 py-1 rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-[#418fff] text-[16px]">edit_document</span>
            <span>services/coupon.py</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#222b33] border border-[#2d363e] text-[#8b919f] px-3 py-1 rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-[16px]">commit</span>
            <span className="text-[#dae3ee]">4f8a2c1-patched</span>
          </div>
        </div>
      </div>

      {/* 4-Phase Stepper */}
      <div className="bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-[#222b33]/60 border border-[#2d363e] shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#27a640]/30 border border-[#27a640] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#67df70] text-[18px]">done</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Phase 1</span>
              <span className="font-headline-sm text-[#dae3ee] truncate">Reproduction</span>
              <span className="font-code-sm text-[#67df70]">Failure isolated</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-[#222b33]/60 border border-[#2d363e] shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#27a640]/30 border border-[#27a640] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#67df70] text-[18px]">done</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Phase 2</span>
              <span className="font-headline-sm text-[#dae3ee] truncate">Fix Applied</span>
              <span className="font-code-sm text-[#67df70]">AST patch verified</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-[#222b33]/60 border border-[#2d363e] shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#27a640]/30 border border-[#27a640] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#67df70] text-[18px]">done</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Phase 3</span>
              <span className="font-headline-sm text-[#dae3ee] truncate">Repro Test</span>
              <span className="font-code-sm text-[#67df70]">Now passing: 2/2</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-[#222b33] border border-[#67df70]/50 text-[#dae3ee] shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#27a640] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#002959] text-[18px]">done_all</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[#67df70] uppercase tracking-wider">Phase 4</span>
              <span className="font-headline-sm text-[#dae3ee] truncate">Full Test Suite</span>
              <span className="font-code-sm text-[#67df70] font-semibold">19/19 passing (100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Passed Certificate Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#141c24] border border-[#27a640]/40 p-6 shadow-md">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#27a640]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#27a640] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[#002959] text-[28px]">verified</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-label-md uppercase tracking-wider text-[#67df70] font-semibold">
                  Verification Passed
                </span>
                <span className="font-label-sm px-2 py-0.5 rounded bg-[#182028] text-[#67df70] border border-[#222b33]">
                  AST &amp; Pytest Engine Certified
                </span>
              </div>
              <p className="font-headline-sm text-[#dae3ee] mt-1">
                The approved fix resolves the reproduced failure (<span className="font-code-md text-[#418fff]">FL-104</span>) and all 19 tests in <span className="font-code-md text-[#dae3ee]">demo-shop</span> pass with 0 regressions.
              </p>
              <div className="flex items-center gap-2 mt-1 font-code-sm text-[#c1c6d6]">
                <span className="material-symbols-outlined text-[#67df70] text-[16px]">precision_manufacturing</span>
                <span>Outcome determined by local sandboxed pytest runner (PID 84192), not AI estimation.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-[#060f16]/80 border border-[#182028] px-6 py-3.5 rounded-xl">
            <div className="flex flex-col items-center">
              <span className="font-headline-xl text-[#67df70] leading-none font-semibold">100%</span>
              <span className="font-label-sm text-[#8b919f] mt-1 uppercase">Green Pass</span>
            </div>
            <div className="w-px h-10 bg-[#222b33]"></div>
            <div className="flex flex-col items-center">
              <span className="font-headline-xl text-[#dae3ee] leading-none font-semibold">0</span>
              <span className="font-label-sm text-[#8b919f] mt-1 uppercase">Regressions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Before vs After Test Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Baseline Before */}
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
                <span className="font-label-md uppercase tracking-wider text-[#8b919f]">Card 1 // Baseline Run</span>
              </div>
              <span className="font-code-sm bg-[#222b33] text-[#8b919f] px-2.5 py-0.5 rounded border border-[#2d363e]">
                Pre-Patch (master)
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-md text-[#dae3ee] font-semibold">BEFORE FIX</span>
              <span className="font-code-md text-[#ffb4ab]">3 Failing Tests</span>
            </div>
            <div className="w-full bg-[#222b33] h-3 rounded-full overflow-hidden flex my-2">
              <div className="bg-[#27a640]" style={{ width: '83.33%' }}></div>
              <div className="bg-[#93000a]" style={{ width: '16.67%' }}></div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-[#182028] border border-[#222b33] p-3 rounded-lg flex flex-col">
                <span className="font-label-sm text-[#8b919f]">Total Tests</span>
                <span className="font-headline-sm text-[#dae3ee] font-semibold mt-0.5">18</span>
                <span className="font-code-sm text-[#8b919f] mt-0.5">Baseline set</span>
              </div>
              <div className="bg-[#182028] border border-[#222b33] p-3 rounded-lg flex flex-col">
                <span className="font-label-sm text-[#8b919f]">Passing</span>
                <span className="font-headline-sm text-[#67df70] font-semibold mt-0.5">15</span>
                <span className="font-code-sm text-[#67df70] mt-0.5">83.3% success</span>
              </div>
              <div className="bg-[#182028] border border-[#222b33] p-3 rounded-lg flex flex-col">
                <span className="font-label-sm text-[#8b919f]">Failing</span>
                <span className="font-headline-sm text-[#ffb4ab] font-semibold mt-0.5">3</span>
                <span className="font-code-sm text-[#ffb4ab] mt-0.5">16.7% failure</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-2 bg-[#060f16]/50 p-2.5 rounded-lg flex items-center justify-between border border-[#182028]">
            <span className="font-code-sm text-[#8b919f]">Unresolved Regression Risks:</span>
            <span className="font-code-sm text-[#8b919f]">N/A (Pre-patch state)</span>
          </div>
        </div>

        {/* Card 2: Verification Run After */}
        <div className="bg-[#141c24] border border-[#27a640]/30 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
                <span className="font-label-md uppercase tracking-wider text-[#67df70]">Card 2 // Verification Run</span>
              </div>
              <span className="font-code-sm bg-[#222b33] text-[#67df70] px-2.5 py-0.5 rounded font-medium border border-[#2d363e]">
                Patch Verified Clean
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-md text-[#dae3ee] font-semibold">AFTER FIX</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#67df70] text-[18px]">verified</span>
                <span className="font-code-md text-[#67df70] font-semibold">0 Failing Tests</span>
              </div>
            </div>
            <div className="w-full bg-[#222b33] h-3 rounded-full overflow-hidden flex my-2">
              <div className="bg-[#27a640] h-full w-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-[#182028] border border-[#222b33] p-3 rounded-lg flex flex-col">
                <span className="font-label-sm text-[#8b919f]">Total Tests</span>
                <span className="font-headline-sm text-[#dae3ee] font-semibold mt-0.5">19</span>
                <span className="font-code-sm text-[#418fff] mt-0.5">+1 repro test</span>
              </div>
              <div className="bg-[#182028] border border-[#222b33] p-3 rounded-lg flex flex-col">
                <span className="font-label-sm text-[#8b919f]">Passing</span>
                <span className="font-headline-sm text-[#67df70] font-semibold mt-0.5">19</span>
                <span className="font-code-sm text-[#67df70] mt-0.5">100.0% clean</span>
              </div>
              <div className="bg-[#182028] border border-[#222b33] p-3 rounded-lg flex flex-col">
                <span className="font-label-sm text-[#8b919f]">Failing</span>
                <span className="font-headline-sm text-[#67df70] font-semibold mt-0.5">0</span>
                <span className="font-code-sm text-[#8b919f] mt-0.5">Clean state</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-2 bg-[#060f16]/50 p-2.5 rounded-lg flex items-center justify-between border border-[#182028]">
            <span className="font-code-sm text-[#8b919f]">Regressions detected:</span>
            <span className="font-code-sm text-[#67df70] font-semibold">0 (Zero collateral damage)</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Tests Added</span>
            <span className="material-symbols-outlined text-[#418fff] text-[18px]">add_box</span>
          </div>
          <div className="my-2">
            <span className="font-headline-lg text-[#dae3ee] font-semibold">1</span>
          </div>
          <div className="bg-[#182028] border border-[#222b33] p-1.5 rounded font-code-sm text-[#c1c6d6] truncate">
            tests/repro_fl104_test.py
          </div>
        </div>

        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Tests Fixed</span>
            <span className="material-symbols-outlined text-[#67df70] text-[18px]">build_circle</span>
          </div>
          <div className="my-2">
            <span className="font-headline-lg text-[#67df70] font-semibold">1</span>
          </div>
          <div className="bg-[#182028] border border-[#222b33] p-1.5 rounded font-code-sm text-[#c1c6d6] truncate">
            test_coupon.py::test_percentage
          </div>
        </div>

        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Regression Rate</span>
            <span className="material-symbols-outlined text-[#67df70] text-[18px]">security</span>
          </div>
          <div className="my-2">
            <span className="font-headline-lg text-[#67df70] font-semibold">0.0%</span>
          </div>
          <div className="font-code-sm text-[#8b919f]">All legacy specs intact</div>
        </div>

        <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Suite Runtime</span>
            <span className="material-symbols-outlined text-[#8b919f] text-[18px]">speed</span>
          </div>
          <div className="my-2">
            <span className="font-headline-lg text-[#dae3ee] font-semibold">1.18s</span>
          </div>
          <div className="font-code-sm text-[#8b919f] truncate">Executed in sandboxed chroot</div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-[#060f16] border border-[#182028] rounded-xl shadow-md overflow-hidden flex flex-col">
        <div className="bg-[#141c24] border-b border-[#182028] px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#93000a]"></span>
              <span className="w-3 h-3 rounded-full bg-[#2d363e]"></span>
              <span className="w-3 h-3 rounded-full bg-[#27a640]"></span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="material-symbols-outlined text-[#8b919f] text-[16px]">terminal</span>
              <span className="font-code-sm text-[#dae3ee] font-semibold">
                pytest stdout — /tmp/tb_sandbox_0x4f8/demo-shop
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-code-sm text-[#67df70] bg-[#182028] px-2 py-0.5 rounded border border-[#222b33]">
              exit: 0
            </span>
            <button
              onClick={() => setConsoleCollapsed(!consoleCollapsed)}
              className="flex items-center gap-1 text-[#8b919f] hover:text-[#dae3ee] font-code-sm"
            >
              <span>{consoleCollapsed ? 'Expand' : 'Collapse'}</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform ${consoleCollapsed ? 'rotate-180' : ''}`}>
                expand_less
              </span>
            </button>
          </div>
        </div>

        {!consoleCollapsed && (
          <div className="p-4 font-code-sm overflow-x-auto leading-relaxed text-[#dae3ee] space-y-1">
            <div className="text-[#8b919f]">============================= test session starts ==============================</div>
            <div className="text-[#c1c6d6]">platform linux -- Python 3.11.8, pytest-8.1.1, pluggy-1.4.0</div>
            <div className="text-[#8b919f]">rootdir: /tmp/tb_sandbox_0x4f8/demo-shop</div>
            <div className="text-[#c1c6d6] mb-2">collected 19 items</div>

            <div className="flex justify-between items-center py-0.5 hover:bg-[#141c24] px-1 rounded">
              <span>tests/test_checkout.py <span className="text-[#67df70] font-semibold">....</span></span>
              <span className="text-[#8b919f]">[ 21%]</span>
            </div>
            <div className="flex justify-between items-center py-0.5 hover:bg-[#141c24] px-1 rounded">
              <span>tests/test_coupon.py <span className="text-[#67df70] font-semibold">....</span></span>
              <span className="text-[#8b919f]">[ 42%]</span>
            </div>
            <div className="flex justify-between items-center py-0.5 hover:bg-[#141c24] px-1 rounded">
              <span>tests/test_models.py <span className="text-[#67df70] font-semibold">...</span></span>
              <span className="text-[#8b919f]">[ 57%]</span>
            </div>
            <div className="flex justify-between items-center py-0.5 hover:bg-[#141c24] px-1 rounded">
              <span>tests/test_payment.py <span className="text-[#67df70] font-semibold">....</span></span>
              <span className="text-[#8b919f]">[ 78%]</span>
            </div>
            <div className="flex justify-between items-center py-0.5 bg-[#141c24] border border-[#222b33] px-1.5 rounded">
              <span className="text-[#418fff]">tests/repro_fl104_test.py <span className="text-[#67df70] font-semibold">..</span> <span className="text-[#8b919f] text-[10px] uppercase">(newly generated test)</span></span>
              <span className="text-[#8b919f]">[ 89%]</span>
            </div>
            <div className="flex justify-between items-center py-0.5 hover:bg-[#141c24] px-1 rounded">
              <span>tests/test_tax.py <span className="text-[#67df70] font-semibold">..</span></span>
              <span className="text-[#8b919f]">[100%]</span>
            </div>

            <div className="text-[#67df70] font-semibold mt-2">============================== 19 passed in 1.18s ==============================</div>
            <div className="flex items-center gap-2 text-[#8b919f] mt-1">
              <span>Deterministic verification code:</span>
              <span className="text-[#dae3ee] bg-[#141c24] border border-[#222b33] px-2 py-0.5 rounded font-mono">
                sha256:7c9e01f28b4923e4...
              </span>
              <span className="text-[#67df70] font-semibold">[VERIFIED PASS]</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={handleDownloadPatch}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#222b33] text-[#dae3ee] hover:bg-[#2d363e] border border-[#2d363e] px-4 py-2.5 rounded-lg shadow-sm transition-colors font-code-sm"
        >
          <span className="material-symbols-outlined text-[18px]">
            {patchDownloaded ? 'check' : 'file_download'}
          </span>
          <span>{patchDownloaded ? 'Patch Downloaded (4f8a2c1.patch)' : 'Download Git Patch (.patch)'}</span>
        </button>

        <button
          onClick={() => onNavigate('report')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#418fff] text-[#002959] hover:bg-[#aac7ff] px-6 py-2.5 rounded-lg shadow-md transition-all font-headline-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">assignment</span>
          <span>Generate Investigation Report</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
