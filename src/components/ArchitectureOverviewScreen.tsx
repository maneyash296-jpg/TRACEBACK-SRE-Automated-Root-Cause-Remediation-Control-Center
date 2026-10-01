import React, { useState } from 'react';
import { StepId } from '../types';

interface ArchitectureOverviewScreenProps {
  onNavigate: (step: StepId) => void;
}

export const ArchitectureOverviewScreen: React.FC<ArchitectureOverviewScreenProps> = ({ onNavigate }) => {
  const [activePillar, setActivePillar] = useState<'api' | 'ast' | 'sandbox' | 'ai'>('api');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [selectedActor, setSelectedActor] = useState<string>('all');

  const pillars = [
    {
      id: 'api',
      name: '1. The API Service',
      badge: 'ORCHESTRATION & GATEWAY',
      icon: 'hub',
      color: '#418fff',
      bgGrad: 'from-[#418fff]/10 to-transparent',
      borderColor: 'border-[#418fff]/40',
      summary: 'High-throughput management and orchestration layer coordinating project intake, state machines, and real-time event streaming.',
      tech: ['FastAPI / Python 3.11', 'Express / Node.js Proxy', 'Pydantic v2 Models', 'SSE Telemetry Streaming', 'SQLite & Firestore Sync'],
      coreResponsibilities: [
        'Secure ZIP intake with ZipSlip, symlink bomb, and path-traversal validation.',
        'Deterministic lifecycle state machine from intake to report export.',
        'Session-isolated scratch workspaces management in /tmp/tb_sandboxes/.',
        'Dual persistence model: zero-latency local SQLite + Firestore cloud audit sync.',
      ],
      keySnippet: `@app.post("/api/projects/upload")
async def handle_project_upload(file: UploadFile = File(...)):
    # 1. Inspect archive with SafeZipExtractor
    extract_result = SafeZipExtractor.inspect_and_extract(
        zip_path=temp_zip, 
        destination_dir=sandbox_workspace,
        max_uncompressed_bytes=100 * 1024 * 1024
    )
    # 2. Trigger asynchronous AST Scanner & Topology builder
    project_dna = ProjectScanner(sandbox_workspace).scan()
    return {"status": "ready", "dna": project_dna}`,
    },
    {
      id: 'ast',
      name: '2. The Deterministic Engine',
      badge: 'STATIC CODE ANALYSIS',
      icon: 'account_tree',
      color: '#d5bbff',
      bgGrad: 'from-[#d5bbff]/10 to-transparent',
      borderColor: 'border-[#d5bbff]/40',
      summary: 'Mathematical, zero-hallucination static analyzer inspecting Python AST nodes, function boundaries, call-graphs, and symbol dependencies.',
      tech: ['Python built-in ast', 'Symtable Symbol Scopes', 'Disassembler (dis)', 'Directed Graph Matrix', 'Cyclomatic Complexity Profiler'],
      coreResponsibilities: [
        'Scans 100% of workspace files into Abstract Syntax Trees without executing untrusted code.',
        'Extracts deterministic Project DNA: pure functions, async functions, classes, routes, test suites, and SHA-256 state.',
        'Builds 2D topological call-graphs with caller-callee relationship matrices.',
        'Pinpoints exact line ranges, symbol scopes, and parent module hierarchies for any traceback frame.',
      ],
      keySnippet: `class ProjectScanner:
    def scan_file(self, file_path: str):
        with open(file_path, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=file_path)
        
        # Deterministic Visitor extracts callables & scope
        visitor = ASTComponentVisitor(file_path)
        visitor.visit(tree)
        return {
            "functions": visitor.functions,
            "classes": visitor.classes,
            "complexity": visitor.calculate_cyclomatic_metric()
        }`,
    },
    {
      id: 'sandbox',
      name: '3. The SandboxRunner',
      badge: 'HERMETIC EXECUTION & SAFETY',
      icon: 'terminal',
      color: '#67df70',
      bgGrad: 'from-[#67df70]/10 to-transparent',
      borderColor: 'border-[#67df70]/40',
      summary: 'Docker-compatible, chroot process-isolated execution enclosure enforcing strict resource quotas, zero network leakage, and dual-run verification.',
      tech: ['Docker Containers / Chroot Jails', 'Linux cgroups Quotas', 'Network Isolation (--network none)', 'Command Sanitizer Engine', 'Subprocess Timeout Guards'],
      coreResponsibilities: [
        'Executes untrusted user test suites in hermetic isolation with 30-60s execution bounds.',
        'Sanitizes all CLI test commands against shell injection, destructive flags, and out-of-bounds writes.',
        'Dual-Run Regression Validator: Executes baseline tests (RED), validates reproduction test, applies patch, and re-executes full suite (GREEN).',
        'Guarantees zero modifications to the original project files outside temporary ephemeral sandbox clones.',
      ],
      keySnippet: `class ProcessSandboxRunner(SandboxRunner):
    def run_tests(self, sandbox_id: str, test_cmd: str, timeout_sec: int):
        # 1. Sanitize execution tokens
        safe_args = CommandSanitizer.sanitize(test_cmd)
        
        # 2. Spawn hermetic subprocess with restricted environment
        proc = subprocess.Popen(
            safe_args,
            cwd=self.sandboxes[sandbox_id],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={"PYTHONPATH": ".", "PYTHONDONTWRITEBYTECODE": "1"}
        )
        stdout, stderr = proc.communicate(timeout=timeout_sec)
        return self.parse_test_telemetry(proc.returncode, stdout, stderr)`,
    },
    {
      id: 'ai',
      name: '4. The AI Provider',
      badge: 'EPISTEMIC REASONING & FIXES',
      icon: 'auto_awesome',
      color: '#ffb4ab',
      bgGrad: 'from-[#ffb4ab]/10 to-transparent',
      borderColor: 'border-[#ffb4ab]/40',
      summary: 'Cognitive reasoning engine powered by Google Gemini (with deterministic offline AST fallback router) for hypothesis ranking, reproduction scripting, and defensive patch synthesis.',
      tech: ['Google Gemini 2.5 Flash / Pro SDK', '@google/genai TypeScript & Python', 'Structured Epistemic Reasoning', 'Unified Diff Validator', 'AST Fallback Cache'],
      coreResponsibilities: [
        'Triages failure evidence into Fact (machine runtime), Inferred (AST scope), and Hypothesis (AI deduction).',
        'Generates automated reproduction unit test scripts that reliably isolate the crash condition in a RED state.',
        'Synthesizes defensive, backward-compatible unified diffs with mathematical boundary clamping.',
        'Pre-validates patch syntax and AST symbol safety before submitting to the SandboxRunner for dual-run verification.',
      ],
      keySnippet: `class RealAIProvider(AIProvider):
    async def generate_fix(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""Synthesize a defensive, backward-compatible Python patch.
CRASH SITE: {evidence['component']}
EXCEPTION: {evidence['error_type']}: {evidence['message']}
SOURCE CONTEXT:
{evidence['source_lines']}

Return strict JSON with:
- diff: Unified diff format
- explanation: Root cause deduction
- rationale: Complexity and regression risk"""
        response = await self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return json.loads(response.text)`,
    },
  ];

  const lifecycleSteps = [
    {
      stepNum: '01',
      title: 'ZIP Intake & Security Sanitization',
      actor: 'API Service',
      actorColor: '#418fff',
      duration: '12ms',
      status: 'SECURE',
      desc: 'User uploads a Python project archive or chooses a diagnostic preset. SafeZipExtractor blocks zip-slip path traversals, verifies archive headers, and decompresses into an ephemeral workspace.',
      payload: 'File: cropsense.zip (108 SLOC, 10 tests, 0 symlink violations)',
    },
    {
      stepNum: '02',
      title: 'AST Static Scan & DNA Fingerprinting',
      actor: 'Deterministic Engine',
      actorColor: '#d5bbff',
      duration: '18ms',
      status: 'DETERMINISTIC',
      desc: 'Python AST engine recursively parses all .py files without executing code, calculating exact line counts, pure/async functions, classes, routes, and a cryptographic SHA-256 fingerprint.',
      payload: 'DNA: 8 files, 8 pure functions, 2 classes, 0 anomalies, SHA-256: 15d8fb5a...',
    },
    {
      stepNum: '03',
      title: 'Architectural Topology Call-Graph',
      actor: 'Deterministic Engine',
      actorColor: '#d5bbff',
      duration: '24ms',
      status: 'TOPOLOGY_BUILT',
      desc: 'Constructs the directional caller-callee dependency matrix, linking HTTP API gateways, domain services, model entities, and test suites into a queryable graph.',
      payload: 'Graph: 31 Component Nodes, 21 Directional Call Edges, 100% Symbol Resolution',
    },
    {
      stepNum: '04',
      title: 'Environment & Test Runner Detection',
      actor: 'API Service',
      actorColor: '#418fff',
      duration: '8ms',
      status: 'DETECTED',
      desc: 'Inspects requirements.txt, pyproject.toml, and test directory topology to discover Python runtime (3.11), test framework (pytest/unittest), and sanitized execution flags.',
      payload: 'Env: Python 3.11.8, Framework: FastAPI, Command: pytest -q, Timeout: 30s',
    },
    {
      stepNum: '05',
      title: 'Isolated Sandbox Creation',
      actor: 'SandboxRunner',
      actorColor: '#67df70',
      duration: '15ms',
      status: 'ENCLOSURE_ACTIVE',
      desc: 'Allocates a hermetic chroot jail in /tmp/tb_sandboxes/sb_proc_*, restricts networking (--network none), and applies strict cgroups CPU/memory quotas.',
      payload: 'Sandbox: /tmp/tb_sandboxes/sb_proc_ba7290a939, Memory Quota: 512MB, CPU: 2 Cores',
    },
    {
      stepNum: '06',
      title: 'Real Test Suite Execution (RED State)',
      actor: 'SandboxRunner',
      actorColor: '#67df70',
      duration: '142ms',
      status: 'FAULT_CAPTURED',
      desc: 'Executes the real test command in the sandbox. Captures standard out, standard error, exit code 1, and records unhandled runtime exceptions.',
      payload: 'Result: 10 Total, 9 Passed, 1 Failed (FL-REAL-001: ValueError: 105.0% saturation spike)',
    },
    {
      stepNum: '07',
      title: 'Deterministic Traceback AST Mapping',
      actor: 'Deterministic Engine',
      actorColor: '#d5bbff',
      duration: '10ms',
      status: 'PINPOINTED',
      desc: 'Parses traceback stack frames and cross-references source paths against the AST component inventory, pinpointing the exact crash line and local variable scope.',
      payload: 'Crash Site: services/moisture.py:11 in calculate_irrigation_duration()',
    },
    {
      stepNum: '08',
      title: 'Epistemic Evidence Investigation',
      actor: 'AI Provider',
      actorColor: '#ffb4ab',
      duration: '310ms',
      status: 'INVESTIGATED',
      desc: 'Triages machine facts, AST scope correlations, and AI hypotheses. Diagnoses missing boundary clamp for uncalibrated soil sensor readings > 100.0%.',
      payload: 'Confidence: 98% High Prob, Hypothesis: Clamping to 100.0% ceiling resolves rainstorm fault',
    },
    {
      stepNum: '09',
      title: 'Automated Reproduction Test Execution',
      actor: 'SandboxRunner & AI',
      actorColor: '#67df70',
      duration: '85ms',
      status: 'REPRO_CONFIRMED',
      desc: 'Synthesizes an isolated test (test_repro_fl_real_001.py), executes it in an ephemeral sandbox scratchpad, and verifies reproducible RED state fault capture.',
      payload: 'Scratch Test: test_oversaturated_sensor_spike_raises() -> Exit 1 (100% Signature Match)',
    },
    {
      stepNum: '10',
      title: 'Defensive Patch Synthesis & AST Safety',
      actor: 'AI Provider',
      actorColor: '#ffb4ab',
      duration: '420ms',
      status: 'PATCH_READY',
      desc: 'Synthesizes a minimal unified diff applying mathematical boundary clamping (min/max 100.0%). Validates syntax tree integrity with 0 symbol breakages.',
      payload: 'Diff: services/moisture.py (+2, -2 lines), Regression Risk: 0.0%, API: 100% Compatible',
    },
    {
      stepNum: '11',
      title: 'Developer Review & Approval Gate',
      actor: 'API Service',
      actorColor: '#418fff',
      duration: 'Manual',
      status: 'USER_APPROVED',
      desc: 'Requires explicit developer sign-off in the UI before any patch is verified or applied to any codebase copy.',
      payload: 'Action: POST /api/fixes/fix_fl-real-001/approve -> approved=true',
    },
    {
      stepNum: '12',
      title: 'Dual-Run Sandbox Verification (GREEN State)',
      actor: 'SandboxRunner',
      actorColor: '#67df70',
      duration: '190ms',
      status: 'VERIFIED_PASS',
      desc: 'Clones codebase into a fresh verification sandbox, applies the approved diff, and executes both the reproduction test and the full 10-test suite.',
      payload: 'Verdict: PASS (10/10 tests passed, 0 failed, duration: 0.001s, 0 Regressions)',
    },
    {
      stepNum: '13',
      title: 'Audit Report & Artifact Export',
      actor: 'API Service & AI',
      actorColor: '#418fff',
      duration: '35ms',
      status: 'REPORT_GENERATED',
      desc: 'Compiles the forensic post-mortem report, generates the downloadable unified .patch file, and syncs audit records to the cloud database.',
      payload: 'Artifact: verified_moisture_fix.patch, Doc ID: TRB-2026-FL-REAL-001',
    },
  ];

  const currentPillarData = pillars.find((p) => p.id === activePillar) || pillars[0];
  const currentStepData = lifecycleSteps[activeStepIndex];

  return (
    <div className="flex flex-col gap-8 w-full pb-24">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-label-sm uppercase tracking-widest text-[#418fff] bg-[#222b33] border border-[#2d363e] px-2.5 py-0.5 rounded font-semibold">
                SYSTEM ARCHITECTURE // SPEC_V1.4
              </span>
              <span className="font-code-sm text-[#8b919f]">·</span>
              <span className="font-code-sm text-[#67df70] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#67df70] animate-pulse"></span>
                4 PILLARS ACTIVE
              </span>
            </div>
            <h1 className="font-headline-xl text-[#dae3ee] font-bold tracking-tight">
              TRACEBACK Architecture Overview
            </h1>
            <p className="font-body-md text-[#c1c6d6] max-w-3xl mt-1.5">
              A deep-dive technical specification into TRACEBACK’s four foundational engineering pillars and the
              deterministic end-to-end lifecycle that moves software diagnosis from stochastic guesswork to
              mathematically verified dual-run validation.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('upload')}
              className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] px-4 py-2 rounded-lg font-headline-sm font-semibold flex items-center gap-2 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Test Real Project</span>
            </button>
            <button
              onClick={() => onNavigate('project-dna')}
              className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] px-3.5 py-2 rounded-lg font-code-sm flex items-center gap-1.5 transition-colors text-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-[#d5bbff]">fingerprint</span>
              <span>Inspect DNA</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: THE FOUR PILLARS INTERACTIVE BREAKDOWN */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#182028] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center text-[#418fff]">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </div>
            <div>
              <h2 className="font-headline-md text-[#dae3ee] font-semibold tracking-tight">
                The Four Architectural Pillars
              </h2>
              <span className="font-body-sm text-[#8b919f]">
                Separation of concerns between orchestration, deterministic inspection, isolated safety, and AI synthesis
              </span>
            </div>
          </div>
          <span className="font-code-sm text-[#8b919f] hidden sm:inline">
            Zero-Hallucination Pipeline
          </span>
        </div>

        {/* Pillar Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pillars.map((pillar) => {
            const isSelected = activePillar === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id as any)}
                className={`p-4 rounded-xl text-left transition-all border relative overflow-hidden flex flex-col justify-between gap-3 ${
                  isSelected
                    ? `bg-[#182028] ${pillar.borderColor} shadow-lg ring-1 ring-[#418fff]/30`
                    : 'bg-[#141c24] border-[#182028] hover:bg-[#182028]/70 text-[#8b919f]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center border"
                    style={{
                      backgroundColor: `${pillar.color}15`,
                      borderColor: `${pillar.color}40`,
                      color: pillar.color,
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{pillar.icon}</span>
                  </div>
                  <span
                    className="font-label-sm uppercase tracking-wider px-2 py-0.5 rounded text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${pillar.color}15`,
                      borderColor: `${pillar.color}30`,
                      color: pillar.color,
                    }}
                  >
                    {pillar.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline-sm font-semibold text-[#dae3ee] mb-1">{pillar.name}</h3>
                  <p className="font-body-sm text-[#8b919f] line-clamp-2">{pillar.summary}</p>
                </div>

                {isSelected && (
                  <div
                    className="h-1 w-full rounded-full mt-1"
                    style={{ backgroundColor: pillar.color }}
                  ></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Pillar Deep-Dive Details Panel */}
        <div className="bg-[#141c24] border border-[#182028] rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Responsibilities & Stack (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="font-headline-lg font-bold"
                  style={{ color: currentPillarData.color }}
                >
                  {currentPillarData.name}
                </span>
                <span className="font-code-sm bg-[#222b33] text-[#dae3ee] px-2.5 py-0.5 rounded border border-[#2d363e]">
                  {currentPillarData.badge}
                </span>
              </div>

              <p className="font-body-md text-[#c1c6d6] leading-relaxed">
                {currentPillarData.summary}
              </p>

              {/* Core Responsibilities */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#418fff]">task_alt</span>
                  Core Responsibilities & Guarantees
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {currentPillarData.coreResponsibilities.map((resp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#0b141c] border border-[#182028] font-body-sm text-[#dae3ee] flex items-start gap-2.5"
                    >
                      <span className="font-code-sm text-[#8b919f] mt-0.5 shrink-0">0{idx + 1}.</span>
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Chips */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">
                  Subsystem Technologies
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {currentPillarData.tech.map((t, idx) => (
                    <span
                      key={idx}
                      className="font-code-sm bg-[#182028] border border-[#222b33] text-[#dae3ee] px-2.5 py-1 rounded text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Code Snippet & Implementation Contract (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#8b919f] font-code-sm">
                <span className="flex items-center gap-1 text-xs">
                  <span className="material-symbols-outlined text-[14px] text-[#67df70]">code</span>
                  Production Implementation Contract
                </span>
                <span className="text-[11px] bg-[#0b141c] px-2 py-0.5 rounded border border-[#182028]">
                  Python 3.11 / TypeSafe
                </span>
              </div>

              <div className="bg-[#060f16] border border-[#182028] rounded-xl p-4 font-code-sm text-[#dae3ee] text-xs leading-relaxed overflow-x-auto shadow-inner">
                <pre className="text-[#c1c6d6]">
                  <code>{currentPillarData.keySnippet}</code>
                </pre>
              </div>

              <div className="p-3 bg-[#182028] border border-[#222b33] rounded-lg text-xs text-[#8b919f] font-code-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#67df70]">verified</span>
                  <span>Zero side-effects on host system</span>
                </span>
                <span className="text-[#dae3ee]">Dual-Run Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: THE REAL PROJECT LIFECYCLE SEQUENCE DIAGRAM */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between border-b border-[#182028] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center text-[#67df70]">
              <span className="material-symbols-outlined text-[18px]">schema</span>
            </div>
            <div>
              <h2 className="font-headline-md text-[#dae3ee] font-semibold tracking-tight">
                Visual Sequence: The Real Project Lifecycle
              </h2>
              <span className="font-body-sm text-[#8b919f]">
                Deterministic step-by-step trace from ZIP intake to verified post-mortem audit report
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-label-sm text-[#8b919f] uppercase tracking-wider hidden sm:inline">
              Filter Actor:
            </span>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="bg-[#182028] border border-[#222b33] text-[#dae3ee] font-code-sm text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#418fff]"
            >
              <option value="all">All Actors (13 Phases)</option>
              <option value="API Service">API Service</option>
              <option value="Deterministic Engine">Deterministic Engine</option>
              <option value="SandboxRunner">SandboxRunner</option>
              <option value="AI Provider">AI Provider</option>
            </select>
          </div>
        </div>

        {/* Visual Actor Swimlane Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#060f16] border border-[#182028] p-3 rounded-xl">
          <div className="flex items-center gap-2 font-code-sm text-xs">
            <span className="w-3 h-3 rounded-full bg-[#418fff]"></span>
            <span className="font-semibold text-[#dae3ee]">API Service</span>
            <span className="text-[#8b919f] text-[11px]">(Gateway)</span>
          </div>
          <div className="flex items-center gap-2 font-code-sm text-xs">
            <span className="w-3 h-3 rounded-full bg-[#d5bbff]"></span>
            <span className="font-semibold text-[#dae3ee]">Deterministic Engine</span>
            <span className="text-[#8b919f] text-[11px]">(AST)</span>
          </div>
          <div className="flex items-center gap-2 font-code-sm text-xs">
            <span className="w-3 h-3 rounded-full bg-[#67df70]"></span>
            <span className="font-semibold text-[#dae3ee]">SandboxRunner</span>
            <span className="text-[#8b919f] text-[11px]">(Docker/Chroot)</span>
          </div>
          <div className="flex items-center gap-2 font-code-sm text-xs">
            <span className="w-3 h-3 rounded-full bg-[#ffb4ab]"></span>
            <span className="font-semibold text-[#dae3ee]">AI Provider</span>
            <span className="text-[#8b919f] text-[11px]">(Gemini)</span>
          </div>
        </div>

        {/* Sequence Flow Timeline Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Timeline Step Rail (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-2.5">
            {lifecycleSteps
              .filter((st) => selectedActor === 'all' || st.actor.includes(selectedActor))
              .map((step, idx) => {
                const isSelected = activeStepIndex === idx;
                return (
                  <div
                    key={step.stepNum}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#182028] border-[#418fff] shadow-md ring-1 ring-[#418fff]/30'
                        : 'bg-[#141c24] border-[#182028] hover:bg-[#182028]/60'
                    }`}
                  >
                    {/* Number Badge */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-code-sm text-xs font-bold shrink-0 border"
                      style={{
                        backgroundColor: `${step.actorColor}15`,
                        borderColor: `${step.actorColor}40`,
                        color: step.actorColor,
                      }}
                    >
                      {step.stepNum}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-headline-sm font-semibold text-[#dae3ee] truncate">
                          {step.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="font-label-sm uppercase tracking-wider px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${step.actorColor}15`,
                              borderColor: `${step.actorColor}30`,
                              color: step.actorColor,
                            }}
                          >
                            {step.actor}
                          </span>
                          <span className="font-code-sm text-[#8b919f] text-[11px]">
                            {step.duration}
                          </span>
                        </div>
                      </div>
                      <p className="font-body-sm text-[#8b919f] text-xs line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Step Inspector & Telemetry Drawer (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4 bg-[#141c24] border border-[#182028] rounded-xl p-5 shadow-xl relative overflow-hidden h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-[#182028]">
              <div className="flex items-center gap-2">
                <span className="font-code-md font-bold text-[#418fff]">
                  PHASE {currentStepData.stepNum}
                </span>
                <span
                  className="font-label-sm uppercase tracking-wider px-2 py-0.5 rounded text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${currentStepData.actorColor}15`,
                    borderColor: `${currentStepData.actorColor}40`,
                    color: currentStepData.actorColor,
                  }}
                >
                  {currentStepData.actor}
                </span>
              </div>
              <span className="font-code-sm text-[#67df70] bg-[#67df70]/10 border border-[#67df70]/30 px-2 py-0.5 rounded text-xs">
                {currentStepData.status}
              </span>
            </div>

            <div>
              <h3 className="font-headline-md font-semibold text-[#dae3ee] mb-1.5">
                {currentStepData.title}
              </h3>
              <p className="font-body-sm text-[#c1c6d6] leading-relaxed">
                {currentStepData.desc}
              </p>
            </div>

            {/* Execution Payload Inspector */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-sm uppercase tracking-wider text-[#8b919f] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#418fff]">data_object</span>
                Subsystem Payload & Telemetry
              </span>
              <div className="p-3 bg-[#060f16] border border-[#182028] rounded-lg font-code-sm text-[#dae3ee] text-xs leading-relaxed overflow-x-auto">
                <code>{currentStepData.payload}</code>
              </div>
            </div>

            {/* Sequence Interaction Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-code-sm text-[#8b919f]">
                <span>Typical Phase Latency:</span>
                <strong className="text-[#dae3ee]">{currentStepData.duration}</strong>
              </div>
              <div className="flex items-center justify-between text-xs font-code-sm text-[#8b919f]">
                <span>Deterministic State Integrity:</span>
                <strong className="text-[#67df70]">100% Hermetic</strong>
              </div>
              <button
                onClick={() => {
                  if (currentStepData.stepNum === '01') onNavigate('upload');
                  else if (currentStepData.stepNum === '02') onNavigate('project-dna');
                  else if (currentStepData.stepNum === '03') onNavigate('architecture');
                  else if (currentStepData.stepNum === '04') onNavigate('environment');
                  else if (currentStepData.stepNum === '06' || currentStepData.stepNum === '07') onNavigate('failures');
                  else if (currentStepData.stepNum === '08') onNavigate('investigation');
                  else if (currentStepData.stepNum === '09') onNavigate('test-lab');
                  else if (currentStepData.stepNum === '10') onNavigate('proposed-fix');
                  else if (currentStepData.stepNum === '12') onNavigate('verification');
                  else onNavigate('report');
                }}
                className="w-full mt-2 bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-headline-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md text-center text-xs"
              >
                <span>Jump to Live Phase UI ({currentStepData.stepNum}) →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SECURITY & HERMETIC ISOLATION SPECIFICATION */}
      <div className="bg-[#141c24] border border-[#182028] rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#182028] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#222b33] border border-[#2d363e] flex items-center justify-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[18px]">security</span>
            </div>
            <div>
              <h3 className="font-headline-md text-[#dae3ee] font-semibold tracking-tight">
                Security & Isolation Guarantees
              </h3>
              <span className="font-body-sm text-[#8b919f]">
                Multi-layer defenses protecting server infrastructure and host system integrity
              </span>
            </div>
          </div>
          <span className="font-code-sm bg-[#67df70]/10 text-[#67df70] border border-[#67df70]/30 px-2.5 py-0.5 rounded text-xs">
            SEC_HARDENED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0b141c] border border-[#182028] rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#418fff]">
              <span className="material-symbols-outlined text-[20px]">folder_zip</span>
              <span className="font-headline-sm font-semibold text-[#dae3ee]">Safe ZIP Intake</span>
            </div>
            <p className="font-body-sm text-[#8b919f] leading-relaxed">
              Enforces <code className="text-[#ffdad6]">SafeZipExtractor</code> checks: rejects path traversals (../),
              symlink loops, and decompressed archives exceeding 100MB to prevent denial-of-service.
            </p>
          </div>

          <div className="p-4 bg-[#0b141c] border border-[#182028] rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#67df70]">
              <span className="material-symbols-outlined text-[20px]">terminal</span>
              <span className="font-headline-sm font-semibold text-[#dae3ee]">Command Sanitization</span>
            </div>
            <p className="font-body-sm text-[#8b919f] leading-relaxed">
              <code className="text-[#ffdad6]">CommandSanitizer</code> tokenizes test commands, strips destructive flags (rm, sudo, curl),
              and limits binaries to approved pytest/unittest runners.
            </p>
          </div>

          <div className="p-4 bg-[#0b141c] border border-[#182028] rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#d5bbff]">
              <span className="material-symbols-outlined text-[20px]">sync</span>
              <span className="font-headline-sm font-semibold text-[#dae3ee]">Dual-Run Verification</span>
            </div>
            <p className="font-body-sm text-[#8b919f] leading-relaxed">
              Patches are applied exclusively to disposable sandbox copies. The platform strictly requires dual-run
              validation (reproduction + full suite pass) before accepting fixes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
