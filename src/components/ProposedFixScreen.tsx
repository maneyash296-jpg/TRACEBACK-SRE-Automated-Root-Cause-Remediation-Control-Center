import React, { useState, useMemo } from 'react';
import { StepId } from '../types';

interface ProposedFixScreenProps {
  onNavigate: (step: StepId) => void;
  onApproveAndVerify: () => Promise<void>;
  isApproving: boolean;
  fixData?: any;
}

interface SplitRow {
  isHunk?: boolean;
  hunkHeader?: string;
  leftLineNo?: number;
  leftText?: string;
  leftType?: 'delete' | 'context' | 'empty';
  rightLineNo?: number;
  rightText?: string;
  rightType?: 'add' | 'context' | 'empty';
}

interface UnifiedRow {
  isHunk?: boolean;
  hunkHeader?: string;
  origLineNo?: number;
  newLineNo?: number;
  type: 'add' | 'delete' | 'context';
  text: string;
}

function parseSplitDiff(diffStr: string): SplitRow[] {
  if (!diffStr) return [];
  const lines = diffStr.split('\n');
  const rows: SplitRow[] = [];

  let origLine = 1;
  let newLine = 1;
  let inHunk = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('---') || line.startsWith('+++')) continue;

    if (line.startsWith('@@')) {
      inHunk = true;
      const match = line.match(/@@\s*-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s*@@/);
      if (match) {
        origLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      rows.push({ isHunk: true, hunkHeader: line });
      continue;
    }

    if (!inHunk) continue;

    if (line.startsWith('-')) {
      let rightText: string | undefined = undefined;
      let rightNo: number | undefined = undefined;
      let hasAdd = false;

      if (i + 1 < lines.length && lines[i + 1].startsWith('+') && !lines[i + 1].startsWith('+++')) {
        rightText = lines[i + 1].substring(1);
        rightNo = newLine++;
        hasAdd = true;
        i++;
      }

      rows.push({
        leftLineNo: origLine++,
        leftText: line.substring(1),
        leftType: 'delete',
        rightLineNo: rightNo,
        rightText: rightText,
        rightType: hasAdd ? 'add' : 'empty',
      });
    } else if (line.startsWith('+')) {
      rows.push({
        leftType: 'empty',
        rightLineNo: newLine++,
        rightText: line.substring(1),
        rightType: 'add',
      });
    } else {
      const content = line.startsWith(' ') ? line.substring(1) : line;
      rows.push({
        leftLineNo: origLine++,
        leftText: content,
        leftType: 'context',
        rightLineNo: newLine++,
        rightText: content,
        rightType: 'context',
      });
    }
  }

  return rows;
}

function parseUnifiedDiff(diffStr: string): UnifiedRow[] {
  if (!diffStr) return [];
  const lines = diffStr.split('\n');
  const rows: UnifiedRow[] = [];

  let origLine = 1;
  let newLine = 1;
  let inHunk = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('---') || line.startsWith('+++')) continue;

    if (line.startsWith('@@')) {
      inHunk = true;
      const match = line.match(/@@\s*-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s*@@/);
      if (match) {
        origLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      rows.push({ isHunk: true, hunkHeader: line, type: 'context', text: line });
      continue;
    }

    if (!inHunk) continue;

    if (line.startsWith('-')) {
      rows.push({
        origLineNo: origLine++,
        type: 'delete',
        text: line.substring(1),
      });
    } else if (line.startsWith('+')) {
      rows.push({
        newLineNo: newLine++,
        type: 'add',
        text: line.substring(1),
      });
    } else {
      const content = line.startsWith(' ') ? line.substring(1) : line;
      rows.push({
        origLineNo: origLine++,
        newLineNo: newLine++,
        type: 'context',
        text: content,
      });
    }
  }

  return rows;
}

