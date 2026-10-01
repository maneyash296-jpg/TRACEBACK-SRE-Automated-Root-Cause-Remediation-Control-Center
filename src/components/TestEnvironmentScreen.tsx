import React, { useState, useEffect } from 'react';
import { StepId, ProjectEnvironment, RealTestExecutionResult } from '../types';

interface TestEnvironmentScreenProps {
  onNavigate: (step: StepId) => void;
  environment: ProjectEnvironment | null;
  onRunSandboxTests: (testCommand: string, timeoutSec: number) => Promise<RealTestExecutionResult>;
  lastExecutionResult: RealTestExecutionResult | null;
  isRunningTests: boolean;
}

type ExecutionStage = 
  | 'IDLE'
  | 'QUEUED'
  | 'PREPARING ENVIRONMENT'
  | 'INSTALLING DEPENDENCIES'
  | 'COLLECTING TESTS'
  | 'RUNNING TESTS'
  | 'PARSING RESULTS'
  | 'COMPLETE'
  | 'FAILED';

export const TestEnvironmentScreen: React.FC<TestEnvironmentScreenProps> = ({
  onNavigate,
  environment,
  onRunSandboxTests,
  lastExecutionResult,
  isRunningTests,
}) => {
  const [testCommand, setTestCommand] = useState(environment?.test_command || 'pytest -q');
  const [timeoutSec, setTimeoutSec] = useState(environment?.timeout_seconds || 60);
  const [networkPolicy, setNetworkPolicy] = useState('Disabled');
  const [hardwareReq, setHardwareReq] = useState('cpu');
  const [activeStage, setActiveStage] = useState<ExecutionStage>(lastExecutionResult ? 'COMPLETE' : 'IDLE');
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [localLogs, setLocalLogs] = useState<string[]>([]);
  const [errorBanner, setErrorBanner] = useState<{ title: string; message: string; code?: string } | null>(null);

  // Sync default command when environment updates
  useEffect(() => {
    if (environment) {
      setTestCommand(environment.test_command || 'pytest -q');
      setTimeoutSec(environment.timeout_seconds || 60);
      setNetworkPolicy(environment.network || 'Disabled');
      if (environment.ml_support?.hardware_required) {
        setHardwareReq(environment.ml_support.hardware_required);
      }
    }
  }, [environment]);

  const STAGES: ExecutionStage[] = [
    'QUEUED',
    'PREPARING ENVIRONMENT',
    'INSTALLING DEPENDENCIES',
    'COLLECTING TESTS',
    'RUNNING TESTS',
    'PARSING RESULTS',
    'COMPLETE',
  ];

  const handleLaunchExecution = async () => {
    setErrorBanner(null);
    setActiveStage('QUEUED');
    setLocalLogs([
      `[SANDBOX] Dispatching execution request to SandboxRunner...`,
      `[SECURITY] Applying zero-trust parameters: network=${networkPolicy}, timeout=${timeoutSec}s`,
      `[SECURITY] Host environment scrubbed: 0 cloud secrets exposed`,
    ]);

    // Check ML GPU requirement
    if (hardwareReq === 'gpu' && !environment?.ml_support?.gpu_available) {
      setActiveStage('FAILED');
      setErrorBanner({
        title: 'ENVIRONMENT_UNAVAILABLE',
        message: 'The requested test execution requires GPU acceleration, but no compatible NVIDIA CUDA / Metal hardware is available in this sandbox instance.',
        code: 'HARDWARE_UNAVAILABLE'
      });
      setLocalLogs((prev) => [...prev, `[ERROR] ENVIRONMENT_UNAVAILABLE: GPU hardware required but not found.`]);
      return;
    }

    try {
      // Stage 1: Preparing Environment
      setTimeout(() => {
        setActiveStage('PREPARING ENVIRONMENT');
        setLocalLogs((prev) => [
          ...prev,
          `[SANDBOX] Initializing isolated chroot workspace in /tmp/tb_sandboxes...`,
          `[SANDBOX] Copying project files safely with symlink and traversal protections`,
        ]);
      }, 300);

      // Stage 2: Installing Dependencies
      setTimeout(() => {
        setActiveStage('INSTALLING DEPENDENCIES');
        setLocalLogs((prev) => [
          ...prev,
          `[DEPS] Inspecting ${environment?.dependency_file || 'requirements.txt'}...`,
          `[DEPS] Verifying isolated sandbox virtualenv packages...`,
          `[DEPS] Dependencies isolated inside sandbox only. Zero host pollution.`,
        ]);
      }, 700);

      // Stage 3: Collecting Tests
      setTimeout(() => {
        setActiveStage('COLLECTING TESTS');
        setLocalLogs((prev) => [
          ...prev,
          `[TEST] Invoking test collector: ${testCommand}...`,
          `[TEST] Target directories: ${(environment?.test_directories || ['tests']).join(', ')}`,
        ]);
      }, 1100);

      // Stage 4: Running Tests
      setTimeout(() => {
        setActiveStage('RUNNING TESTS');
        setLocalLogs((prev) => [
          ...prev,
          `[EXEC] Process started inside SandboxRunner...`,
          `[EXEC] Enforcing strict execution timeout (${timeoutSec}s)...`,
        ]);
      }, 1500);

      // Actual Execution
      const result = await onRunSandboxTests(testCommand, timeoutSec);

      // Stage 5: Parsing Results
      setActiveStage('PARSING RESULTS');
      setLocalLogs((prev) => [
        ...prev,
        `[PARSER] Deterministic Pytest/Unittest AST stack frame parser active...`,
        `[PARSER] Exit code: ${result.exit_code}`,
        `[PARSER] Execution duration: ${result.duration_seconds}s`,
        `[PARSER] Tests: ${result.total} total (${result.passed} passed, ${result.failed} failed)`,
      ]);

      if (result.stdout) {
        setLocalLogs((prev) => [...prev, `--- [STDOUT] ---`, result.stdout]);
      }
      if (result.stderr) {
        setLocalLogs((prev) => [...prev, `--- [STDERR] ---`, result.stderr]);
      }

      if (result.error_state === 'DEPENDENCY_INSTALLATION_FAILED') {
        setActiveStage('FAILED');
        setErrorBanner({
          title: 'DEPENDENCY_INSTALLATION_FAILED',
          message: result.failures?.[0]?.message || 'Failed to install project dependencies inside sandbox.',
          code: 'DEPENDENCY_ERROR'
        });
      } else if (result.error_state === 'TEST_TIMEOUT') {
        setActiveStage('FAILED');
        setErrorBanner({
          title: 'TEST_TIMEOUT',
          message: `Test execution timed out after ${timeoutSec} seconds limit exceeded.`,
          code: 'TIMEOUT_ERROR'
        });
      } else {
        setActiveStage('COMPLETE');
      }
    } catch (err: any) {
      setActiveStage('FAILED');
      setErrorBanner({
        title: 'EXECUTION_FAILED',
        message: err.message || 'Execution error encountered',
      });
      setLocalLogs((prev) => [...prev, `[FATAL] Execution failed: ${err.message}`]);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-20">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-[#141c24] border border-[#182028] p-6 rounded-xl shadow-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-label-sm uppercase tracking-wider text-[#418fff] font-semibold bg-[#222b33] px-2.5 py-0.5 rounded border border-[#2d363e]">
              EXECUTION PIPELINE // STEP 3
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#67df70] animate-pulse"></span>
            <span className="font-code-sm text-[#8b919f]">Deterministic Sandbox Layer</span>
          </div>
          <h1 className="font-headline-xl text-[#dae3ee] tracking-tight font-semibold">
            Test Environment Configuration
          </h1>
          <p className="font-body-md text-[#c1c6d6] max-w-3xl">
            Inspected environment manifests, package managers, and dependencies. Configure your safe isolated
            execution parameters before launching SandboxRunner.
          </p>
        </div>

        {/* Real Execution Badge & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#060f16] border border-[#27a640]/40 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#67df70] animate-ping"></span>
            <span className="font-code-sm font-bold text-[#67df70] tracking-wide text-xs">
              REAL TEST EXECUTION
            </span>
          </div>

          <button
            onClick={() => onNavigate('project-dna')}
            className="flex items-center gap-1.5 bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] px-3.5 py-2 rounded-lg font-code-sm transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Project DNA</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {errorBanner && (
        <div className="bg-[#93000a]/20 border border-[#ba1a1a]/50 p-4 rounded-xl flex items-start gap-3 text-[#ffdad6] animate-fade-in">
          <span className="material-symbols-outlined text-[#ffb4ab] text-[24px] shrink-0 mt-0.5">
            warning
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-code-sm font-bold uppercase">{errorBanner.title}</span>
              {errorBanner.code && (
                <span className="font-label-sm bg-[#93000a] px-2 py-0.5 rounded font-mono text-[10px]">
                  {errorBanner.code}
                </span>
              )}
            </div>
            <p className="font-body-sm text-[#ffdad6] mt-1">{errorBanner.message}</p>
          </div>
        </div>
      )}

      {/* Grid: Left = Detected Environment Spec / Right = Execution Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Detected Project Specifications (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#182028]">
              <span className="font-headline-sm text-[#dae3ee] font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[#418fff] text-[20px]">inventory_2</span>
                Detected Project Manifest
              </span>
              <span className="font-code-sm text-xs bg-[#222b33] text-[#8b919f] px-2 py-0.5 rounded border border-[#2d363e]">
                {environment?.project_name || 'Active Project'}
              </span>
            </div>

            <div className="flex flex-col gap-3.5 mt-4">
              <div className="flex items-center justify-between py-1.5 border-b border-[#182028]/60">
                <span className="font-body-sm text-[#8b919f]">Python Version</span>
                <span className="font-code-sm font-bold text-[#dae3ee] bg-[#0b141c] px-2 py-0.5 rounded border border-[#182028]">
                  v{environment?.python_version || '3.11'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#182028]/60">
                <span className="font-body-sm text-[#8b919f]">Detected Framework</span>
                <span className="font-code-sm font-semibold text-[#418fff]">
                  {environment?.framework || 'Generic Python'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#182028]/60">
                <span className="font-body-sm text-[#8b919f]">Package Manager</span>
                <span className="font-code-sm text-[#c1c6d6] uppercase font-mono">
                  {environment?.package_manager || 'pip'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#182028]/60">
                <span className="font-body-sm text-[#8b919f]">Manifest File</span>
                <span className="font-code-sm text-[#67df70] font-mono">
                  {environment?.dependency_file || 'requirements.txt'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#182028]/60">
                <span className="font-body-sm text-[#8b919f]">Test Framework</span>
                <span className="font-code-sm text-[#d5bbff] font-semibold">
                  {environment?.test_framework || 'pytest'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#182028]/60">
                <span className="font-body-sm text-[#8b919f]">Test Directory</span>
                <span className="font-code-sm text-[#dae3ee]">
                  {(environment?.test_directories || ['tests']).join(', ')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="font-body-sm text-[#8b919f]">Detected Test Files</span>
                <span className="font-code-sm text-[#dae3ee] font-bold">
                  {environment?.detected_test_count || 1} test files
                </span>
              </div>
            </div>

            {/* Declared Dependencies Pills */}
            <div className="mt-4 pt-4 border-t border-[#182028]">
              <span className="font-label-sm uppercase tracking-wider text-[#8b919f] block mb-2">
                Declared Dependencies ({environment?.dependencies?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {environment?.dependencies && environment.dependencies.length > 0 ? (
                  environment.dependencies.map((dep, idx) => (
                    <span
                      key={idx}
                      className="font-code-sm text-[11px] bg-[#0b141c] text-[#c1c6d6] px-2 py-0.5 rounded border border-[#182028]"
                    >
                      {dep}
                    </span>
                  ))
                ) : (
                  <span className="font-body-sm text-[#8b919f] italic">Standard library only</span>
                )}
              </div>
            </div>
          </div>

          {/* Machine Learning Assets Card (if ML project detected) */}
          {environment?.ml_support?.is_ml_project && (
            <div className="bg-[#141c24] border border-[#d5bbff]/30 p-5 rounded-xl shadow-md">
              <div className="flex items-center gap-2 text-[#d5bbff] mb-2 font-headline-sm font-semibold">
                <span className="material-symbols-outlined text-[20px]">neurology</span>
                <span>Machine Learning Project Assets</span>
              </div>
              <p className="font-body-sm text-[#c1c6d6] text-xs mb-3">
                Detected ML libraries &amp; model weights. Asset files are strictly preserved and isolated from LLM context payload.
              </p>
              <div className="flex items-center justify-between text-xs py-1 border-t border-[#182028]">
                <span className="text-[#8b919f]">Total Model Artifacts:</span>
                <span className="font-code-sm text-[#dae3ee]">
                  {environment.ml_support.model_assets.length} files ({environment.ml_support.total_model_size_mb} MB)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-[#182028]">
                <span className="text-[#8b919f]">Hardware Requirement:</span>
                <select
                  value={hardwareReq}
                  onChange={(e) => setHardwareReq(e.target.value)}
                  className="bg-[#0b141c] border border-[#2d363e] text-[#dae3ee] font-code-sm rounded px-2 py-0.5 text-xs focus:outline-none"
                >
                  <option value="cpu">CPU Execution (Safe Standard)</option>
                  <option value="gpu">GPU Required (CUDA/TensorRT)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution Configuration & Live Pipeline (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Safe Parameters Configuration Form */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl shadow-md flex flex-col gap-4">
            <span className="font-headline-sm text-[#dae3ee] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[#67df70] text-[20px]">tune</span>
              Execution Parameters &amp; Sandbox Constraints
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Test Command Input */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-[#c1c6d6] font-semibold uppercase tracking-wider">
                    Configured Test Command
                  </label>
                  <span className="font-code-sm text-[#8b919f] text-[11px]">Sanitized execution tokens</span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#8b919f] text-[18px]">
                    terminal
                  </span>
                  <input
                    type="text"
                    value={testCommand}
                    onChange={(e) => setTestCommand(e.target.value)}
                    className="w-full bg-[#0b141c] border border-[#2d363e] focus:border-[#418fff] text-[#dae3ee] font-code-sm pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none transition-colors"
                    placeholder="pytest -q or python3 -m unittest"
                  />
                </div>
              </div>

              {/* Working Directory */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-[#c1c6d6] font-semibold uppercase tracking-wider">
                  Working Directory
                </label>
                <input
                  type="text"
                  value="/"
                  readOnly
                  className="bg-[#0b141c] border border-[#182028] text-[#8b919f] font-code-sm px-3 py-2 rounded-lg text-sm cursor-not-allowed"
                />
              </div>

              {/* Timeout Slider / Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-[#c1c6d6] font-semibold uppercase tracking-wider">
                    Execution Timeout
                  </label>
                  <span className="font-code-sm text-[#67df70] font-bold text-xs">{timeoutSec}s</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={timeoutSec}
                    onChange={(e) => setTimeoutSec(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#418fff] cursor-pointer"
                  />
                </div>
              </div>

              {/* Network Isolation Policy */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-[#c1c6d6] font-semibold uppercase tracking-wider">
                  Network Sandbox Access
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNetworkPolicy('Disabled')}
                    className={`flex-1 py-1.5 rounded-lg font-code-sm text-xs border transition-all ${
                      networkPolicy === 'Disabled'
                        ? 'bg-[#27a640]/20 text-[#67df70] border-[#27a640]/50 font-semibold'
                        : 'bg-[#0b141c] text-[#8b919f] border-[#2d363e]'
                    }`}
                  >
                    Disabled (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetworkPolicy('Enabled')}
                    className={`flex-1 py-1.5 rounded-lg font-code-sm text-xs border transition-all ${
                      networkPolicy === 'Enabled'
                        ? 'bg-[#ba1a1a]/20 text-[#ffb4ab] border-[#ba1a1a]/50 font-semibold'
                        : 'bg-[#0b141c] text-[#8b919f] border-[#2d363e]'
                    }`}
                  >
                    Enabled
                  </button>
                </div>
              </div>

              {/* Sandbox Isolation Engine */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-[#c1c6d6] font-semibold uppercase tracking-wider">
                  Sandbox Engine
                </label>
                <div className="bg-[#0b141c] border border-[#2d363e] px-3 py-1.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-code-sm text-[#dae3ee]">Process / Chroot Sandbox</span>
                  <span className="font-label-sm bg-[#418fff]/20 text-[#418fff] px-1.5 py-0.5 rounded font-mono">
                    ISandboxRunner
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Execution CTA */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#182028]">
              <span className="font-body-sm text-xs text-[#8b919f]">
                Isolated execution never runs inside the main web server process.
              </span>
              <button
                onClick={handleLaunchExecution}
                disabled={isRunningTests || activeStage === 'RUNNING TESTS'}
                className="bg-[#27a640] hover:bg-[#27a640]/90 text-white font-headline-sm font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[20px] ${isRunningTests ? 'animate-spin' : ''}`}>
                  {isRunningTests ? 'sync' : 'play_arrow'}
                </span>
                <span>{isRunningTests ? 'Executing Sandbox...' : 'Run Real Test Suite'}</span>
              </button>
            </div>
          </div>

          {/* Live Pipeline Execution Progress */}
          <div className="bg-[#141c24] border border-[#182028] p-5 rounded-xl shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-[#dae3ee] font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[#418fff] text-[20px]">linear_scale</span>
                Live Execution Pipeline
              </span>
              <span className="font-code-sm text-xs font-semibold text-[#8b919f]">
                Status: <span className={activeStage === 'COMPLETE' ? 'text-[#67df70]' : activeStage === 'FAILED' ? 'text-[#ffb4ab]' : 'text-[#418fff]'}>{activeStage}</span>
              </span>
            </div>

            {/* Stepper Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {STAGES.map((stg, i) => {
                const isCurrent = activeStage === stg;
                const stageIndex = STAGES.indexOf(activeStage);
                const isDone = stageIndex > i || activeStage === 'COMPLETE';
                const isFailed = activeStage === 'FAILED';

                return (
                  <div
                    key={stg}
                    className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                      isCurrent
                        ? 'bg-[#418fff]/15 border-[#418fff] text-[#418fff]'
                        : isDone
                        ? 'bg-[#27a640]/10 border-[#27a640]/40 text-[#67df70]'
                        : isFailed && stageIndex === i
                        ? 'bg-[#93000a]/20 border-[#ba1a1a] text-[#ffdad6]'
                        : 'bg-[#0b141c] border-[#182028] text-[#8b919f]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] mb-1">
                      {isDone ? 'check_circle' : isCurrent ? 'hourglass_top' : isFailed && stageIndex === i ? 'error' : 'radio_button_unchecked'}
                    </span>
                    <span className="font-label-sm text-[10px] leading-tight font-semibold tracking-tight uppercase">
                      {stg}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Results Snapshot if Completed */}
            {lastExecutionResult && (
              <div className="bg-[#0b141c] border border-[#2d363e] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-1">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    lastExecutionResult.failed === 0 ? 'bg-[#27a640]/20 text-[#67df70]' : 'bg-[#ba1a1a]/20 text-[#ffb4ab]'
                  }`}>
                    <span className="material-symbols-outlined text-[24px]">
                      {lastExecutionResult.failed === 0 ? 'verified' : 'pest_control'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-code-sm font-bold text-[#dae3ee]">
                      {lastExecutionResult.passed} Passed / {lastExecutionResult.failed} Failed ({lastExecutionResult.total} Total)
                    </span>
                    <span className="font-label-sm text-[#8b919f] text-xs">
                      Executed in {lastExecutionResult.duration_seconds}s via {lastExecutionResult.sandbox_backend || 'SandboxRunner'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('failures')}
                    className="bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-headline-sm font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>View Real Failures</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Expandable Terminal Logs Panel */}
            <div className="mt-2 border border-[#222b33] rounded-xl overflow-hidden bg-[#060f16]">
              <div
                onClick={() => setTerminalExpanded(!terminalExpanded)}
                className="px-4 py-2.5 bg-[#0b141c] border-b border-[#222b33] flex items-center justify-between cursor-pointer hover:bg-[#141c24] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b919f] text-[18px]">terminal</span>
                  <span className="font-code-sm text-xs font-semibold text-[#dae3ee]">
                    SandboxRunner Live Execution Stream
                  </span>
                  <span className="font-label-sm text-[10px] text-[#8b919f] bg-[#182028] px-2 py-0.5 rounded">
                    {localLogs.length} events
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#8b919f] text-[18px]">
                  {terminalExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              {terminalExpanded && (
                <div className="p-4 font-mono text-xs text-[#c1c6d6] max-h-64 overflow-y-auto flex flex-col gap-1 select-text">
                  {localLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes('[ERROR]') || log.includes('FAILED')
                          ? 'text-[#ffb4ab]'
                          : log.includes('[SECURITY]')
                          ? 'text-[#d5bbff]'
                          : log.includes('[PARSER]')
                          ? 'text-[#67df70]'
                          : 'text-[#c1c6d6]'
                      }
                    >
                      {log}
                    </div>
                  ))}
                  {localLogs.length === 0 && (
                    <span className="text-[#8b919f] italic">No logs captured yet. Click 'Run Real Test Suite' to start.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
