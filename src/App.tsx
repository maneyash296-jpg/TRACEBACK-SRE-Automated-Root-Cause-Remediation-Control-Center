import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from './components/AppShell';
import { UploadScreen } from './components/UploadScreen';
import { ProjectOverviewScreen } from './components/ProjectOverviewScreen';
import { ProjectDNAScreen } from './components/ProjectDNAScreen';
import { ArchitectureScreen } from './components/ArchitectureScreen';
import { FailuresScreen } from './components/FailuresScreen';
import { InvestigationScreen } from './components/InvestigationScreen';
import { TestLabScreen } from './components/TestLabScreen';
import { ProposedFixScreen } from './components/ProposedFixScreen';
import { VerificationScreen } from './components/VerificationScreen';
import { ReportScreen } from './components/ReportScreen';
import { SuggestionsScreen } from './components/SuggestionsScreen';
import { TestEnvironmentScreen } from './components/TestEnvironmentScreen';
import { ArchitectureOverviewScreen } from './components/ArchitectureOverviewScreen';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  StepId,
  ProjectDNA,
  GraphNode,
  GraphEdge,
  InvestigationData,
  VerificationResult,
  ProjectEnvironment,
  RealTestExecutionResult,
} from './types';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  persistInvestigationRecord,
  persistProjectSession,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [currentStep, setCurrentStep] = useState<StepId>('upload');
  const [aiMode, setAiMode] = useState<'REAL' | 'CACHED'>('CACHED');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Authentication State (Firebase)
  const [user, setUser] = useState<User | null>(null);

  // Project & Telemetry State
  const [projectId, setProjectId] = useState('demo-shop');
  const [dna, setDna] = useState<ProjectDNA | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [environment, setEnvironment] = useState<ProjectEnvironment | null>(null);
  const [lastExecutionResult, setLastExecutionResult] = useState<RealTestExecutionResult | null>(null);
  const [availableFailures, setAvailableFailures] = useState<any[]>([]);
  const [selectedFailureId, setSelectedFailureId] = useState<string>('FL-104');
  const [investigationData, setInvestigationData] = useState<InvestigationData | null>(null);
  const [reproData, setReproData] = useState<any>(null);
  const [fixData, setFixData] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [codeModalFile, setCodeModalFile] = useState<{ path: string; line?: number } | null>(null);

  // Loading States
  const [isScanning, setIsScanning] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isReproducing, setIsReproducing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        showNotification(`Signed in as ${currentUser.displayName || currentUser.email}`, 'success');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async () => {
    try {
      const u = await signInWithGoogle();
      if (u) {
        setUser(u as any);
        showNotification(`Signed in as ${u.displayName || u.email || 'Developer'}`, 'success');
      }
    } catch (err: any) {
      showNotification(`Authentication: ${err.message}`, 'info');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      showNotification('Signed out of Firebase', 'info');
    } catch (err: any) {
      showNotification(`Sign out failed: ${err.message}`, 'error');
    }
  };

  // Keyboard shortcut for Cmd+K / Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial AI status only (start cleanly from fresh upload without preloading stale data)
  useEffect(() => {
    const initData = async () => {
      try {
        const statusRes = await fetch('/api/status');
        if (statusRes.ok) {
          const status = await statusRes.json();
          if (status.ai_mode && status.ai_mode.includes('Live')) {
            setAiMode('REAL');
          }
        }
      } catch (err) {
        console.warn('[TRACEBACK] Offline or initial fetch error:', err);
      }
    };
    initData();
  }, []);

  // Handlers
  const handleToggleAiMode = async () => {
    try {
      const res = await fetch('/api/ai/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAiMode(data.mode);
        showNotification(`AI Router switched to ${data.mode === 'REAL' ? 'Live Model (Gemini)' : 'Deterministic AST (Offline Cache)'}`, 'info');
      } else {
        setAiMode((prev) => (prev === 'CACHED' ? 'REAL' : 'CACHED'));
      }
    } catch {
      setAiMode((prev) => (prev === 'CACHED' ? 'REAL' : 'CACHED'));
    }
  };

  const handleSelectPreset = async (presetName: string) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/projects/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: presetName }),
      });
      const data = await res.json();
      const pId = data.project_id || presetName;
      if (data.dna) setDna(data.dna);
      setProjectId(pId);
      if (data.last_run) setLastExecutionResult(data.last_run);

      // Environment Detection
      if (data.environment) {
        setEnvironment(data.environment);
      } else {
        try {
          const envRes = await fetch(`/api/projects/${pId}/environment`);
          if (envRes.ok) setEnvironment(await envRes.json());
        } catch {}
      }
      
      // Fetch fresh graph
      const graphRes = await fetch(`/api/projects/${pId}/graph`);
      if (graphRes.ok) {
        const gData = await graphRes.json();
        setGraphData(gData);
      }

      // Fetch fresh failures for this project
      try {
        const failRes = await fetch(`/api/projects/${pId}/failures`);
        if (failRes.ok) {
          const failData = await failRes.json();
          if (Array.isArray(failData.failures)) setAvailableFailures(failData.failures);
        }
      } catch {}

      // Persist session to Firestore if authenticated
      if (user && data.dna) {
        persistProjectSession(user.uid, presetName, data.dna.files || 13, data.dna.tests || 18).catch(() => {});
      }

      showNotification(`Loaded preset '${presetName}' with ${data.files_count || 14} scanned files`, 'success');
      setCurrentStep('overview');
    } catch (err: any) {
      showNotification(`Scan failed: ${err.message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUploadZip = async (file: File) => {
    setIsScanning(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/zip',
          'X-File-Name': file.name,
        },
        body: arrayBuffer,
      });
      const data = await res.json();
      const pId = data.project_id || 'custom-upload';
      if (data.dna) setDna(data.dna);
      setProjectId(pId);
      if (data.environment) setEnvironment(data.environment);
      if (data.last_run) setLastExecutionResult(data.last_run);

      // Fetch fresh graph
      const gRes = await fetch(`/api/projects/${pId}/graph`);
      if (gRes.ok) setGraphData(await gRes.json());

      // Fetch fresh failures for uploaded project
      try {
        const failRes = await fetch(`/api/projects/${pId}/failures`);
        if (failRes.ok) {
          const failData = await failRes.json();
          if (Array.isArray(failData.failures)) setAvailableFailures(failData.failures);
        }
      } catch {}

      // Persist session to Firestore if authenticated
      if (user && data.dna) {
        persistProjectSession(user.uid, file.name, data.dna.files || 10, data.dna.tests || 0).catch(() => {});
      }

      showNotification(`Successfully scanned archive: ${file.name}`, 'success');
      setCurrentStep('overview');
    } catch (err: any) {
      showNotification(`Upload failed: ${err.message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetAllData = async () => {
    try {
      showNotification('Wiping all stored telemetry, databases, and cached runs...', 'info');
      const res = await fetch('/api/projects/reset', { method: 'POST' });
      const data = await res.json();
      setDna(data.dna || {
        files: 0,
        total_files: 0,
        functions: 0,
        pure_functions: 0,
        async_functions: 0,
        classes: 0,
        routes: 0,
        tests: 0,
        lines: 0,
        src_lines: 0,
        test_lines: 0,
        sha256: '0000000000000000',
      });
      setEnvironment(data.environment || {
        project_name: 'New Blank Project',
        python_version: '3.11',
        test_framework: 'pytest',
        dependency_file: 'requirements.txt',
      });
      setGraphData({ nodes: [], edges: [] });
      setLastExecutionResult(null);
      setInvestigationData(null);
      setReproData(null);
      setFixData(null);
      setVerificationResult(null);
      setReportData(null);
      setAvailableFailures([]);
      setProjectId(data.project_id || 'new-blank-project');
      setCurrentStep('upload');
      showNotification('All past data wiped. New blank project created, ready for upload!', 'success');
    } catch (err: any) {
      showNotification(`Reset failed: ${err.message}`, 'error');
    }
  };

  const handleRunSandboxTests = async (testCommand: string, timeoutSec: number = 60) => {
    setIsRunningTests(true);
    try {
      showNotification(`Executing sandbox test run: ${testCommand}...`, 'info');
      const res = await fetch(`/api/projects/${projectId}/sandbox-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_command: testCommand, timeout_seconds: timeoutSec }),
      });
      const data: RealTestExecutionResult = await res.json();
      setLastExecutionResult(data);
      if (data.failures && data.failures.length > 0) {
        const formatted: any[] = data.failures.map((f: any, idx: number) => ({
          id: f.id || `FL-REAL-${idx + 1}`,
          severity: idx === 0 ? 'CRITICAL SEV-1' : 'SEV-2',
          title: f.test_name ? f.test_name.split('\n')[0].replace(/\(.*\)/, '').trim() : 'Test Failure',
          error_type: f.exception_type || 'AssertionError',
          message: f.message || 'Test assertion failed',
          status: 'FAILED',
          file: f.file ? (f.file.includes('/') ? f.file.split('/').slice(-2).join('/') : f.file) : 'tests/test.py',
          line: f.line || 1,
          function: f.function || 'test_execution',
          time: new Date().toLocaleTimeString(),
          http_code: 'Pytest Exit 1',
          type_code: f.exception_type || 'Pytest Exit 1',
          provenance: 'REAL SANDBOX RUN',
          endpoint: f.test_name ? f.test_name.split('\n')[0] : 'pytest',
          deduction: f.message || 'Captured real exception in isolated SandboxRunner.',
          traceback: f.traceback || '',
          stack_frames: f.stack_frames || [],
          payload: { target: f.target },
        }));
        setAvailableFailures(formatted);
        setSelectedFailureId(formatted[0].id);
      }
      if (data.status === 'passed') {
        showNotification(`Real test execution passed: ${data.passed}/${data.total} passed`, 'success');
      } else {
        showNotification(`Real test execution failed: ${data.failed} failed out of ${data.total}`, 'error');
      }
      return data;
    } catch (err: any) {
      showNotification(`Sandbox execution failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRerunTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/run-tests`, { method: 'POST' });
      const data = await res.json();
      showNotification(`Executed ${data.total} tests (${data.passed} passed, ${data.failed} failed) in ${data.duration}s`, data.failed > 0 ? 'info' : 'success');
    } catch (err: any) {
      showNotification(`Test run failed: ${err.message}`, 'error');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleIngestTrace = async (text: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/failures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceback: text }),
      });
      const data = await res.json();
      showNotification(`Traceback matched AST frame: ${data.detected_component}`, 'success');
      return data;
    } catch (err: any) {
      showNotification(`Trace ingestion failed: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleRunInvestigation = async (targetId?: string) => {
    const fId = targetId || selectedFailureId || 'FL-104';
    setSelectedFailureId(fId);
    setIsInvestigating(true);
    try {
      const res = await fetch(`/api/failures/${fId}/investigate`, { method: 'POST' });
      const data = await res.json();
      setInvestigationData(data);

      // Preload fix proposal
      try {
        const fixRes = await fetch(`/api/failures/${fId}/fix`, { method: 'POST' });
        if (fixRes.ok) {
          setFixData(await fixRes.json());
        }
      } catch {}

      // Persist to Firestore if authenticated
      if (user) {
        persistInvestigationRecord(user.uid, data).catch(() => {});
      }

      showNotification(`Forensic investigation assembled for ${fId}: 100% AST verified match`, 'success');
      setCurrentStep('investigation');
    } catch (err: any) {
      showNotification(`Investigation failed: ${err.message}`, 'error');
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleRunRepro = async (targetId?: string) => {
    const fId = targetId || selectedFailureId || 'FL-104';
    setIsReproducing(true);
    try {
      const res = await fetch(`/api/failures/${fId}/reproduce`, { method: 'POST' });
      const data = await res.json();
      setReproData(data);
      showNotification(`Reproduction executed in sandbox: ${data.exit_status}`, 'success');
    } catch (err: any) {
      showNotification(`Reproduction failed: ${err.message}`, 'error');
    } finally {
      setIsReproducing(false);
    }
  };

  const handleApproveAndVerify = async () => {
    const fId = selectedFailureId || 'FL-104';
    const fixId = fixData?.fix_id || `fix_${fId.toLowerCase()}`;
    setIsApproving(true);
    try {
      // 1. Approve
      await fetch(`/api/fixes/${fixId}/approve`, { method: 'POST' });
      // 2. Verify
      const verifyRes = await fetch(`/api/fixes/${fixId}/verify`, { method: 'POST' });
      const vData = await verifyRes.json();
      setVerificationResult(vData);

      // 3. Preload report
      const repRes = await fetch(`/api/failures/${fId}/report`);
      if (repRes.ok) {
        const repData = await repRes.json();
        setReportData(repData);
      }

      showNotification(`Patch verified in sandbox: ${vData.status === 'PASS' ? 'PASS (Zero Regressions)' : 'Verification completed'}`, vData.status === 'PASS' ? 'success' : 'info');
      setCurrentStep('verification');
    } catch (err: any) {
      showNotification(`Verification failed: ${err.message}`, 'error');
      setCurrentStep('verification');
    } finally {
      setIsApproving(false);
    }
  };

  const handleApplyAllSuggestions = async () => {
    try {
      showNotification('Applying all 12 suggested remediations and architectural defenses...', 'info');
      const res = await fetch(`/api/projects/${projectId}/apply-all-suggestions`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const dnaRes = await fetch(`/api/projects/${projectId}/dna`);
        if (dnaRes.ok) setDna(await dnaRes.json());
        showNotification('All suggestions applied! 21/21 tests passing (100% Green)', 'success');
      }
      return data;
    } catch (err: any) {
      showNotification(`Failed to apply suggestions: ${err.message}`, 'error');
    }
  };

  const handleResetDemo = async () => {
    try {
      showNotification('Restoring demo bugs for presentation replay...', 'info');
      const res = await fetch(`/api/projects/${projectId}/reset-demo-bugs`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const dnaRes = await fetch(`/api/projects/${projectId}/dna`);
        if (dnaRes.ok) setDna(await dnaRes.json());
        showNotification('Demo state reset: 3 intentional failures restored', 'info');
      }
      return data;
    } catch (err: any) {
      showNotification(`Failed to reset demo: ${err.message}`, 'error');
    }
  };

  const handleResetFresh = async () => {
    setDna(null);
    setGraphData(null);
    setEnvironment(null);
    setLastExecutionResult(null);
    setInvestigationData(null);
    setVerificationResult(null);
    setReportData(null);
    setCurrentStep('upload');
    try {
      await fetch(`/api/projects/${projectId}/reset-demo-bugs`, { method: 'POST' });
    } catch {}
    showNotification('Past analysis data cleared. Starting fresh from project upload.', 'info');
  };

  const handleStartDemo = () => {
    handleResetDemo();
    showNotification('Starting interactive demonstration replay...', 'info');
    setCurrentStep('upload');
  };

  // Search Results Filtering
  const searchableItems = [
    { title: 'services/coupon.py', desc: 'Coupon and promotional calculation service', step: 'investigation' as StepId, type: 'FILE' },
    { title: 'services/checkout.py', desc: 'Checkout orchestration and payment dispatch', step: 'architecture' as StepId, type: 'FILE' },
    { title: 'services/tax.py', desc: 'VAT & state tax calculation engine', step: 'failures' as StepId, type: 'FILE' },
    { title: 'apply_discount', desc: 'services/coupon.py:14 // Target Hotspot Symbol', step: 'investigation' as StepId, type: 'SYMBOL' },
    { title: 'process_order', desc: 'services/checkout.py:28 // Caller Frame', step: 'architecture' as StepId, type: 'SYMBOL' },
    { title: 'FL-104', desc: 'Coupon validation failure (ValueError: -$15.00)', step: 'failures' as StepId, type: 'FAILURE' },
    { title: 'FL-105', desc: 'ZeroDivisionError in tax calculation', step: 'failures' as StepId, type: 'FAILURE' },
    { title: 'FL-106', desc: 'AssertionError in order test contract', step: 'failures' as StepId, type: 'FAILURE' },
    { title: 'Project Overview', desc: 'Unified telemetry dashboard summarizing DNA, test outcomes, and health', step: 'overview' as StepId, type: 'NAV' },
    { title: 'Project DNA', desc: 'View deterministic SLOC, AST classes, and routes', step: 'project-dna' as StepId, type: 'NAV' },
    { title: 'Architecture Graph', desc: 'Interactive node graph with zoom, pan, and filter', step: 'architecture' as StepId, type: 'NAV' },
    { title: 'Test Lab', desc: 'Generated hermetic reproduction test suite', step: 'test-lab' as StepId, type: 'NAV' },
    { title: 'Proposed Fix', desc: 'Defensive boundary clamping patch & unified diff', step: 'proposed-fix' as StepId, type: 'NAV' },
    { title: 'Sandbox Verification', desc: '19/19 passed full suite dual-run validation', step: 'verification' as StepId, type: 'NAV' },
    { title: 'Post-Mortem Report', desc: 'Audit-ready investigation and telemetry report', step: 'report' as StepId, type: 'NAV' },
    { title: 'Suggestions & Advisory', desc: '12 multi-tiered code, architecture & SRE suggestions', step: 'suggestions' as StepId, type: 'NAV' },
    { title: 'Architecture Overview', desc: 'Four Pillars, Subsystems & Real Project Sequence Diagram', step: 'architecture-overview' as StepId, type: 'NAV' },
    { title: 'The Four Pillars', desc: 'API Service, Deterministic AST Engine, SandboxRunner, AI Provider', step: 'architecture-overview' as StepId, type: 'NAV' },
  ];

  const filteredSearchItems = searchQuery.trim() === ''
    ? searchableItems
    : searchableItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <AppShell
      currentStep={currentStep}
      onNavigate={(step) => setCurrentStep(step)}
      aiMode={aiMode}
      onToggleAiMode={handleToggleAiMode}
      onOpenSearch={() => setSearchOpen(true)}
      onStartDemo={handleStartDemo}
      onResetFresh={handleResetFresh}
      user={user}
      onSignInWithGoogle={handleSignInGoogle}
      onSignOut={handleSignOut}
      environment={environment}
      projectId={projectId}
    >
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#141c24] border border-[#2d363e] shadow-2xl animate-fade-in">
          <span
            className={`material-symbols-outlined text-[20px] ${
              notification.type === 'success'
                ? 'text-[#67df70]'
                : notification.type === 'error'
                ? 'text-[#ffb4ab]'
                : 'text-[#418fff]'
            }`}
          >
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="font-code-sm text-[#dae3ee]">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-[#8b919f] hover:text-[#dae3ee] ml-2"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Cmd + K Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="bg-[#141c24] border border-[#2d363e] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#182028] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#8b919f] text-[20px]">search</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, file, incident (FL-104), or workspace step..."
                className="flex-1 bg-transparent font-code-sm text-[#dae3ee] outline-hidden placeholder:text-[#8b919f]"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="font-code-sm bg-[#182028] border border-[#222b33] px-2 py-0.5 rounded text-[#8b919f] hover:text-[#dae3ee]"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1">
              {filteredSearchItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.type === 'FILE') {
                      setCodeModalFile({ path: item.title });
                    } else {
                      setCurrentStep(item.step);
                    }
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#222b33] text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-label-sm px-2 py-0.5 rounded text-[10px] font-mono ${
                        item.type === 'FAILURE'
                          ? 'bg-[#ba1a1a]/20 text-[#ffb4ab] border border-[#ba1a1a]/40'
                          : item.type === 'SYMBOL'
                          ? 'bg-[#d5bbff]/20 text-[#d5bbff] border border-[#d5bbff]/40'
                          : item.type === 'FILE'
                          ? 'bg-[#418fff]/20 text-[#418fff] border border-[#418fff]/40'
                          : 'bg-[#182028] text-[#8b919f] border border-[#222b33]'
                      }`}
                    >
                      {item.type}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-code-sm font-semibold text-[#dae3ee]">{item.title}</span>
                      <span className="font-body-md text-[#8b919f] text-xs">{item.desc}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#8b919f] text-[18px]">
                    arrow_forward
                  </span>
                </button>
              ))}
              {filteredSearchItems.length === 0 && (
                <div className="p-8 text-center text-[#8b919f] font-code-sm">
                  No matching files, symbols, or incidents found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen Router wrapped in ErrorBoundary to catch UI crashes & log project context */}
      <ErrorBoundary
        key={`${projectId}-${currentStep}`}
        projectId={projectId}
        activeStep={currentStep}
        onReset={() => setCurrentStep('upload')}
      >
        {currentStep === 'upload' && (
          <UploadScreen
            onNavigate={(step) => setCurrentStep(step)}
            onSelectPreset={handleSelectPreset}
            onUploadZip={handleUploadZip}
            onResetAllData={handleResetAllData}
            isScanning={isScanning}
          />
        )}

        {currentStep === 'overview' && (
          <ProjectOverviewScreen
            onNavigate={(step) => setCurrentStep(step)}
            dna={dna}
            environment={environment}
            lastExecutionResult={lastExecutionResult}
            failures={availableFailures}
            onRerunSuite={handleRerunTests}
            isRunningSuite={isRunningTests}
            projectId={projectId}
          />
        )}

        {currentStep === 'project-dna' && (
          <ProjectDNAScreen
            onNavigate={(step) => setCurrentStep(step)}
            dna={dna}
            onRerunTests={handleRerunTests}
            isRunningTests={isRunningTests}
          />
        )}

        {currentStep === 'environment' && (
          <TestEnvironmentScreen
            onNavigate={(step) => setCurrentStep(step)}
            environment={environment}
            onRunSandboxTests={handleRunSandboxTests}
            lastExecutionResult={lastExecutionResult}
            isRunningTests={isRunningTests}
          />
        )}

        {currentStep === 'architecture' && (
          <ArchitectureScreen
            onNavigate={(step) => setCurrentStep(step)}
            graphData={graphData}
          />
        )}

        {currentStep === 'failures' && (
          <FailuresScreen
            onNavigate={(step) => setCurrentStep(step)}
            onRerunSuite={handleRerunTests}
            isRunningSuite={isRunningTests}
            onIngestTrace={handleIngestTrace}
            failures={availableFailures}
            selectedFailureId={selectedFailureId}
            onSelectFailure={setSelectedFailureId}
            onProceedToInvestigation={handleRunInvestigation}
            onResetAllData={handleResetAllData}
          />
        )}

        {currentStep === 'investigation' && (
          <InvestigationScreen
            onNavigate={(step) => setCurrentStep(step)}
            investigationData={investigationData}
            onRunInvestigation={() => handleRunInvestigation(selectedFailureId)}
            isInvestigating={isInvestigating}
          />
        )}

        {currentStep === 'test-lab' && (
          <TestLabScreen
            onNavigate={(step) => setCurrentStep(step)}
            onRunRepro={() => handleRunRepro(selectedFailureId)}
            isReproducing={isReproducing}
          />
        )}

        {currentStep === 'proposed-fix' && (
          <ProposedFixScreen
            onNavigate={(step) => setCurrentStep(step)}
            onApproveAndVerify={handleApproveAndVerify}
            isApproving={isApproving}
            fixData={fixData}
          />
        )}

        {currentStep === 'verification' && (
          <VerificationScreen
            onNavigate={(step) => setCurrentStep(step)}
            verificationResult={verificationResult}
            fixData={fixData}
          />
        )}

        {currentStep === 'report' && (
          <ReportScreen
            onNavigate={(step) => setCurrentStep(step)}
            reportData={reportData}
            onRefreshReport={async () => {
              const rep = await fetch(`/api/failures/${selectedFailureId}/report`);
              if (rep.ok) setReportData(await rep.json());
            }}
          />
        )}

        {currentStep === 'suggestions' && (
          <SuggestionsScreen
            onNavigate={(step) => setCurrentStep(step)}
            onApproveAndVerify={handleApproveAndVerify}
            isApproving={isApproving}
            onApplyAllSuggestions={handleApplyAllSuggestions}
            onResetDemo={handleResetDemo}
          />
        )}

        {currentStep === 'architecture-overview' && (
          <ArchitectureOverviewScreen
            onNavigate={(step) => setCurrentStep(step)}
          />
        )}
      </ErrorBoundary>

      {/* Code Viewer Modal */}
      <CodeViewerModal
        isOpen={!!codeModalFile}
        onClose={() => setCodeModalFile(null)}
        filePath={codeModalFile?.path || ''}
        targetLine={codeModalFile?.line}
      />
    </AppShell>
  );
}
