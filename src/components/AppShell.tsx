import React from 'react';
import { StepId, ProjectEnvironment } from '../types';

interface AppShellProps {
  currentStep: StepId;
  onNavigate: (step: StepId) => void;
  aiMode: 'REAL' | 'CACHED';
  onToggleAiMode: () => void;
  onOpenSearch: () => void;
  onStartDemo: () => void;
  onResetFresh: () => void;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  environment?: ProjectEnvironment | null;
  projectId?: string;
  children: React.ReactNode;
}

const STEPS: { id: StepId; num: number; label: string }[] = [
  { id: 'upload', num: 1, label: 'Upload' },
  { id: 'overview', num: 2, label: 'Project Overview' },
  { id: 'project-dna', num: 3, label: 'Project DNA' },
  { id: 'environment', num: 4, label: 'Test Environment' },
  { id: 'architecture', num: 5, label: 'Architecture' },
  { id: 'failures', num: 6, label: 'Failures' },
  { id: 'investigation', num: 7, label: 'Investigation' },
  { id: 'test-lab', num: 8, label: 'Test Lab' },
  { id: 'proposed-fix', num: 9, label: 'Proposed Fix' },
  { id: 'verification', num: 10, label: 'Verification' },
  { id: 'report', num: 11, label: 'Report' },
  { id: 'suggestions', num: 12, label: 'Suggestions' },
  { id: 'architecture-overview', num: 13, label: 'Architecture Overview' },
];

