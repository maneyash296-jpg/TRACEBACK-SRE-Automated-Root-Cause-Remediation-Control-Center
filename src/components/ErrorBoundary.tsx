import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  projectId?: string;
  activeStep?: string;
  onReset?: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copiedContext: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copiedContext: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('TRACEBACK UI Crash Caught by ErrorBoundary:', {
      error,
      errorInfo,
      projectId: this.props.projectId,
      activeStep: this.props.activeStep,
      time: new Date().toISOString(),
    });
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleCopyDiagnosticLog = () => {
    const diagnosticReport = {
      title: 'TRACEBACK UI Component Crash Log',
      time: new Date().toISOString(),
      projectId: this.props.projectId || 'active',
      activeStep: this.props.activeStep || 'unknown',
      errorMessage: this.state.error?.message || 'Unknown React Rendering Error',
      errorStack: this.state.error?.stack || '',
      componentStack: this.state.errorInfo?.componentStack || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    };

    navigator.clipboard?.writeText(JSON.stringify(diagnosticReport, null, 2));
    this.setState({ copiedContext: true });
    setTimeout(() => this.setState({ copiedContext: false }), 2500);
  };

  public render() {
    if (this.state.hasError) {
      const { projectId, activeStep } = this.props;
      const { error, errorInfo, copiedContext } = this.state;

      return (
        <div className="min-h-screen bg-[#0b141c] text-[#dae3ee] p-6 flex flex-col items-center justify-center font-sans">
          <div className="max-w-4xl w-full bg-[#141c24] border border-[#ba1a1a]/60 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#182028]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#93000a]/30 border border-[#ba1a1a]/60 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#ffb4ab] text-[28px]">report_problem</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-sm uppercase tracking-widest text-[#ffb4ab] bg-[#93000a]/30 border border-[#ba1a1a]/50 px-2.5 py-0.5 rounded font-semibold text-xs">
                      UI_COMPONENT_CRASH // DIAGNOSTIC_MODE
                    </span>
                    <span className="font-code-sm text-[#8b919f]">·</span>
                    <span className="font-code-sm text-[#ffb4ab] font-mono text-xs">
                      STEP: {activeStep?.toUpperCase() || 'MAIN_VIEW'}
                    </span>
                  </div>
                  <h1 className="font-headline-xl text-[#dae3ee] font-bold tracking-tight text-xl sm:text-2xl">
                    UI Rendering Exception Trapped
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-code-sm text-xs bg-[#182028] border border-[#222b33] px-3 py-1 rounded-lg text-[#8b919f]">
                  Project: <strong className="text-[#418fff]">{projectId || 'active'}</strong>
                </span>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-[#060f16] border border-[#93000a]/40 p-4 rounded-xl flex flex-col gap-2 font-mono text-sm">
              <div className="flex items-center justify-between text-xs text-[#8b919f]">
                <span className="text-[#ffb4ab] font-bold">ERROR MESSAGE:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <p className="text-[#ffdad6] font-semibold break-words">
                {error?.message || 'An unhandled exception occurred during component lifecycle rendering.'}
              </p>
            </div>

            {/* Diagnostics Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-code-sm text-xs">
              <div className="bg-[#0b141c] border border-[#182028] p-3 rounded-lg">
                <span className="text-[#8b919f] block text-[11px]">Active Project ID</span>
                <span className="text-[#dae3ee] font-semibold block truncate mt-0.5">{projectId || 'active'}</span>
              </div>
              <div className="bg-[#0b141c] border border-[#182028] p-3 rounded-lg">
                <span className="text-[#8b919f] block text-[11px]">Trapped View Step</span>
                <span className="text-[#418fff] font-semibold block truncate mt-0.5">{activeStep || 'screen'}</span>
              </div>
              <div className="bg-[#0b141c] border border-[#182028] p-3 rounded-lg">
                <span className="text-[#8b919f] block text-[11px]">Recovery Handler</span>
                <span className="text-[#67df70] font-semibold block truncate mt-0.5">Ready (Safe Chroot)</span>
              </div>
            </div>

            {/* Component Stack Trace Accordion */}
            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-[#8b919f] uppercase tracking-wider text-xs">
                Component Stack Trace
              </span>
              <pre className="bg-[#060f16] border border-[#182028] p-4 rounded-xl text-[#c1c6d6] font-mono text-xs overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap">
                {errorInfo?.componentStack || error?.stack || 'No stack trace captured.'}
              </pre>
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#182028]">
              <button
                onClick={this.handleCopyDiagnosticLog}
                className="px-4 py-2 rounded-lg font-code-sm text-xs bg-[#182028] hover:bg-[#222b33] border border-[#2d363e] text-[#dae3ee] flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedContext ? 'done' : 'content_copy'}
                </span>
                <span>{copiedContext ? 'Diagnostic Report Copied!' : 'Copy Diagnostic Log'}</span>
              </button>

              <button
                onClick={this.handleRecover}
                className="px-6 py-2.5 rounded-lg font-code-sm text-xs bg-[#418fff] hover:bg-[#aac7ff] text-[#002959] font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>Reset View &amp; Recover App State</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
