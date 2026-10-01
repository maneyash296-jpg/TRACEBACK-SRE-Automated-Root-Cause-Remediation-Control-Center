import React, { useState } from 'react';
import { StepId } from '../types';

interface TestLabScreenProps {
  onNavigate: (step: StepId) => void;
  onRunRepro: () => Promise<void>;
  isReproducing: boolean;
}

export const TestLabScreen: React.FC<TestLabScreenProps> = ({
  onNavigate,
  onRunRepro,
  isReproducing,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExecutingScratch, setIsExecutingScratch] = useState(false);
  const [scratchOutput, setScratchOutput] = useState<{ exit_code: number; status: string; stdout: string; stderr: string; message: string } | null>(null);

  const defaultReproCode = `import unittest
from services.coupon import apply_discount

class TestReproductionFL104(unittest.TestCase):
    """
    TRACEBACK Reproduction Test for Failure FL-104.
    Simulates invalid ingress coupon rate (> 100%) to prove
    the unhandled ValueError crash condition.
    """
    def test_coupon_discount_exceeding_100_percent_raises_repro(self):
        order_total = 75.00
        invalid_discount = 120.0  # 120% discount coupon: SUMMER120
        
        # Assert that unpatched implementation crashes with ValueError
        with self.assertRaises(ValueError) as ctx:
            apply_discount(order_total=order_total, discount_percent=invalid_discount)
            
        self.assertIn("Order total cannot be negative", str(ctx.exception))

    def test_coupon_boundary_edge_cases(self):
        # Boundary checks: zero discount and valid percentage
        self.assertEqual(apply_discount(100.0, 0.0), 100.0)
        self.assertEqual(apply_discount(100.0, 10.0), 90.0)

if __name__ == "__main__":
    unittest.main()`;

  const [reproCode, setReproCode] = useState(defaultReproCode);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(reproCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunScratchLive = async () => {
    setIsExecutingScratch(true);
    try {
      const res = await fetch('/api/test-lab/execute-scratch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: reproCode }),
      });
      const data = await res.json();
      setScratchOutput(data);
    } catch (err: any) {
      setScratchOutput({
        exit_code: 1,
        status: 'FAILED',
        stdout: '',
        stderr: err.message,
        message: 'Sandbox scratch execution error',
      });
    } finally {
      setIsExecutingScratch(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Viewport Control & Context Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-md">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">
              Stage 06 // Isolation Lab
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse"></span>
            <div className="bg-[#93000a] text-[#ffdad6] px-2.5 py-0.5 rounded font-label-md font-semibold tracking-wide flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[14px]">crisis_alert</span>
              STATUS: FAILURE REPRODUCED (1/1)
            </div>
          </div>
          <h1 className="font-headline-lg text-[#dae3ee] tracking-tight">Test Lab</h1>
          <p className="font-body-md text-[#c1c6d6] max-w-2xl">
            Synthesize an automated reproduction test to isolate Failure{' '}
            <span className="font-code-md text-[#ffb4ab] font-medium">#FL-104</span> in an execution sandbox.
          </p>
        </div>

        {/* Telemetry Snapshot Dial */}
        <div className="flex items-center gap-4 bg-[#060f16] border border-[#182028] p-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 pl-1">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#222b33]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-[#ffb4ab]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="100, 100"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute font-code-sm font-semibold text-[#ffb4ab]">100%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Incident Match</span>
              <span className="font-code-sm text-[#dae3ee] font-medium">Deterministic AST</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#182028]"></div>
          <div className="flex flex-col pr-2">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Sandbox Isolation</span>
            <span className="font-code-sm text-[#67df70] flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#67df70]"></span> chroot verified
            </span>
          </div>
        </div>
      </div>

      {/* Operational Sandbox Control Strip */}
      <div className="bg-[#182028] border border-[#222b33] rounded-xl p-2.5 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 bg-[#141c24] px-3 py-1 rounded-lg text-[#dae3ee] border border-[#222b33]">
            <span className="material-symbols-outlined text-[#d5bbff] text-[16px]">description</span>
            <span className="font-label-sm text-[#8b919f]">TARGET:</span>
            <span className="font-code-sm font-medium text-[#418fff]">tests/repro_fl104_test.py</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#141c24] px-3 py-1 rounded-lg text-[#c1c6d6] border border-[#222b33]">
            <span className="material-symbols-outlined text-[#67df70] text-[16px]">memory</span>
            <span className="font-label-sm text-[#8b919f]">ENGINE:</span>
            <span className="font-code-sm text-[#dae3ee]">pytest 8.1.1 [Python 3.11.8 - Isolated chroot]</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyCode}
            className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] font-code-sm px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedCode ? 'done' : 'content_copy'}
            </span>
            <span>{copiedCode ? 'Copied!' : 'Copy Pytest Code'}</span>
          </button>
          <button
            onClick={onRunRepro}
            disabled={isReproducing}
            className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-code-sm font-semibold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
          >
            <span className={`material-symbols-outlined text-[16px] ${isReproducing ? 'animate-spin' : ''}`}>
              play_arrow
            </span>
            <span>{isReproducing ? 'Running Sandbox...' : 'Run Test (Rerun)'}</span>
          </button>
        </div>
      </div>

      {/* Main Workbench Split Screen (Code Editor vs Sandboxed Execution Terminal) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 items-stretch">
        {/* LEFT SIDE: IDE Code Editor (7 cols) */}
        <div className="xl:col-span-7 flex flex-col bg-[#060f16] border border-[#182028] rounded-xl overflow-hidden shadow-lg">
          <div className="bg-[#141c24] border-b border-[#182028] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 mr-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2d363e]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#2d363e]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#2d363e]"></span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#060f16] px-3 py-1 rounded-t-md text-[#dae3ee] border-t border-x border-[#182028]">
                <span className="material-symbols-outlined text-[#418fff] text-[14px]">code</span>
                <span className="font-code-sm font-medium">tests/repro_fl104_test.py</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#418fff] ml-1"></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`text-xs px-2.5 py-1 rounded font-code-sm flex items-center gap-1 transition-colors ${
                  isEditing ? 'bg-[#418fff] text-[#002959] font-semibold' : 'bg-[#222b33] text-[#dae3ee] hover:bg-[#2d363e]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isEditing ? 'visibility' : 'edit'}
                </span>
                <span>{isEditing ? 'View Mode' : 'Edit Scratchpad'}</span>
              </button>

              <button
                onClick={handleRunScratchLive}
                disabled={isExecutingScratch}
                className="text-xs px-2.5 py-1 rounded bg-[#27a640]/30 hover:bg-[#27a640]/50 text-[#67df70] border border-[#27a640]/40 font-code-sm flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isExecutingScratch ? 'sync' : 'play_arrow'}
                </span>
                <span>{isExecutingScratch ? 'Executing...' : 'Run in Sandbox'}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 font-code-md overflow-x-auto leading-relaxed select-text bg-[#060f16]">
            {isEditing ? (
              <textarea
                value={reproCode}
                onChange={(e) => setReproCode(e.target.value)}
                className="w-full h-80 bg-transparent text-[#dae3ee] font-mono text-sm resize-none focus:outline-hidden leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <pre className="text-[#dae3ee]">
                <code>{reproCode}</code>
              </pre>
            )}
          </div>

          {scratchOutput && (
            <div className="bg-[#141c24] border-t border-[#182028] p-3 text-xs font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#8b919f]">Scratch Execution Status:</span>
                <span className={scratchOutput.exit_code === 0 ? 'text-[#67df70] font-bold' : 'text-[#ffb4ab] font-bold'}>
                  {scratchOutput.status} (exit {scratchOutput.exit_code})
                </span>
              </div>
              <div className="text-[#dae3ee]">{scratchOutput.message}</div>
              {scratchOutput.stderr && (
                <pre className="text-[#ffb4ab] text-[11px] mt-1 bg-[#060f16] p-2 rounded max-h-24 overflow-y-auto">
                  {scratchOutput.stderr}
                </pre>
              )}
            </div>
          )}

          <div className="bg-[#141c24] border-t border-[#182028] px-4 py-1.5 flex items-center justify-between text-[#8b919f] font-code-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-[#dae3ee]">
                <span className="material-symbols-outlined text-[14px] text-[#67df70]">check</span>
                Synthesized: Validated AST
              </span>
              <span>UTF-8</span>
              <span>Python</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Ln 18, Col 9</span>
              <span className="bg-[#222b33] px-1.5 py-0.5 rounded text-[#dae3ee]">Spaces: 4</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Execution Result & Sandboxed Runner Terminal (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Failure Reproduction Callout Box */}
          <div className="bg-[#141c24] border border-[#182028] rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ffb4ab]"></div>
            <div className="flex items-start justify-between gap-2 mb-3 pl-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">warning</span>
                <span className="font-headline-sm font-semibold text-[#ffb4ab] tracking-tight">
                  FAILURE REPRODUCED IN SANDBOX
                </span>
              </div>
              <span className="font-label-sm bg-[#93000a] text-[#ffdad6] px-2 py-0.5 rounded uppercase font-semibold">
                Verified Proof
              </span>
            </div>

            <div className="space-y-1.5 pl-1 mb-4">
              <div className="flex items-center justify-between py-1 bg-[#060f16] px-3 rounded border border-[#182028]">
                <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Exit Status</span>
                <span className="font-code-sm font-semibold text-[#ffb4ab]">
                  pytest exit 1 (Expected Failure Captured)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 bg-[#060f16] px-3 rounded border border-[#182028]">
                <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Captured Exception</span>
                <span className="font-code-sm text-[#ffb4ab] bg-[#93000a]/40 px-1.5 rounded font-medium">
                  ValueError: -$15.00
                </span>
              </div>
              <div className="flex items-center justify-between py-1 bg-[#060f16] px-3 rounded border border-[#182028]">
                <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">Incident Fidelity</span>
                <span className="font-code-sm text-[#67df70] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  100% Signature Match (FL-104)
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#182028] border border-[#222b33] rounded-lg text-[#dae3ee] font-body-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[#418fff] text-[18px] shrink-0 mt-0.5">
                shield_with_heart
              </span>
              <p className="text-[#c1c6d6]">
                The generated reproduction test successfully triggered the exact production stack trace.
                Root cause hypothesis is experimentally confirmed (RED state achieved).
              </p>
            </div>
          </div>

          {/* Sandboxed Terminal Output Panel */}
          <div className="flex-1 flex flex-col bg-[#060f16] border border-[#182028] rounded-xl overflow-hidden shadow-md">
            <div className="bg-[#141c24] border-b border-[#182028] px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#8b919f]">terminal</span>
                <span className="font-code-sm text-[#dae3ee] font-semibold tracking-wide">
                  SANDBOX LOG // STDOUT + STDERR
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-code-sm text-[#67df70]">0.04s elapsed</span>
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
              </div>
            </div>

            <div className="flex-1 p-4 font-code-sm text-[#dae3ee] overflow-x-auto leading-relaxed select-text space-y-1">
              <div className="text-[#8b919f]">============================= test session starts ==============================</div>
              <div className="text-[#c1c6d6]">platform linux -- Python 3.11.8, pytest-8.1.1, pluggy-1.4.0</div>
              <div className="text-[#8b919f]">rootdir: /tmp/tb_sandbox_0x4f8/demo-shop</div>
              <div className="text-[#c1c6d6]">collected 2 items</div>
              <div className="py-1"></div>
              <div className="flex items-center justify-between">
                <span>tests/repro_fl104_test.py::test_coupon_discount_exceeding_100_percent_raises_repro</span>
                <span className="text-[#ffb4ab] font-semibold uppercase">FAILED [ 50%]</span>
              </div>
              <div className="flex items-center justify-between">
                <span>tests/repro_fl104_test.py::test_coupon_boundary_edge_cases</span>
                <span className="text-[#67df70] font-semibold uppercase">PASSED [100%]</span>
              </div>
              <div className="py-1"></div>
              <div className="text-[#ffb4ab] font-semibold">=================================== FAILURES ===================================</div>
              <div className="text-[#ffb4ab]">________________ test_coupon_discount_exceeding_100_percent __________________</div>
              <div className="text-[#8b919f] pl-4">    def apply_discount(order_total: float, discount_percent: float):</div>
              <div className="bg-[#93000a]/20 text-[#ffdad6] px-2 py-0.5 rounded">
                &gt;       raise ValueError(f"Order total cannot be negative: ${'{'}final_total:.2f{'}'}")
              </div>
              <div className="text-[#ffb4ab] font-semibold pl-4">
                E       ValueError: Order total cannot be negative: -$15.00
              </div>
              <div className="text-[#8b919f] pl-4">services/coupon.py:18: ValueError</div>
              <div className="text-[#ffb4ab] font-semibold pt-1">=========================== 1 failed, 1 passed in 0.04s ===========================</div>
            </div>

            <div className="bg-[#141c24] border-t border-[#182028] px-4 py-1.5 flex items-center justify-between text-[#8b919f] font-code-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-[#418fff] font-bold">&gt;</span>
                <span className="text-[#c1c6d6]">sandbox-worker: exit code 1 acknowledged</span>
              </div>
              <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">
                Pytest Session ID: #0x4f8-e9
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center text-[#418fff] shrink-0">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-[#dae3ee] font-semibold">
              Failure reproduction confirmed.
            </span>
            <span className="font-body-md text-[#c1c6d6]">
              You can now generate and preview a minimal fix diff synthesized directly against the failing AST branch.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => onNavigate('investigation')}
            className="px-4 py-2 rounded-lg bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] font-code-sm transition-colors"
          >
            Back to Investigation
          </button>
          <button
            onClick={() => onNavigate('proposed-fix')}
            className="px-5 py-2.5 rounded-lg bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-code-sm font-semibold flex items-center gap-2 transition-colors shadow-md"
          >
            <span>Propose Fix &amp; Review Diff</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