export const AppShell: React.FC<AppShellProps> = ({
  currentStep,
  onNavigate,
  aiMode,
  onToggleAiMode,
  onOpenSearch,
  onStartDemo,
  onResetFresh,
  user,
  onSignInWithGoogle,
  onSignOut,
  environment,
  projectId,
  children,
}) => {
  const activeProjName = environment?.project_name || 'demo-shop';
  const activePyVer = environment?.python_version || '3.11';
  const activeTestFw = environment?.test_framework ? environment.test_framework.toUpperCase() : 'PYTEST';

  return (
    <div className="min-h-screen bg-[#0b141c] text-[#dae3ee] flex">
      {/* Fixed Left Sidebar (256px) */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#060f16] border-r border-[#182028] z-40 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="p-4 bg-[#141c24] border-b border-[#182028]">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => onNavigate('upload')}
              >
                {/* TRACEBACK Icon */}
                <div className="w-8 h-8 rounded-lg bg-[#182028] border border-[#2d363e] flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-[#418fff] text-[20px]">terminal</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#67df70] absolute bottom-1 right-1"></span>
                </div>
                <span className="font-headline-sm font-semibold tracking-tight text-[#dae3ee]">TRACEBACK</span>
              </div>
              <span className="font-code-sm bg-[#222b33] px-1.5 py-0.5 rounded text-[#8b919f] border border-[#2d363e]">
                v1.4
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-1.5">
              <button
                onClick={onResetFresh}
                className="font-code-sm px-2 py-0.5 rounded bg-[#93000a]/20 hover:bg-[#93000a]/40 text-[#ffb4ab] border border-[#93000a]/40 transition-colors flex items-center gap-1 text-[11px]"
                title="Wipe past analysis and start fresh with new upload"
              >
                <span className="material-symbols-outlined text-[13px]">refresh</span>
                <span>Fresh Upload</span>
              </button>
              <button
                onClick={onStartDemo}
                className="font-code-sm px-2 py-0.5 rounded bg-[#418fff]/15 hover:bg-[#418fff]/25 text-[#418fff] border border-[#418fff]/30 transition-colors text-[11px]"
                title="Reset or replay the 5-minute presentation workflow"
              >
                DEMO MODE
              </button>
            </div>
          </div>

          {/* Telemetry Core Nav Menu */}
          <div className="px-4 py-2 mt-1">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Mission Control</span>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            <button
              onClick={() => onNavigate('overview')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'overview'
                  ? 'bg-[#222b33] text-[#418fff] font-medium border border-[#418fff]/40'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#418fff]">insights</span>
                <span className="font-body-md font-medium">Project Overview</span>
              </div>
              <span className="font-code-sm bg-[#67df70]/15 text-[#67df70] px-1.5 py-0.2 rounded font-semibold text-[10px] border border-[#67df70]/30">
                HEALTH
              </span>
            </button>

            <button
              onClick={() => onNavigate('project-dna')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'project-dna'
                  ? 'bg-[#222b33] text-[#418fff] font-medium'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                <span className="font-body-md">Project DNA</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('upload')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'upload'
                  ? 'bg-[#222b33] text-[#418fff] font-medium'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">folder_data</span>
                <span className="font-body-md">Projects</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('failures')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'failures'
                  ? 'bg-[#222b33] text-[#418fff] font-medium'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">bug_report</span>
                <span className="font-body-md">Failures</span>
              </div>
              <span className="font-label-sm bg-[#93000a] text-[#ffdad6] px-1.5 py-0.5 rounded font-semibold">
                3
              </span>
            </button>

            <button
              onClick={() => onNavigate('test-lab')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'test-lab'
                  ? 'bg-[#222b33] text-[#418fff] font-medium'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">science</span>
                <span className="font-body-md">Test Lab</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('report')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'report'
                  ? 'bg-[#222b33] text-[#418fff] font-medium'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">assignment</span>
                <span className="font-body-md">Reports</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('suggestions')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'suggestions'
                  ? 'bg-[#222b33] text-[#418fff] font-medium'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span className="font-body-md">Suggestions</span>
              </div>
              <span className="font-code-sm bg-[#418fff]/20 text-[#418fff] px-1.5 py-0.2 rounded font-semibold text-[11px]">
                12
              </span>
            </button>
          </nav>

          {/* System Architecture Documentation Link */}
          <div className="px-4 py-2 mt-2">
            <span className="font-label-sm uppercase tracking-wider text-[#8b919f]">Specs &amp; Docs</span>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            <button
              onClick={() => onNavigate('architecture-overview')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                currentStep === 'architecture-overview'
                  ? 'bg-[#222b33] text-[#418fff] font-medium border border-[#418fff]/40'
                  : 'text-[#c1c6d6] hover:bg-[#182028] hover:text-[#dae3ee]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#418fff]">schema</span>
                <span className="font-body-md">Architecture Overview</span>
              </div>
              <span className="font-code-sm bg-[#418fff]/15 text-[#418fff] px-1.5 py-0.2 rounded font-semibold text-[10px] border border-[#418fff]/30">
                4 PILLARS
              </span>
            </button>
          </nav>
        </div>

        {/* Subsystem Monitor Bottom Widget */}
        <div className="p-3.5 m-2.5 rounded-lg bg-[#141c24] border border-[#182028] flex flex-col gap-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm uppercase tracking-wider text-[#d5bbff]">Subsystem Monitor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#d5bbff] animate-pulse"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-[#8b919f]">AI Provider</span>
            <div className="flex items-center justify-between">
              <span className="font-code-sm text-[#dae3ee] truncate">
                {aiMode === 'REAL' ? 'Gemini 2.5 (Router)' : 'Claude 3.7 (Router: Active)'}
              </span>
              <button
                onClick={onToggleAiMode}
                className="text-[10px] text-[#418fff] hover:underline"
                title="Toggle Live/Cached mode"
              >
                {aiMode === 'REAL' ? 'LIVE' : 'CACHE'}
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-[#8b919f]">Cache Mode</span>
            <span className="font-code-sm text-[#dae3ee] truncate">
              {aiMode === 'REAL' ? 'Live Fallback Cache' : 'Deterministic AST'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-[#8b919f]">Sandbox</span>
            <span className="font-code-sm text-[#dae3ee]">Isolated chroot</span>
          </div>
          <div className="mt-1 pt-1.5 border-t border-[#182028] flex items-center justify-between">
            <span className="font-label-sm text-[#8b919f]">Runtime</span>
            <span className="font-code-sm text-[#c1c6d6]">v1.4.2-rel</span>
          </div>
        </div>
      </aside>

      {/* Main Container (Padded left 256px) */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="fixed top-0 left-64 right-0 h-16 z-30 bg-[#060f16]/95 backdrop-blur-md border-b border-[#182028] px-6 flex items-center justify-between gap-4">
          {/* Left Context: Project Name & Git status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 bg-[#141c24] border border-[#222b33] px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[#418fff] text-[18px]">terminal</span>
              <span className="font-code-md text-[#dae3ee] font-semibold">{activeProjName}</span>
              <span className="font-code-sm text-[#8b919f]">{activeTestFw}</span>
              <span className="font-code-sm px-1.5 py-0.5 rounded bg-[#182028] text-[#8b919f]">py:{activePyVer}</span>
            </div>
            {/* Sync Status & Connection Health Indicator */}
            <div className="flex items-center gap-2 bg-[#141c24] border border-[#222b33] px-2.5 py-1 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67df70] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#67df70]"></span>
              </span>
              <span className="font-code-sm text-xs text-[#8b919f]">
                Sync Status: <span className="text-[#dae3ee] font-semibold">{projectId || 'active'}</span>
                <span className="text-[#67df70] ml-1.5 font-medium">(Connected)</span>
              </span>
            </div>
          </div>

          {/* Center Search Input (Cmd + K) */}
          <div className="flex-1 max-w-xl mx-4">
            <div 
              onClick={onOpenSearch}
              className="relative flex items-center cursor-pointer group"
            >
              <span className="material-symbols-outlined absolute left-3 text-[#8b919f] text-[18px] group-hover:text-[#dae3ee]">
                search
              </span>
              <input
                className="w-full bg-[#141c24] border border-[#222b33] text-[#dae3ee] font-code-sm pl-10 pr-16 py-1.5 rounded-lg focus:outline-none cursor-pointer placeholder:text-[#8b919f]"
                placeholder="Jump to file, symbol, failure or trace (Cmd + K)"
                readOnly
                type="text"
              />
              <kbd className="absolute right-3 font-code-sm text-[#8b919f] bg-[#182028] px-1.5 py-0.5 rounded border border-[#2d363e]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right SRE Telemetry & Firebase Auth Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Architecture Overview Quick Link */}
            <button
              onClick={() => onNavigate('architecture-overview')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg border font-code-sm text-xs transition-colors ${
                currentStep === 'architecture-overview'
                  ? 'bg-[#418fff]/20 text-[#418fff] border-[#418fff]/50'
                  : 'bg-[#141c24] hover:bg-[#182028] text-[#8b919f] hover:text-[#dae3ee] border-[#222b33]'
              }`}
              title="View TRACEBACK 4 Pillars & Sequence Diagram"
            >
              <span className="material-symbols-outlined text-[15px] text-[#418fff]">schema</span>
              <span>4 Pillars Spec</span>
            </button>

            {/* Cloud Firestore Status Badge */}
            <div className="hidden xl:flex items-center gap-1.5 bg-[#141c24] border border-[#222b33] px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-[#67df70]"></span>
              <span className="font-code-sm text-xs text-[#8b919f]">
                Firestore: <span className="text-[#67df70]">Connected</span>
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-[#182028]">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Developer'}
                    className="w-8 h-8 rounded-full border border-[#2d363e] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#418fff] flex items-center justify-center text-[#002959] font-bold text-xs">
                    {(user.displayName || user.email || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left max-w-[130px] truncate">
                  <span className="font-code-sm text-[#dae3ee] font-medium text-xs truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="font-label-sm text-[#67df70] text-[10px]">Cloud Auth Active</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="text-[#8b919f] hover:text-[#ffb4ab] p-1.5 rounded-lg hover:bg-[#182028] transition-colors"
                  title="Sign out of Firebase"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInWithGoogle}
                className="bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] hover:text-white font-code-sm text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-xs"
                title="Authenticate with Google via Firebase Auth"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Workflow Breadcrumb Stepper Ribbon */}
        <div className="pt-20 px-6 pb-2">
          <div className="bg-[#141c24] border border-[#182028] rounded-xl p-2 overflow-x-auto">
            <nav className="flex items-center min-w-max gap-1">
              {STEPS.map((step, idx) => {
                const isActive = currentStep === step.id;
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => onNavigate(step.id)}
                      className={`px-3 py-1.5 rounded-lg font-code-sm flex items-center gap-1.5 transition-colors ${
                        isActive
                          ? 'bg-[#418fff] text-[#002959] font-semibold shadow-md'
                          : 'text-[#c1c6d6] hover:bg-[#222b33] hover:text-[#dae3ee]'
                      }`}
                    >
                      <span className={`font-label-sm ${isActive ? 'text-[#002959]' : 'text-[#8b919f]'}`}>
                        {step.num}
                      </span>
                      <span>{step.label}</span>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <span className="material-symbols-outlined text-[#414753] text-[14px]">
                        chevron_right
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Screen Content Area */}
        <main className="flex-1 px-6 py-4">
          {children}
        </main>
      </div>
    </div>
  );
};
