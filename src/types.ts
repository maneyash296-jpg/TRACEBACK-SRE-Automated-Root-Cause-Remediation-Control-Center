export type StepId = 
  | 'upload'
  | 'overview'
  | 'project-dna'
  | 'environment'
  | 'architecture'
  | 'failures'
  | 'investigation'
  | 'test-lab'
  | 'proposed-fix'
  | 'verification'
  | 'report'
  | 'suggestions'
  | 'architecture-overview';

export interface ProjectEnvironment {
  project_name: string;
  project_path: string;
  python_version: string;
  package_manager: string;
  framework: string;
  test_framework: string;
  test_directories: string[];
  dependency_file: string;
  manifest_files: string[];
  dependencies: string[];
  test_command: string;
  working_directory: string;
  timeout_seconds: number;
  network: string;
  ml_support?: {
    is_ml_project: boolean;
    model_assets: Array<{
      name: string;
      path: string;
      size_bytes: number;
      size_mb: number;
      type: string;
    }>;
    total_model_size_mb: number;
    hardware_required: string;
    gpu_available: boolean;
    hardware_status: string;
  };
  detected_test_count?: number;
}

export interface RealTestExecutionResult {
  status: 'passed' | 'failed';
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  xfailed?: number;
  duration_seconds: number;
  exit_code: number;
  failures: Array<{
    id: string;
    test_name: string;
    exception_type: string;
    message: string;
    file: string;
    line: number;
    function: string;
    target: string;
    traceback: string;
    stack_frames?: Array<{
      file: string;
      line: number;
      function: string;
      ast_component?: any;
    }>;
  }>;
  stdout: string;
  stderr: string;
  real_execution: boolean;
  sandbox_backend?: string;
  test_command?: string;
  error_state?: string;
}

export interface ProjectDNA {
  files: number;
  total_files: number;
  functions: number;
  pure_functions: number;
  async_functions: number;
  classes: number;
  routes: number;
  tests: number;
  lines: number;
  src_lines: number;
  test_lines: number;
  sha256: string;
}

export interface GraphNode {
  id: string;
  kind: 'module' | 'function' | 'class' | 'route' | 'test';
  name: string;
  file: string;
  line_start: number;
  line_end: number;
  is_test?: boolean;
  is_hotspot?: boolean;
  args?: string[];
  metrics?: {
    complexity?: number;
    sloc?: number;
    size_bytes?: number;
  };
  callers?: string[];
  callees?: string[];
}

export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  kind: 'IMPORTS' | 'CALLS' | 'TESTS';
  is_hotspot?: boolean;
}

export interface FailureItem {
  id: string;
  severity: string;
  title: string;
  error_type: string;
  message: string;
  status: string;
  file: string;
  line: number;
  function: string;
  time: string;
  http_code: string;
  type_code: string;
  provenance: string;
  endpoint?: string;
  deduction?: string;
  payload?: any;
  traceback?: string;
  stack_frames?: any[];
}

export interface EvidenceItem {
  tier: 'FACT' | 'INFERRED' | 'HYPOTHESIS' | 'UNVERIFIED';
  provenance: string;
  target: string;
  claim: string;
  certainty: string;
}

export interface InvestigationData {
  component: string;
  target_file: string;
  target_line: number;
  probable_cause: string;
  confidence_label: string;
  confidence_basis: string;
  evidence: EvidenceItem[];
  validation_flags: {
    file_exists: boolean;
    function_exists: boolean;
    line_valid: boolean;
    status: 'CONFIRMED' | 'INFERRED' | 'UNVERIFIED';
  };
  source_context?: Array<{ line_num: number; code: string; is_crash_line: boolean }>;
  trigger_event?: string;
  callers?: string[];
  callees?: string[];
}

export interface VerificationResult {
  verified: boolean;
  status: 'PASS' | 'FAIL';
  run_id: string;
  before: { total: number; passed: number; failed: number };
  after: { total: number; passed: number; failed: number; duration: number };
  tests_added: number;
  tests_fixed: number;
  regression_rate: string;
  stdout: string;
  stderr: string;
  tests: Array<{ test: string; status: string }>;
}
