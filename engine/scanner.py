"""
TRACEBACK Deterministic AST Project Scanner
Extracts files, functions, classes, imports, routes, and tests using Python's ast module.
Calculates Project DNA strictly from source files (no LLM guessing).
"""
import ast
import os
import hashlib
from typing import Dict, List, Any, Optional

SAFE_IGNORE_DIRS = {".git", "node_modules", "__pycache__", ".pytest_cache", ".venv", "venv", ".idea", ".vscode", "dist", "build"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB limit per file

class ProjectScanner:
    def __init__(self, project_path: str):
        self.project_path = os.path.abspath(project_path)
        self.files: List[Dict[str, Any]] = []
        self.functions: List[Dict[str, Any]] = []
        self.classes: List[Dict[str, Any]] = []
        self.imports: List[Dict[str, Any]] = []
        self.routes: List[Dict[str, Any]] = []
        self.tests: List[Dict[str, Any]] = []
        self.dna: Dict[str, Any] = {}
        self.errors: List[str] = []

    def scan(self) -> Dict[str, Any]:
        """Run full deterministic AST analysis on project."""
        py_files = []
        other_files = []
        total_lines = 0
        src_lines = 0
        test_lines = 0
        hash_sha = hashlib.sha256()

        for root, dirs, files in os.walk(self.project_path):
            dirs[:] = [d for d in dirs if d not in SAFE_IGNORE_DIRS]
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, self.project_path)
                
                # Check size
                try:
                    file_size = os.path.getsize(full_path)
                    if file_size > MAX_FILE_SIZE:
                        continue
                except OSError:
                    continue

                _, ext = os.path.splitext(file)
                ext = ext.lower()

                try:
                    with open(full_path, "rb") as f:
                        content_bytes = f.read()
                        hash_sha.update(content_bytes)
                        content = content_bytes.decode("utf-8", errors="replace")
                except Exception as e:
                    self.errors.append(f"Failed to read {rel_path}: {str(e)}")
                    continue

                line_count = len(content.splitlines())
                total_lines += line_count
                is_test_file = "test" in rel_path.lower() or file.startswith("test_") or file.endswith("_test.py")

                if is_test_file:
                    test_lines += line_count
                else:
                    src_lines += line_count

                file_info = {
                    "path": rel_path,
                    "extension": ext,
                    "line_count": line_count,
                    "size_bytes": file_size,
                    "is_test": is_test_file
                }

                if ext == ".py":
                    py_files.append(file_info)
                    self._parse_python_file(rel_path, content, is_test_file)
                else:
                    other_files.append(file_info)

        self.files = py_files + other_files

        # Calculate DNA
        pure_functions = [f for f in self.functions if not f["is_async"] and not f["is_test"]]
        async_functions = [f for f in self.functions if f["is_async"] and not f["is_test"]]

        self.dna = {
            "files": len(py_files),
            "total_files": len(self.files),
            "functions": len([f for f in self.functions if not f["is_test"]]),
            "pure_functions": len(pure_functions),
            "async_functions": len(async_functions),
            "classes": len([c for c in self.classes if not c["is_test"]]),
            "routes": len(self.routes),
            "tests": len(self.tests),
            "lines": total_lines,
            "src_lines": src_lines,
            "test_lines": test_lines,
            "sha256": hash_sha.hexdigest()[:16]
        }

        return {
            "dna": self.dna,
            "files": self.files,
            "functions": self.functions,
            "classes": self.classes,
            "imports": self.imports,
            "routes": self.routes,
            "tests": self.tests,
            "errors": self.errors
        }

    def _parse_python_file(self, rel_path: str, content: str, is_test_file: bool):
        try:
            tree = ast.parse(content, filename=rel_path)
        except SyntaxError as e:
            self.errors.append(f"Syntax error in {rel_path} line {e.lineno}: {e.msg}")
            return

        lines = content.splitlines()

        for node in ast.walk(tree):
            # Imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self.imports.append({
                        "file": rel_path,
                        "module": alias.name,
                        "alias": alias.asname or alias.name,
                        "line": getattr(node, "lineno", 0)
                    })
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                for alias in node.names:
                    self.imports.append({
                        "file": rel_path,
                        "module": f"{mod}.{alias.name}" if mod else alias.name,
                        "alias": alias.asname or alias.name,
                        "line": getattr(node, "lineno", 0)
                    })

        # Top-level & class-level functions, classes, and decorators
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                self._record_function(node, rel_path, lines, is_test_file)
            elif isinstance(node, ast.ClassDef):
                self._record_class(node, rel_path, lines, is_test_file)

    def _record_function(self, node: Any, rel_path: str, lines: List[str], is_test_file: bool, parent_class: Optional[str] = None):
        name = node.name
        is_async = isinstance(node, ast.AsyncFunctionDef)
        line_start = node.lineno
        line_end = getattr(node, "end_lineno", line_start)
        args = [arg.arg for arg in node.args.args]
        is_test = is_test_file or name.startswith("test_") or name.endswith("_test")

        # Cyclomatic complexity approximation: count branches
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler, ast.With, ast.Assert)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1

        # Check for FastAPI / Flask route decorators
        # e.g. @app.get("/path"), @router.post("/path")
        for deco in node.decorator_list:
            route_info = self._extract_route(deco, name, rel_path, line_start)
            if route_info:
                self.routes.append(route_info)

        func_obj = {
            "name": name,
            "full_name": f"{parent_class}.{name}" if parent_class else name,
            "file": rel_path,
            "line_start": line_start,
            "line_end": line_end,
            "args": args,
            "is_async": is_async,
            "is_test": is_test,
            "parent_class": parent_class,
            "complexity": complexity,
            "sloc": max(1, line_end - line_start + 1)
        }
        self.functions.append(func_obj)

        if is_test:
            self.tests.append({
                "name": name,
                "file": rel_path,
                "line": line_start,
                "parent_class": parent_class
            })

    def _record_class(self, node: ast.ClassDef, rel_path: str, lines: List[str], is_test_file: bool):
        bases = []
        for b in node.bases:
            if isinstance(b, ast.Name):
                bases.append(b.id)
            elif isinstance(b, ast.Attribute):
                bases.append(f"{getattr(b.value, 'id', '')}.{b.attr}")

        is_test_class = is_test_file or "TestCase" in bases or node.name.startswith("Test")

        self.classes.append({
            "name": node.name,
            "file": rel_path,
            "line_start": node.lineno,
            "line_end": getattr(node, "end_lineno", node.lineno),
            "bases": bases,
            "is_test": is_test_class
        })

        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                self._record_function(item, rel_path, lines, is_test_file, parent_class=node.name)

    def _extract_route(self, deco: Any, func_name: str, file_path: str, line: int) -> Optional[Dict[str, Any]]:
        # Decorators like @app.get("/path") or @router.post("/path")
        if isinstance(deco, ast.Call) and isinstance(deco.func, ast.Attribute):
            method = deco.func.attr.upper()
            if method in ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]:
                path = "/"
                if deco.args and isinstance(deco.args[0], ast.Constant):
                    path = str(deco.args[0].value)
                return {
                    "method": method,
                    "path": path,
                    "function": func_name,
                    "file": file_path,
                    "line": line
                }
        return None
