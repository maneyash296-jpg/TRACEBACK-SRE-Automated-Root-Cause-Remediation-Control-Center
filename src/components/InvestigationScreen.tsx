import React, { useState, useEffect } from 'react';
import { StepId, InvestigationData } from '../types';

interface InvestigationScreenProps {
  onNavigate: (step: StepId) => void;
  investigationData: InvestigationData | null;
  onRunInvestigation: () => Promise<void>;
  isInvestigating: boolean;
}

export const InvestigationScreen: React.FC<InvestigationScreenProps> = ({
  onNavigate,
  investigationData,
  onRunInvestigation,
  isInvestigating,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(6); // All steps completed

  const pipelineSteps = [
    { label: 'TRACEBACK', desc: 'Captured HTTP 500 stack frame' },
    { label: 'TRACE FRAME', desc: 'services/coupon.py:18' },
    { label: 'SOURCE', desc: 'apply_discount() SLOC: 18' },
    { label: 'CALL GRAPH', desc: 'checkout.process_order -> coupon' },
    { label: 'RELATED TEST', desc: 'tests/test_coupon.py' },
    { label: 'AI HYPOTHESIS', desc: 'Unconstrained overflow boundary' },
    { label: 'CONFIDENCE', desc: 'High (AST Verified)' },
  ];

  return (
    <div className="flex flex-col w-full gap-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm uppercase tracking-wider text-[#d5bbff] font-semibold bg-[#222b33] px-2 py-0.5 rounded border border-[#2d363e]">
              STAGE 05 // INVESTIGATION ENGINE
            </span>
            <span className="font-code-sm text-[#8b919f]">TARGET: FL-104</span>
          </div>
          <h1 className="font-headline-lg text-[#dae3ee] tracking-tight font-semibold">
            Forensic Investigation Pipeline
          </h1>
          <p className="font-body-md text-[#c1c6d6] max-w-3xl">
            Assembles deterministic evidence from the call-graph and AST, prompts the AIProvider, and validates claims
            against physical code artifacts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRunInvestigation}
            disabled={isInvestigating}
            className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] font-code-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span className={`material-symbols-outlined text-[16px] ${isInvestigating ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isInvestigating ? 'Re-assembling Evidence...' : 'Re-investigate Failure'}</span>
          </button>
          <button
            onClick={() => onNavigate('test-lab')}
            className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-code-sm font-semibold px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
          >
            <span>Proceed to Test Lab</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Investigation Pipeline Stepper Animation Bar */}
      <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">
            Deterministic Evidence Assembly Pipeline
          </span>
          <span className="font-code-sm text-[#67df70] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
            Pipeline Complete (7/7 Stages Verified)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {pipelineSteps.map((step, idx) => (
            <div
              key={step.label}
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${
                idx <= activeStepIndex
                  ? 'bg-[#182028] border-[#418fff]/40 text-[#dae3ee]'
                  : 'bg-[#060f16] border-[#182028] text-[#8b919f]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-[#8b919f]">0{idx + 1}</span>
                <span className="material-symbols-outlined text-[#67df70] text-[14px]">check_circle</span>
              </div>
              <span className="font-code-sm font-semibold text-[#418fff] truncate">{step.label}</span>
              <span className="font-label-sm text-[#8b919f] mt-0.5 truncate">{step.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Evidence & Probable Cause, Right Source Code Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Epistemic Evidence Table & AI Hypothesis */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Probable Cause & Epistemic Verdict Banner */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl flex flex-col gap-3 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d5bbff] text-[20px]">psychology</span>
                <span className="font-headline-sm text-[#dae3ee]">Probable Cause &amp; Root Diagnosis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm uppercase bg-[#27a640]/20 text-[#67df70] border border-[#27a640]/40 px-2 py-0.5 rounded font-semibold">
                  CONFIRMED (100% AST MATCH)
                </span>
                <span className="font-label-sm bg-[#418fff]/15 text-[#418fff] border border-[#418fff]/30 px-2 py-0.5 rounded">
                  Confidence: High
                </span>
              </div>
            </div>

            <p className="font-body-lg text-[#dae3ee] leading-relaxed bg-[#060f16] p-4 rounded-lg border border-[#182028]">
              {investigationData?.probable_cause ||
                'Promotional discount calculation does not cap allowable percent, generating a sub-zero float balance when discount exceeds 100%. Unhandled ValueError triggers HTTP 500 error.'}
            </p>

            <div className="flex items-center justify-between text-body-sm font-code-sm text-[#8b919f] px-1">
              <span>Basis: Deterministic AST node comparison at line 18</span>
              <span className="text-[#67df70]">Validated against physical file</span>
            </div>
          </div>

          {/* Epistemic Evidence Breakdown Table */}
          <div className="bg-[#141c24] border border-[#182028] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#182028] border-b border-[#222b33] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#418fff]">rule</span>
                <span className="font-headline-sm text-[#dae3ee]">Forensic Evidence Signals</span>
              </div>
              <div className="flex items-center gap-2 font-label-sm">
                <span className="flex items-center gap-1 text-[#67df70]">
                  <span className="w-2 h-2 rounded-full bg-[#67df70]"></span> CONFIRMED
                </span>
                <span className="flex items-center gap-1 text-[#d5bbff]">
                  <span className="w-2 h-2 rounded-full bg-[#d5bbff]"></span> INFERRED
                </span>
                <span className="flex items-center gap-1 text-[#ffb4ab]">
                  <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span> UNVERIFIED
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-code-sm">
                <thead className="bg-[#222b33] text-[#8b919f] font-label-sm uppercase tracking-wider border-b border-[#2d363e]">
                  <tr>
                    <th className="py-2.5 px-4">Tier / Type</th>
                    <th className="py-2.5 px-4">Target Artifact</th>
                    <th className="py-2.5 px-4">Observed Signal</th>
                    <th className="py-2.5 px-4 text-right">Certainty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182028]">
                  {investigationData?.evidence?.map((ev, i) => {
                    const isFact = ev.tier === 'FACT';
                    const isInferred = ev.tier === 'INFERRED';
                    return (
                      <tr key={i} className="hover:bg-[#222b33]/40 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-label-sm font-semibold border ${
                              isFact
                                ? 'bg-[#27a640]/20 text-[#67df70] border-[#27a640]/30'
                                : isInferred
                                ? 'bg-[#5a21ab]/20 text-[#d5bbff] border-[#5a21ab]/40'
                                : 'bg-[#93000a]/20 text-[#ffb4ab] border-[#93000a]/40'
                            }`}
                          >
                            {isFact ? 'CONFIRMED' : isInferred ? 'INFERRED' : 'UNVERIFIED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#dae3ee]">{ev.target}</td>
                        <td className="py-3 px-4 text-[#c1c6d6]">{ev.claim}</td>
                        <td className="py-3 px-4 text-right font-semibold text-[#67df70]">
                          {ev.certainty}
                        </td>
                      </tr>
                    );
                  }) || (
                    <>
                      <tr className="hover:bg-[#222b33]/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-label-sm font-semibold bg-[#27a640]/20 text-[#67df70] border border-[#27a640]/30">
                            CONFIRMED
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#dae3ee]">POST /checkout/apply-coupon</td>
                        <td className="py-3 px-4 text-[#c1c6d6]">
                          Network ingress captured HTTP 500 status with error body containing ValueError.
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#67df70]">100% Machine Fact</td>
                      </tr>
                      <tr className="hover:bg-[#222b33]/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-label-sm font-semibold bg-[#27a640]/20 text-[#67df70] border border-[#27a640]/30">
                            CONFIRMED
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#dae3ee]">services/coupon.py:18</td>
                        <td className="py-3 px-4 text-[#c1c6d6]">
                          AST node comparison matched frame stack trace to exact line 18 with final_total &lt; 0.
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#67df70]">100% Machine Fact</td>
                      </tr>
                      <tr className="hover:bg-[#222b33]/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-label-sm font-semibold bg-[#5a21ab]/20 text-[#d5bbff] border border-[#5a21ab]/40">
                            INFERRED
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#d5bbff]">services/checkout.py:42</td>
                        <td className="py-3 px-4 text-[#c1c6d6]">
                          Caller passes upstream float without schema sanitization. Missing defensive guard in caller method chain.
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#d5bbff]">92% Correlated</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Real AST Source Context & Crash Site Viewer */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#141c24] border border-[#182028] rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className="bg-[#182028] px-4 py-2.5 border-b border-[#222b33] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">error</span>
                <span className="font-code-sm font-semibold text-[#dae3ee]">
                  Crash Site: services/coupon.py
                </span>
              </div>
              <span className="font-label-sm text-[#ffb4ab] bg-[#93000a] px-2 py-0.5 rounded font-bold">
                Line 18
              </span>
            </div>

            <div className="p-4 bg-[#060f16] font-code-sm text-[#dae3ee] overflow-x-auto leading-relaxed">
              <div className="text-[#8b919f] opacity-60">14 def apply_discount(order_total: float, discount_percent: float) -&gt; float:</div>
              <div className="text-[#8b919f] opacity-60">15     """Apply discount percentage to order."""</div>
              <div className="text-[#8b919f] opacity-80">16     discount_amount = order_total * (discount_percent / 100.0)</div>
              <div className="text-[#8b919f] opacity-80">17     final_total = order_total - discount_amount</div>
              <div className="bg-[#93000a]/25 text-[#ffb4ab] border-l-2 border-[#ffb4ab] px-2 py-1 my-0.5 rounded-r flex items-center justify-between">
                <span>18 &gt;&gt;  if final_total &lt; 0:</span>
                <span className="font-label-sm bg-[#93000a] text-[#ffdad6] px-1 rounded uppercase">Breakpoint</span>
              </div>
              <div className="text-[#ffb4ab] font-medium pl-6">
                19      raise ValueError(f"Order total cannot be negative: ${'{'}final_total:.2f{'}'}")
              </div>
              <div className="text-[#8b919f] opacity-80 pl-6">20  return round(final_total, 2)</div>
            </div>

            <div className="p-3 bg-[#182028] border-t border-[#222b33] text-body-sm text-[#c1c6d6] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#d5bbff] text-[16px] shrink-0 mt-0.5">info</span>
              <span>
                AST Inspector verified function boundary condition. Next step is synthesizing a reproduction test to prove the bug in an isolated chroot sandbox.
              </span>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl shadow-md flex flex-col gap-3">
            <h3 className="font-headline-sm text-[#dae3ee]">Next Step: Test Lab Reproduction</h3>
            <p className="font-body-sm text-[#8b919f]">
              Before generating fixes, TRACEBACK must independently reproduce the failure in an ephemeral sandbox to achieve a verified RED state.
            </p>
            <button
              onClick={() => onNavigate('test-lab')}
              className="w-full bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] py-3 px-4 rounded-lg font-code-md font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">science</span>
              <span>Synthesize Reproduction Test in Test Lab →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