export const ProposedFixScreen: React.FC<ProposedFixScreenProps> = ({
  onNavigate,
  onApproveAndVerify,
  isApproving,
  fixData,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<'opt1' | 'opt2' | 'opt3'>('opt1');

  const diffOpt1 = fixData?.diff || `--- a/services/coupon.py
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

  const diffOpt2 = `--- a/services/coupon.py
+++ b/services/coupon.py
@@ -14,4 +14,8 @@ def apply_discount(order_total: float, discount_percent: float) -> float:
+    if not (0.0 <= discount_percent <= 100.0):
+        raise ValueError(f"Discount must be between 0.0 and 100.0%, received: {discount_percent}")
     discount_amount = order_total * (discount_percent / 100.0)
     final_total = order_total - discount_amount`;

  const diffOpt3 = `--- a/demo-shop/models.py
+++ b/demo-shop/models.py
@@ -10,3 +10,4 @@ class CouponRequest(BaseModel):
     code: str
-    discount_percent: float
+    discount_percent: float = Field(ge=0.0, le=100.0, description="Discount between 0 and 100%")`;

  const rawDiff = fixData?.diff ? fixData.diff : (selectedSuggestion === 'opt1' ? diffOpt1 : selectedSuggestion === 'opt2' ? diffOpt2 : diffOpt3);

  const addCount = useMemo(() => {
    return rawDiff.split('\n').filter((l: string) => l.startsWith('+') && !l.startsWith('+++')).length;
  }, [rawDiff]);

  const deleteCount = useMemo(() => {
    return rawDiff.split('\n').filter((l: string) => l.startsWith('-') && !l.startsWith('---')).length;
  }, [rawDiff]);

  const targetFileName = useMemo(() => {
    const match = rawDiff.match(/\+\+\+\s+b\/(.+)/);
    if (match) return match[1];
    return fixData?.file || 'services/coupon.py';
  }, [rawDiff, fixData]);

  const splitRows = useMemo(() => parseSplitDiff(rawDiff), [rawDiff]);
  const unifiedRows = useMemo(() => parseUnifiedDiff(rawDiff), [rawDiff]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(rawDiff);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-28">
      {/* Top Meta Context Bar & Sandbox Isolation Warning */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm uppercase tracking-wider text-[#d5bbff] px-2 py-0.5 rounded bg-[#222b33] border border-[#2d363e]">
                STAGE 07 // PATCH DEDUCTION
              </span>
              <span className="font-code-sm text-[#8b919f]">·</span>
              <span className="font-code-sm text-[#8b919f]">TARGET: {targetFileName}</span>
            </div>
            <h1 className="font-headline-xl text-[#dae3ee] tracking-tight">Proposed Fix Review</h1>
            <p className="font-body-md text-[#c1c6d6] max-w-3xl mt-0.5">
              Review line-level code diffs before applying changes to the sandboxed copy. Zero production files are touched.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#141c24] border border-[#182028] px-3.5 py-1.5 rounded-lg flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#d5bbff] animate-pulse"></span>
              <div className="flex flex-col">
                <span className="font-label-sm uppercase text-[#d5bbff]">AI DEDUCTION</span>
                <span className="font-code-sm text-[#dae3ee] font-medium">Confidence 98.4%</span>
              </div>
            </div>
            <div className="bg-[#141c24] border border-[#182028] px-3.5 py-1.5 rounded-lg flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#67df70] text-[18px]">verified_user</span>
              <div className="flex flex-col">
                <span className="font-label-sm uppercase text-[#8b919f]">SANDBOX STATE</span>
                <span className="font-code-sm text-[#dae3ee] font-medium">chroot: Isolated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Guarantee Notice Banner */}
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-4 flex items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#d5bbff] text-[20px]">shield_with_heart</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[#dae3ee] font-medium flex items-center gap-2">
                Sandbox Isolation Mode Active
                <span className="font-code-sm text-[#8b919f] font-normal hidden sm:inline">
                  (/tmp/traceback_sandbox/isolated-clone)
                </span>
              </span>
              <span className="font-body-sm text-[#c1c6d6]">
                Nothing has been changed in your original project directory. Changes will only apply to the ephemeral test clone.
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 bg-[#222b33] border border-[#2d363e] px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-[#67df70] text-[15px]">lock</span>
            <span className="font-label-sm uppercase text-[#8b919f]">Zero Prod Impact</span>
          </div>
        </div>
      </div>

      {/* AI Explanation, Change Scope & AST Overview Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Explanation Card (8 Cols) */}
        <div className="lg:col-span-8 bg-[#141c24] border border-[#182028] rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#182028]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#418fff] text-[20px]">auto_fix_high</span>
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">
                  Deterministic Remediation Rationale
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-code-sm bg-[#182028] px-2.5 py-0.5 rounded text-[#dae3ee] border border-[#222b33]">
                <span className="text-[#8b919f]">File:</span>
                <span className="text-[#418fff] font-medium">{targetFileName}</span>
              </div>
            </div>

            {/* Target Function Signature Capsule */}
            <div className="mt-3 bg-[#060f16] border border-[#182028] p-3 rounded-lg flex items-center justify-between font-code-sm">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[#d5bbff] font-medium">def</span>
                <span className="text-[#dae3ee] font-semibold">{fixData?.function || 'boundary_check'}</span>
                <span className="text-[#8b919f]">(...) -&gt; Verified State</span>
              </div>
              <span className="font-label-sm text-[#67df70] bg-[#182028] border border-[#222b33] px-2 py-0.5 rounded shrink-0">
                BOUNDARY PATCH
              </span>
            </div>

            {/* Scope Description */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#d5bbff] text-[18px] mt-0.5 shrink-0">psychology</span>
                <p className="font-body-md text-[#dae3ee] leading-relaxed">
                  {fixData?.explanation || 'Validate input constraints and boundary clamps early before performing arithmetic or state mutations. Guarantees safety bounds and zero unhandled exception regressions.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 font-code-sm text-[#8b919f] pl-6">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Scope: Function-level patch with defensive boundary validation (No breaking API changes)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#182028] flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-[#dae3ee]">
              <span className="material-symbols-outlined text-[#67df70] text-[16px]">check_circle</span>
              <span className="font-code-sm">Guards boundary errors</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#dae3ee]">
              <span className="material-symbols-outlined text-[#67df70] text-[16px]">check_circle</span>
              <span className="font-code-sm">Zero API breakages</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#dae3ee]">
              <span className="material-symbols-outlined text-[#67df70] text-[16px]">check_circle</span>
              <span className="font-code-sm">Guarantees math bounds</span>
            </div>
          </div>
        </div>

        {/* Right Impact Analysis Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-[#141c24] border border-[#182028] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#182028]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#418fff] text-[18px]">query_stats</span>
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Impact &amp; Safety Audit</span>
              </div>
              <span className="font-code-sm text-[#67df70] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#67df70]"></span>VERIFIED
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-3">
              <div className="bg-[#060f16] border border-[#182028] p-3 rounded-lg flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-body-sm text-[#c1c6d6]">Static AST Safety</span>
                  <span className="font-code-sm text-[#8b919f]">0 symbol breakages</span>
                </div>
                <span className="font-label-sm font-semibold text-[#67df70] bg-[#27a640]/20 px-2 py-0.5 rounded border border-[#27a640]/40">
                  Passed
                </span>
              </div>

              <div className="bg-[#060f16] border border-[#182028] p-3 rounded-lg flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-body-sm text-[#c1c6d6]">Cyclomatic Complexity</span>
                  <span className="font-code-sm text-[#8b919f]">Branches: +1 (Negligible)</span>
                </div>
                <div className="flex items-baseline gap-1 font-code-sm">
                  <span className="text-[#8b919f] line-through">4</span>
                  <span className="material-symbols-outlined text-[12px] text-[#8b919f]">arrow_forward</span>
                  <span className="text-[#418fff] font-semibold">5</span>
                </div>
              </div>

              <div className="bg-[#060f16] border border-[#182028] p-3 rounded-lg flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-body-sm text-[#c1c6d6]">API Contract</span>
                  <span className="font-code-sm text-[#8b919f]">Strict backward compatible</span>
                </div>
                <span className="font-code-sm font-semibold text-[#67df70] bg-[#182028] px-2 py-0.5 rounded border border-[#222b33]">
                  100%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between bg-[#182028] border border-[#222b33] p-3 rounded-lg">
            <div className="flex flex-col">
              <span className="font-label-sm uppercase text-[#8b919f]">Regression Risk</span>
              <span className="font-code-sm text-[#dae3ee] font-medium">&lt; 0.02% Estimated</span>
            </div>
            <svg className="w-24 h-6 text-[#67df70]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 100 24">
              <path d="M0 20 L20 18 L40 19 L60 8 L80 4 L100 2"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* AI Suggestion Strategy Selector */}
      <div className="bg-[#141c24] border border-[#182028] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#d5bbff] text-[18px]">auto_awesome</span>
          </div>
          <div>
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f] block">
              Remediation Options
            </span>
            <span className="font-headline-sm text-[#dae3ee] font-semibold">
              Select Proposed Fix Strategy
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedSuggestion('opt1')}
            className={`px-3 py-1.5 rounded-lg font-code-sm text-xs flex items-center gap-1.5 transition-all ${
              selectedSuggestion === 'opt1'
                ? 'bg-[#418fff] text-[#002959] font-semibold shadow-sm'
                : 'bg-[#182028] text-[#8b919f] hover:text-[#dae3ee] border border-[#222b33]'
            }`}
          >
            <span>Option 1: Clamping (Recommended)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#67df70]"></span>
          </button>
          <button
            onClick={() => setSelectedSuggestion('opt2')}
            className={`px-3 py-1.5 rounded-lg font-code-sm text-xs flex items-center gap-1.5 transition-all ${
              selectedSuggestion === 'opt2'
                ? 'bg-[#418fff] text-[#002959] font-semibold shadow-sm'
                : 'bg-[#182028] text-[#8b919f] hover:text-[#dae3ee] border border-[#222b33]'
            }`}
          >
            <span>Option 2: Strict Guard</span>
          </button>
          <button
            onClick={() => setSelectedSuggestion('opt3')}
            className={`px-3 py-1.5 rounded-lg font-code-sm text-xs flex items-center gap-1.5 transition-all ${
              selectedSuggestion === 'opt3'
                ? 'bg-[#418fff] text-[#002959] font-semibold shadow-sm'
                : 'bg-[#182028] text-[#8b919f] hover:text-[#dae3ee] border border-[#222b33]'
            }`}
          >
            <span>Option 3: Schema DTO</span>
          </button>
          <button
            onClick={() => onNavigate('suggestions')}
            className="px-2.5 py-1.5 rounded-lg font-code-sm text-xs bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#d5bbff] flex items-center gap-1 transition-colors"
            title="Browse all system suggestions"
          >
            <span>All Suggestions</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC VISUAL CODE DIFF VIEWER (SIDE-BY-SIDE SPLIT & UNIFIED) */}
      <div className="bg-[#141c24] border border-[#182028] rounded-xl overflow-hidden shadow-md flex flex-col">
        {/* Diff Tool Bar */}
        <div className="bg-[#182028] border-b border-[#222b33] px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-code-sm">
              <span className="material-symbols-outlined text-[#418fff] text-[18px]">difference</span>
              <span className="text-[#dae3ee] font-semibold">{targetFileName}</span>
              <span className="text-[#8b919f]">·</span>
              <span className="text-[#8b919f]">Side-by-Side Visual Diff Viewer</span>
            </div>
            <div className="flex items-center gap-1.5 font-label-sm">
              <span className="px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffdad6] font-medium border border-[#93000a]/80">
                -{deleteCount} lines
              </span>
              <span className="px-2 py-0.5 rounded bg-[#27a640]/30 text-[#67df70] font-medium border border-[#27a640]/50">
                +{addCount} lines
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('split')}
              className={`font-code-sm px-3 py-1 rounded flex items-center gap-1 transition-colors ${
                viewMode === 'split' ? 'bg-[#060f16] text-[#418fff] border border-[#222b33] font-semibold' : 'text-[#c1c6d6] hover:text-[#dae3ee]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">vertical_split</span>
              <span>Side-by-Side View</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`font-code-sm px-3 py-1 rounded flex items-center gap-1 transition-colors ${
                viewMode === 'unified' ? 'bg-[#060f16] text-[#418fff] border border-[#222b33] font-semibold' : 'text-[#c1c6d6] hover:text-[#dae3ee]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_stream</span>
              <span>Unified Stream</span>
            </button>
            <span className="text-[#8b919f] px-1">|</span>
            <button
              onClick={handleCopy}
              className="text-[#c1c6d6] hover:text-[#dae3ee] px-2 py-1 rounded bg-[#222b33] border border-[#2d363e] flex items-center gap-1 text-xs"
              title="Copy Raw Git Patch"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedPatch ? 'done' : 'content_copy'}
              </span>
              <span>{copiedPatch ? 'Copied' : 'Copy Patch'}</span>
            </button>
          </div>
        </div>

        {/* View Mode: Split Side-by-Side Comparison */}
        {viewMode === 'split' && (
          <div className="flex flex-col">
            {/* Side-by-side Header Column Labels */}
            <div className="grid grid-cols-1 md:grid-cols-2 bg-[#060f16] border-b border-[#182028] text-[#8b919f] font-code-sm">
              <div className="px-4 py-2 flex items-center justify-between border-r border-[#182028] bg-[#141c24]/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
                  <span className="font-semibold text-[#ffb4ab]">Original Failing Code</span>
                </div>
                <span className="font-label-sm text-[#8b919f]">Crash Source</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between bg-[#141c24]/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#67df70]"></span>
                  <span className="font-semibold text-[#67df70]">Suggested Remediation Fix</span>
                </div>
                <span className="font-label-sm text-[#d5bbff]">AI Synthesized</span>
              </div>
            </div>

            {/* Split Code Rows */}
            <div className="flex flex-col font-code-sm bg-[#060f16] divide-y divide-[#182028]">
              {splitRows.map((row, idx) => {
                if (row.isHunk) {
                  return (
                    <div key={`hunk-${idx}`} className="bg-[#d5bbff]/10 text-[#d5bbff] font-code-sm px-4 py-1.5 border-y border-[#222b33] flex items-center gap-2 select-none">
                      <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                      <span className="font-mono text-xs">{row.hunkHeader}</span>
                    </div>
                  );
                }

                return (
                  <div key={`split-${idx}`} className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#182028] hover:bg-[#141c24]/30">
                    {/* LEFT PANEL: Original Deletions & Context */}
                    <div className={`flex items-stretch font-mono ${
                      row.leftType === 'delete'
                        ? 'bg-[#93000a]/25 text-[#ffdad6] border-l-2 border-[#ffb4ab]'
                        : 'bg-[#060f16] text-[#dae3ee]'
                    }`}>
                      <span className="w-10 px-2 py-1 text-right text-[#8b919f] select-none shrink-0 bg-[#0b141c]/50 border-r border-[#182028]">
                        {row.leftLineNo || ''}
                      </span>
                      <span className={`w-6 text-center select-none py-1 font-bold shrink-0 ${
                        row.leftType === 'delete' ? 'text-[#ffb4ab]' : 'text-transparent'
                      }`}>
                        {row.leftType === 'delete' ? '-' : ' '}
                      </span>
                      <span className="py-1 px-2 whitespace-pre overflow-x-auto">
                        {row.leftText || ''}
                      </span>
                    </div>

                    {/* RIGHT PANEL: Suggested Additions & Context */}
                    <div className={`flex items-stretch font-mono ${
                      row.rightType === 'add'
                        ? 'bg-[#27a640]/20 text-[#dae3ee] border-l-2 border-[#67df70]'
                        : 'bg-[#060f16] text-[#dae3ee]'
                    }`}>
                      <span className="w-10 px-2 py-1 text-right text-[#8b919f] select-none shrink-0 bg-[#0b141c]/50 border-r border-[#182028]">
                        {row.rightLineNo || ''}
                      </span>
                      <span className={`w-6 text-center select-none py-1 font-bold shrink-0 ${
                        row.rightType === 'add' ? 'text-[#67df70]' : 'text-transparent'
                      }`}>
                        {row.rightType === 'add' ? '+' : ' '}
                      </span>
                      <span className="py-1 px-2 whitespace-pre overflow-x-auto">
                        {row.rightText || ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode: Unified Stream View */}
        {viewMode === 'unified' && (
          <div className="flex flex-col font-mono font-code-sm bg-[#060f16] divide-y divide-[#182028]">
            {unifiedRows.map((row, idx) => {
              if (row.isHunk) {
                return (
                  <div key={`uhunk-${idx}`} className="bg-[#d5bbff]/10 text-[#d5bbff] px-4 py-1.5 border-y border-[#222b33] flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                    <span className="font-mono text-xs">{row.hunkHeader}</span>
                  </div>
                );
              }

              return (
                <div
                  key={`uni-${idx}`}
                  className={`flex items-stretch hover:bg-[#141c24]/30 ${
                    row.type === 'add'
                      ? 'bg-[#27a640]/20 text-[#dae3ee] border-l-2 border-[#67df70]'
                      : row.type === 'delete'
                      ? 'bg-[#93000a]/25 text-[#ffdad6] border-l-2 border-[#ffb4ab]'
                      : 'text-[#dae3ee]'
                  }`}
                >
                  <span className="w-10 px-2 py-1 text-right text-[#8b919f] select-none shrink-0 bg-[#0b141c]/50 border-r border-[#182028]">
                    {row.origLineNo || ''}
                  </span>
                  <span className="w-10 px-2 py-1 text-right text-[#8b919f] select-none shrink-0 bg-[#0b141c]/50 border-r border-[#182028]">
                    {row.newLineNo || ''}
                  </span>
                  <span className={`w-6 text-center select-none py-1 font-bold shrink-0 ${
                    row.type === 'add' ? 'text-[#67df70]' : row.type === 'delete' ? 'text-[#ffb4ab]' : 'text-transparent'
                  }`}>
                    {row.type === 'add' ? '+' : row.type === 'delete' ? '-' : ' '}
                  </span>
                  <span className="py-1 px-3 whitespace-pre overflow-x-auto">
                    {row.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#182028] px-6 py-2.5 border-t border-[#222b33] flex items-center justify-between font-code-sm">
          <span className="text-[#8b919f]">
            Status: <span className="text-[#dae3ee] font-semibold">1 patch hunk ready</span> (-{deleteCount} / +{addCount} lines)
          </span>
          <span className="text-[#67df70] font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">lock_open</span>
            <span>Zero AST collisions detected</span>
          </span>
        </div>
      </div>

      {/* Sticky Bottom Approval Workflow Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 z-30 bg-[#060f16]/95 backdrop-blur-md px-6 py-3 border-t border-[#222b33] shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-left">
            <span className="material-symbols-outlined text-[#8b919f] text-[20px] shrink-0">info</span>
            <p className="font-body-sm text-[#c1c6d6]">
              Approving will patch the sandboxed copy and automatically execute the reproduction test and full test suite.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => onNavigate('failures')}
              className="px-4 py-2 rounded-lg font-code-sm text-[#ffb4ab] bg-[#141c24] hover:bg-[#222b33] border border-[#93000a]/50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Reject Fix</span>
            </button>

            <button
              onClick={onApproveAndVerify}
              disabled={isApproving}
              className="px-6 py-2 rounded-lg font-code-sm text-[#002959] bg-[#418fff] hover:bg-[#aac7ff] font-semibold transition-all shadow-md flex items-center gap-2"
            >
              <span className={`material-symbols-outlined text-[18px] ${isApproving ? 'animate-spin' : ''}`}>
                bolt
              </span>
              <span>{isApproving ? 'Patching Sandbox & Running Verification...' : 'Approve Fix & Run Verification ->'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
