import React, { useState } from 'react';
import { StepId } from '../types';

interface UploadScreenProps {
  onNavigate: (step: StepId) => void;
  onSelectPreset: (presetName: string) => Promise<void>;
  onUploadZip: (file: File) => Promise<void>;
  onResetAllData?: () => Promise<void>;
  isScanning: boolean;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  onNavigate,
  onSelectPreset,
  onUploadZip,
  onResetAllData,
  isScanning,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [activePreset, setActivePreset] = useState('demo-shop');
  const [isResetting, setIsResetting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadZip(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadZip(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Level Header & Architectural Preset Selector */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm text-[#418fff] uppercase tracking-widest bg-[#222b33] border border-[#2d363e] px-2 py-0.5 rounded">
                INTAKE_WORKSPACE // STEP_01
              </span>
              <span className="font-code-sm text-[#8b919f]">SYS_CHROOT_SANDBOX_ACTIVE</span>
            </div>
            <h1 className="font-headline-xl text-[#dae3ee] font-semibold tracking-tight">
              Analyze a Python project
            </h1>
            <p className="font-body-md text-[#c1c6d6] max-w-2xl mt-1">
              Upload a ZIP archive and TRACEBACK will recursively inspect its structural topology, AST call-graphs,
              package manifests, route definitions, and test fixtures in an isolated runtime enclosure.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex flex-col gap-1.5 self-start lg:self-end">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#d5bbff]">memory</span>
              Verified Diagnostic Presets
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setActivePreset('fresh-calc');
                  onSelectPreset('fresh-calc');
                }}
                className={`font-code-sm px-3 py-1.5 rounded flex items-center gap-2 transition-all border ${
                  activePreset === 'fresh-calc'
                    ? 'bg-[#222b33] border-[#d5bbff] text-[#dae3ee] shadow-sm'
                    : 'bg-[#182028] border-[#222b33] text-[#c1c6d6] hover:bg-[#222b33]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#d5bbff] animate-pulse"></span>
                <span className="font-medium text-[#dae3ee]">Fresh Calculator</span>
                <span className="font-label-sm bg-[#d5bbff]/20 text-[#d5bbff] px-1.5 py-0.5 rounded border border-[#d5bbff]/40">
                  ZeroDivision (3 Tests)
                </span>
              </button>

              <button
                onClick={() => {
                  setActivePreset('cropsense');
                  onSelectPreset('cropsense');
                }}
                className={`font-code-sm px-3 py-1.5 rounded flex items-center gap-2 transition-all border ${
                  activePreset === 'cropsense'
                    ? 'bg-[#222b33] border-[#67df70] text-[#dae3ee] shadow-sm'
                    : 'bg-[#182028] border-[#222b33] text-[#c1c6d6] hover:bg-[#222b33]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#67df70] animate-ping"></span>
                <span className="font-medium text-[#dae3ee]">CropSense</span>
                <span className="font-label-sm bg-[#27a640]/20 text-[#67df70] px-1.5 py-0.5 rounded border border-[#27a640]/40">
                  Real IoT Telemetry (10 Tests)
                </span>
              </button>

              <button
                onClick={() => {
                  setActivePreset('demo-shop');
                  onSelectPreset('demo-shop');
                }}
                className={`font-code-sm px-3 py-1.5 rounded flex items-center gap-2 transition-all border ${
                  activePreset === 'demo-shop'
                    ? 'bg-[#222b33] border-[#418fff] text-[#dae3ee] shadow-sm'
                    : 'bg-[#182028] border-[#222b33] text-[#c1c6d6] hover:bg-[#222b33]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                <span className="font-medium text-[#dae3ee]">demo-shop</span>
                <span className="font-label-sm bg-[#93000a] text-[#ffdad6] px-1.5 py-0.5 rounded">
                  E-Commerce Store
                </span>
              </button>

              {/* Sample ZIP Download Links */}
              <a
                href="/api/projects/download-fresh-zip"
                download="fresh_test_project.zip"
                className="bg-[#182028] hover:bg-[#222b33] border border-[#2d363e] text-[#d5bbff] hover:text-[#dae3ee] font-code-sm px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all text-xs"
                title="Download fresh test project ZIP (Calculator with ZeroDivisionError bug)"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                <span>Get fresh_test_project.zip</span>
              </a>
              <a
                href="/api/projects/download-cropsense-zip"
                download="cropsense.zip"
                className="bg-[#182028] hover:bg-[#222b33] border border-[#2d363e] text-[#8b919f] hover:text-[#dae3ee] font-code-sm px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all text-xs"
                title="Download real CropSense project archive to inspect or upload"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                <span>Get cropsense.zip</span>
              </a>

              <a
                href="/api/projects/download-demo-zip"
                download="demo-shop.zip"
                className="bg-[#182028] hover:bg-[#222b33] border border-[#2d363e] text-[#8b919f] hover:text-[#dae3ee] font-code-sm px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all text-xs"
                title="Download demo-shop project archive to inspect or upload"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                <span>Get demo-shop.zip</span>
              </a>

              {onResetAllData && (
                <button
                  onClick={async () => {
                    setIsResetting(true);
                    try {
                      await onResetAllData();
                    } finally {
                      setIsResetting(false);
                    }
                  }}
                  disabled={isResetting}
                  className="bg-[#93000a]/20 hover:bg-[#93000a]/30 border border-[#ba1a1a]/50 text-[#ffb4ab] font-code-sm px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all text-xs ml-auto"
                  title="Wipe database and reset to clean state"
                >
                  <span className={`material-symbols-outlined text-[15px] ${isResetting ? 'animate-spin' : ''}`}>
                    delete_sweep
                  </span>
                  <span>{isResetting ? 'Resetting...' : 'Reset All Past Data'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Workbench: Left (Intake Zone & Security), Right (Live Real-time AST Ingestion Monitor) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Intake Dropzone & Security Specs (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative group bg-[#060f16] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[300px] ${
              dragOver ? 'border-[#418fff] bg-[#141c24]' : 'border-[#2d363e] hover:border-[#418fff]/60 hover:bg-[#141c24]'
            }`}
          >
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span className="font-label-sm bg-[#182028] px-2 py-0.5 rounded text-[#8b919f] font-code-sm border border-[#2d363e]">
                INGESTION_PORTAL::ARCHIVE
              </span>
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#67df70]"></span>
              <span className="font-label-sm text-[#67df70]">DAEMON_READY</span>
            </div>

            {/* Center Icon */}
            <div className="relative w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-[#222b33] text-[#418fff] group-hover:scale-105 group-hover:bg-[#418fff] group-hover:text-[#002959] transition-all duration-300 shadow-md">
              <span className="material-symbols-outlined text-[32px]">folder_zip</span>
              <div className="absolute -bottom-1 -right-1 bg-[#060f16] p-1 rounded-md border border-[#2d363e]">
                <span className="material-symbols-outlined text-[14px] text-[#d5bbff]">terminal</span>
              </div>
            </div>

            <h2 className="font-headline-md text-[#dae3ee] font-semibold mb-1">
              Drop your project ZIP here
            </h2>
            <p className="font-body-md text-[#8b919f] mb-6">
              or browse archives directly from your workstation directory
            </p>

            <input
              type="file"
              accept=".zip"
              id="zip-upload-input"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <button
                onClick={() => document.getElementById('zip-upload-input')?.click()}
                className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-code-sm font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Browse System Files (.zip)
              </button>
              <a
                href="/api/projects/download-demo-zip"
                download="demo-shop.zip"
                className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] font-code-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                title="Download demo-shop.zip to test real ZIP upload"
              >
                <span className="material-symbols-outlined text-[18px] text-[#418fff]">download</span>
                Download sample demo-shop.zip
              </a>
            </div>

            {/* Technical Constraints Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="font-code-sm bg-[#182028] text-[#c1c6d6] px-2.5 py-1 rounded flex items-center gap-1.5 border border-[#222b33]">
                <span className="material-symbols-outlined text-[14px] text-[#67df70]">check</span>
                Python &gt;= 3.9
              </span>
              <span className="font-code-sm bg-[#182028] text-[#c1c6d6] px-2.5 py-1 rounded flex items-center gap-1.5 border border-[#222b33]">
                <span className="material-symbols-outlined text-[14px] text-[#418fff]">data_usage</span>
                Max Payload 150 MB
              </span>
              <span className="font-code-sm bg-[#182028] text-[#c1c6d6] px-2.5 py-1 rounded flex items-center gap-1.5 border border-[#222b33]">
                <span className="material-symbols-outlined text-[14px] text-[#d5bbff]">auto_fix_high</span>
                Poetry / Pipenv / Venv Detection
              </span>
            </div>
          </div>

          {/* Security & Isolation Guarantee Card */}
          <div className="bg-[#141c24] border border-[#182028] rounded-xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#67df70] text-[20px]">verified_user</span>
                <h3 className="font-headline-sm text-[#dae3ee] font-semibold">
                  Safe Analysis Guarantee &amp; Isolation Protocol
                </h3>
              </div>
              <span className="font-code-sm bg-[#182028] text-[#67df70] font-medium px-2.5 py-0.5 rounded border border-[#222b33]">
                ZERO_CODE_EXECUTION_AT_INTAKE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#060f16] border border-[#182028] p-4 rounded-lg flex gap-3 items-start">
                <span className="material-symbols-outlined text-[#418fff] text-[18px] mt-0.5 shrink-0">shield</span>
                <div className="flex flex-col">
                  <span className="font-code-sm font-semibold text-[#dae3ee]">Path Traversal Protection</span>
                  <p className="font-body-sm text-[#8b919f] mt-0.5">
                    Chroot execution boundaries with strict POSIX symlink canonicalization preventing escape payloads.
                  </p>
                </div>
              </div>

              <div className="bg-[#060f16] border border-[#182028] p-4 rounded-lg flex gap-3 items-start">
                <span className="material-symbols-outlined text-[#d5bbff] text-[18px] mt-0.5 shrink-0">delete_sweep</span>
                <div className="flex flex-col">
                  <span className="font-code-sm font-semibold text-[#dae3ee]">Ephemeral Workspace</span>
                  <p className="font-body-sm text-[#8b919f] mt-0.5">
                    Volatile temp space mounted at <span className="font-code-sm text-[#dae3ee]">/tmp/tb_sandbox_0x4f8</span> with automatic lifecycle purge.
                  </p>
                </div>
              </div>

              <div className="bg-[#060f16] border border-[#182028] p-4 rounded-lg flex gap-3 items-start">
                <span className="material-symbols-outlined text-[#67df70] text-[18px] mt-0.5 shrink-0">account_tree</span>
                <div className="flex flex-col">
                  <span className="font-code-sm font-semibold text-[#dae3ee]">Pure Static AST &amp; CST</span>
                  <p className="font-body-sm text-[#8b919f] mt-0.5">
                    No runtime imports executed. Tokens are strictly evaluated via standard Python AST representations.
                  </p>
                </div>
              </div>

              <div className="bg-[#060f16] border border-[#182028] p-4 rounded-lg flex gap-3 items-start">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[18px] mt-0.5 shrink-0">wifi_off</span>
                <div className="flex flex-col">
                  <span className="font-code-sm font-semibold text-[#dae3ee]">Strict Egress Restriction</span>
                  <p className="font-body-sm text-[#8b919f] mt-0.5">
                    Network namespace isolation with outbound socket rejection; deterministic offline parser execution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Intake & Ingestion Pipeline Monitor (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-[#141c24] border border-[#182028] rounded-xl p-6 flex flex-col gap-4 shadow-md">
            {/* Header Status Chip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-[#8b919f] uppercase tracking-wider">ACTIVE DISCOVERY</span>
                <span className="font-code-sm font-semibold text-[#dae3ee] bg-[#182028] px-2 py-0.5 rounded border border-[#222b33]">
                  demo-shop.zip
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#418fff]/15 px-2.5 py-1 rounded border border-[#418fff]/30">
                <span className="w-2 h-2 rounded-full bg-[#418fff] animate-pulse"></span>
                <span className="font-label-sm text-[#418fff] font-semibold tracking-wider">
                  {isScanning ? 'SCANNING (IN PROGRESS)...' : 'AST PARSED (100%)'}
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-[#060f16] h-2 rounded-full overflow-hidden p-0.5 border border-[#182028]">
              <div
                className="bg-[#418fff] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: isScanning ? '68%' : '100%' }}
              ></div>
            </div>

            {/* Metric Counter Strip */}
            <div className="grid grid-cols-3 gap-2 bg-[#060f16] border border-[#182028] p-3 rounded-lg text-center">
              <div className="flex flex-col">
                <span className="font-label-sm text-[#8b919f] uppercase">Discovered Files</span>
                <span className="font-headline-sm font-code-md text-[#dae3ee] font-semibold">
                  14 <span className="font-body-sm text-[#8b919f] font-normal">/ 1.2MB</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-[#8b919f] uppercase">Functions / Classes</span>
                <span className="font-headline-sm font-code-md text-[#418fff] font-semibold">
                  48 <span className="font-body-sm text-[#8b919f] font-normal">/ 9</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-[#8b919f] uppercase">Pytest Units</span>
                <span className="font-headline-sm font-code-md text-[#67df70] font-semibold">
                  18 <span className="font-body-sm text-[#8b919f] font-normal">tests</span>
                </span>
              </div>
            </div>

            {/* Live Step Checklist */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-sm text-[#8b919f] uppercase tracking-wider mb-0.5">AST Ingestion Steps</span>
              
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#060f16] rounded border border-[#182028]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
                  <span className="font-code-sm text-[#dae3ee]">Extracting project archive (14 files, 1.2 MB)</span>
                </div>
                <span className="font-code-sm text-[#8b919f]">18ms</span>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 bg-[#060f16] rounded border border-[#182028]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
                  <span className="font-code-sm text-[#dae3ee]">Scanning Python runtime &amp; virtualenv</span>
                </div>
                <span className="font-code-sm text-[#8b919f]">32ms</span>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 bg-[#060f16] rounded border border-[#182028]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
                  <span className="font-code-sm text-[#dae3ee]">Parsing AST &amp; Symbol Resolution</span>
                </div>
                <span className="font-code-sm text-[#8b919f]">94ms</span>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 bg-[#060f16] rounded border border-[#182028]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
                  <span className="font-code-sm text-[#dae3ee]">Detecting functions (48) and classes (9)</span>
                </div>
                <span className="font-code-sm text-[#8b919f]">41ms</span>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 bg-[#060f16] rounded border border-[#182028]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
                  <span className="font-code-sm text-[#dae3ee]">Detecting API routes (FastAPI: 6 endpoints)</span>
                </div>
                <span className="font-code-sm text-[#8b919f]">26ms</span>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 bg-[#060f16] rounded border border-[#182028]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
                  <span className="font-code-sm text-[#dae3ee]">Detecting test suite (pytest runner discovery: 18 tests)</span>
                </div>
                <span className="font-code-sm text-[#8b919f]">21ms</span>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 bg-[#060f16] rounded border border-[#182028]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#67df70]">check_circle</span>
                  <span className="font-code-sm text-[#dae3ee]">Building architecture dependency graph (312 edges)</span>
                </div>
                <span className="font-code-sm text-[#8b919f]">38ms</span>
              </div>
            </div>

            {/* Terminal Diagnostic Output Ticker */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between bg-[#182028] px-3 py-1 rounded-t border-t border-x border-[#222b33]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#8b919f]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
                  <span className="font-label-sm text-[#dae3ee] font-code-sm ml-2">stdout_telemetry.log</span>
                </div>
                <span className="font-label-sm text-[#8b919f]">STREAM_ACTIVE</span>
              </div>
              <div className="bg-[#060f16] p-3 rounded-b border border-[#182028] font-code-sm flex flex-col gap-1 text-[#c1c6d6] max-h-32 overflow-y-auto leading-relaxed shadow-inner">
                <div className="flex items-start gap-2">
                  <span className="text-[#8b919f] select-none">14:02:11.02</span>
                  <span className="text-[#67df70]">[AST:PARSER]</span>
                  <span>Read <span className="text-[#dae3ee] font-semibold">services/coupon.py</span> (64 lines) -&gt; Found <span className="text-[#418fff]">apply_discount(order, coupon)</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#8b919f] select-none">14:02:11.08</span>
                  <span className="text-[#67df70]">[AST:PARSER]</span>
                  <span>Resolved internal imports: <span className="text-[#dae3ee]">models.order, payment.charge, database</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#8b919f] select-none">14:02:11.14</span>
                  <span className="text-[#d5bbff]">[AST:ROUTE]</span>
                  <span>Registered <span className="text-[#67df70] font-semibold">POST</span> /api/v1/checkout/apply-coupon (FastAPI)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#8b919f] select-none">14:02:11.23</span>
                  <span className="text-[#418fff]">[TEST:DISC]</span>
                  <span className="text-[#aac7ff]">Found test spec: tests/test_coupon.py (3 testcases)</span>
                </div>
              </div>
            </div>

            {/* Action Navigation Footer */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => onSelectPreset('demo-shop')}
                className="bg-[#182028] hover:bg-[#222b33] border border-[#222b33] text-[#8b919f] hover:text-[#dae3ee] font-code-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Reset Intake
              </button>

              <button
                onClick={() => onNavigate('project-dna')}
                className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-code-sm font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
              >
                <span>Start Analysis &amp; Open DNA</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
