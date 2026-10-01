"""
TRACEBACK Project Environment & Dependency Detector
Inspects repository configuration, manifests, lockfiles, test directories,
and Machine Learning assets.
"""
import os
import re
from typing import Dict, List, Any, Optional

ML_EXTENSIONS = {".pt", ".pth", ".bin", ".onnx", ".h5", ".safetensors", ".pkl", ".tflite", ".ckpt"}
ML_LIBRARIES = {"torch", "tensorflow", "transformers", "scikit-learn", "sklearn", "keras", "jax", "cv2", "numpy", "pandas"}

class EnvironmentDetector:
    def __init__(self, project_path: str, project_name: Optional[str] = None):
        self.project_path = os.path.abspath(project_path)
        self.project_name = project_name

    def detect(self) -> Dict[str, Any]:
        """
        Inspects project manifests and directory structure to produce
        the deterministic Environment Configuration.
        """
        # Determine clean display name
        computed_name = self.project_name
        if not computed_name or computed_name.startswith("upload_") or computed_name.startswith("proj_"):
            computed_name = os.path.basename(self.project_path)
            if computed_name.startswith("upload_") or computed_name.startswith("proj_"):
                computed_name = "Uploaded Python Project"

        config = {
            "project_name": computed_name,
            "project_path": self.project_path,
            "python_version": self._detect_python_version(),
            "package_manager": self._detect_package_manager(),
            "framework": self._detect_framework(),
            "test_framework": self._detect_test_framework(),
            "test_directories": self._detect_test_dirs(),
            "dependency_file": self._detect_primary_dep_file(),
            "manifest_files": self._list_manifest_files(),
            "dependencies": self._extract_dependencies(),
            "test_command": "pytest -q",
            "working_directory": "/",
            "timeout_seconds": 60,
            "network": "Disabled",
            "ml_support": self._detect_ml_assets(),
            "detected_test_count": self._count_test_files()
        }

        # If pytest files found or pyproject.toml has pytest
        if config["test_framework"] == "pytest":
            config["test_command"] = "pytest -q"
        else:
            config["test_command"] = "python3 -m unittest discover tests"

        return config

    def _detect_python_version(self) -> str:
        # Check pyproject.toml
        pyproject = os.path.join(self.project_path, "pyproject.toml")
        if os.path.exists(pyproject):
            try:
                with open(pyproject, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    m = re.search(r'python_version\s*=\s*["\']([^"\']+)["\']', content)
                    if m:
                        return m.group(1)
                    m2 = re.search(r'requires-python\s*=\s*["\']([^"\']+)["\']', content)
                    if m2:
                        return m2.group(1).replace(">=", "").strip()
            except Exception:
                pass

        # Check setup.cfg
        setup_cfg = os.path.join(self.project_path, "setup.cfg")
        if os.path.exists(setup_cfg):
            try:
                with open(setup_cfg, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    m = re.search(r'python_requires\s*=\s*([^\n]+)', content)
                    if m:
                        return m.group(1).replace(">=", "").strip()
            except Exception:
                pass

        # Default system Python
        return "3.11"

    def _detect_package_manager(self) -> str:
        if os.path.exists(os.path.join(self.project_path, "poetry.lock")):
            return "poetry"
        if os.path.exists(os.path.join(self.project_path, "Pipfile.lock")) or os.path.exists(os.path.join(self.project_path, "Pipfile")):
            return "pipenv"
        if os.path.exists(os.path.join(self.project_path, "flit.ini")):
            return "flit"
        return "pip"

    def _detect_framework(self) -> str:
        deps = self._extract_dependencies()
        dep_str = " ".join(deps).lower()
        if "fastapi" in dep_str:
            return "FastAPI"
        if "django" in dep_str:
            return "Django"
        if "flask" in dep_str:
            return "Flask"
        if "tornado" in dep_str:
            return "Tornado"

        # Check imports in python files
        for root, _, files in os.walk(self.project_path):
            for file in files:
                if file.endswith(".py"):
                    try:
                        with open(os.path.join(root, file), "r", encoding="utf-8", errors="ignore") as pf:
                            c = pf.read(1024)
                            if "from fastapi" in c or "import fastapi" in c:
                                return "FastAPI"
                            if "from django" in c or "import django" in c:
                                return "Django"
                            if "from flask" in c or "import flask" in c:
                                return "Flask"
                    except Exception:
                        pass
        return "Generic Python"

    def _detect_test_framework(self) -> str:
        if os.path.exists(os.path.join(self.project_path, "pytest.ini")) or os.path.exists(os.path.join(self.project_path, "conftest.py")):
            return "pytest"
        pyproject = os.path.join(self.project_path, "pyproject.toml")
        if os.path.exists(pyproject):
            try:
                with open(pyproject, "r", encoding="utf-8", errors="ignore") as f:
                    if "[tool.pytest" in f.read():
                        return "pytest"
            except Exception:
                pass

        # Inspect test files
        for root, _, files in os.walk(self.project_path):
            for file in files:
                if (file.startswith("test_") or file.endswith("_test.py")) and file.endswith(".py"):
                    try:
                        with open(os.path.join(root, file), "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read(2048)
                            if "import pytest" in content or "@pytest" in content:
                                return "pytest"
                    except Exception:
                        pass
        return "pytest"  # Default modern Python standard

    def _detect_test_dirs(self) -> List[str]:
        candidates = ["tests", "test", "tests/unit", "tests/integration", "src/tests"]
        found = []
        for c in candidates:
            if os.path.isdir(os.path.join(self.project_path, c)):
                found.append(c)
        return found if found else ["tests"]

    def _detect_primary_dep_file(self) -> str:
        priority = [
            "requirements.txt",
            "pyproject.toml",
            "Pipfile",
            "setup.py",
            "setup.cfg",
            "requirements-dev.txt",
            "dev-requirements.txt"
        ]
        for p in priority:
            if os.path.exists(os.path.join(self.project_path, p)):
                return p
        return "requirements.txt (Standard)"

    def _list_manifest_files(self) -> List[str]:
        files = []
        for name in ["pyproject.toml", "requirements.txt", "requirements-dev.txt", "Pipfile", "setup.py", "setup.cfg", "pytest.ini", "tox.ini"]:
            if os.path.exists(os.path.join(self.project_path, name)):
                files.append(name)
        return files

    def _extract_dependencies(self) -> List[str]:
        deps = []
        req_file = os.path.join(self.project_path, "requirements.txt")
        if os.path.exists(req_file):
            try:
                with open(req_file, "r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            deps.append(line.split("==")[0].split(">=")[0].split("<=")[0].strip())
            except Exception:
                pass

        pyproj = os.path.join(self.project_path, "pyproject.toml")
        if os.path.exists(pyproj):
            try:
                with open(pyproj, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    # extract dependencies list
                    match = re.search(r'dependencies\s*=\s*\[(.*?)\]', content, re.DOTALL)
                    if match:
                        raw_items = match.group(1).split(",")
                        for item in raw_items:
                            cleaned = item.strip().strip('"').strip("'")
                            if cleaned:
                                deps.append(cleaned.split("==")[0].split(">=")[0].strip())
            except Exception:
                pass

        return list(dict.fromkeys(deps))

    def _detect_ml_assets(self) -> Dict[str, Any]:
        ml_files = []
        total_size = 0
        is_ml = False

        # Check dependencies for ML libraries
        deps = [d.lower() for d in self._extract_dependencies()]
        if any(lib in deps for lib in ML_LIBRARIES):
            is_ml = True

        for root, _, files in os.walk(self.project_path):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in ML_EXTENSIONS:
                    full_p = os.path.join(root, f)
                    sz = os.path.getsize(full_p)
                    rel_p = os.path.relpath(full_p, self.project_path)
                    ml_files.append({
                        "name": f,
                        "path": rel_p,
                        "size_bytes": sz,
                        "size_mb": round(sz / (1024 * 1024), 2),
                        "type": "Model Weights / Artifact"
                    })
                    total_size += sz
                    is_ml = True

        return {
            "is_ml_project": is_ml,
            "model_assets": ml_files,
            "total_model_size_mb": round(total_size / (1024 * 1024), 2),
            "hardware_required": "cpu",
            "gpu_available": False,
            "hardware_status": "READY (CPU environment available)"
        }

    def _count_test_files(self) -> int:
        count = 0
        for root, _, files in os.walk(self.project_path):
            for f in files:
                if (f.startswith("test_") or f.endswith("_test.py")) and f.endswith(".py"):
                    count += 1
        return count
