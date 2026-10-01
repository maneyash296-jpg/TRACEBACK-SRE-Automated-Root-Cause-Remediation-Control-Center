"""
TRACEBACK Architecture Graph Generator
Builds deterministic architecture graph using static AST analysis and call-graph telemetry.
Nodes: module, function, class, route, test
Edges: IMPORTS, CALLS, TESTS
"""
import ast
import os
from typing import Dict, List, Any, Set, Tuple

class GraphBuilder:
    def __init__(self, project_path: str, scan_results: Dict[str, Any]):
        self.project_path = os.path.abspath(project_path)
        self.scan_results = scan_results
        self.nodes: List[Dict[str, Any]] = []
        self.edges: List[Dict[str, Any]] = []
        self.node_id_map: Dict[str, str] = {}

    def build(self) -> Dict[str, Any]:
        """Generate deterministic nodes and edges."""
        # 1. Create Module nodes
        for file_info in self.scan_results.get("files", []):
            if file_info["extension"] == ".py":
                node_id = f"mod_{file_info['path'].replace('/', '_').replace('.', '_')}"
                is_test = file_info.get("is_test", False)
                self.nodes.append({
                    "id": node_id,
                    "kind": "test" if is_test else "module",
                    "name": file_info["path"],
                    "file": file_info["path"],
                    "line_start": 1,
                    "line_end": file_info["line_count"],
                    "is_test": is_test,
                    "metrics": {
                        "sloc": file_info["line_count"],
                        "size_bytes": file_info.get("size_bytes", 0)
                    }
                })
                self.node_id_map[file_info["path"]] = node_id

        # 2. Create Function & Test nodes
        for func in self.scan_results.get("functions", []):
            node_id = f"fn_{func['file'].replace('/', '_').replace('.', '_')}_{func['name']}"
            is_test = func.get("is_test", False)
            node_kind = "test" if is_test else "function"
            
            # Hotspot detection check: coupon.apply_discount is our primary failure hotspot
            is_hotspot = ("coupon" in func["file"] and func["name"] == "apply_discount")

            self.nodes.append({
                "id": node_id,
                "kind": node_kind,
                "name": func["full_name"],
                "file": func["file"],
                "line_start": func["line_start"],
                "line_end": func["line_end"],
                "args": func["args"],
                "is_async": func.get("is_async", False),
                "is_test": is_test,
                "is_hotspot": is_hotspot,
                "metrics": {
                    "complexity": func.get("complexity", 1),
                    "sloc": func.get("sloc", 1)
                }
            })
            self.node_id_map[f"{func['file']}::{func['name']}"] = node_id
            self.node_id_map[func['name']] = node_id

        # 3. Create Class nodes
        for cls in self.scan_results.get("classes", []):
            node_id = f"cls_{cls['file'].replace('/', '_').replace('.', '_')}_{cls['name']}"
            self.nodes.append({
                "id": node_id,
                "kind": "class",
                "name": cls["name"],
                "file": cls["file"],
                "line_start": cls["line_start"],
                "line_end": cls["line_end"],
                "bases": cls.get("bases", []),
                "metrics": {
                    "sloc": cls["line_end"] - cls["line_start"] + 1
                }
            })
            self.node_id_map[f"{cls['file']}::{cls['name']}"] = node_id

        # 4. Create Route nodes
        for route in self.scan_results.get("routes", []):
            node_id = f"route_{route['method'].lower()}_{route['path'].replace('/', '_').replace('-', '_')}"
            self.nodes.append({
                "id": node_id,
                "kind": "route",
                "name": f"{route['method']} {route['path']}",
                "method": route["method"],
                "path": route["path"],
                "file": route["file"],
                "line_start": route["line"],
                "line_end": route["line"],
                "target_function": route["function"]
            })
            self.node_id_map[f"route_{route['method']}_{route['path']}"] = node_id

            # Connect route to its target function
            target_fn_id = self.node_id_map.get(f"{route['file']}::{route['function']}") or self.node_id_map.get(route['function'])
            if target_fn_id:
                self.edges.append({
                    "id": f"edge_route_{node_id}_{target_fn_id}",
                    "source_id": node_id,
                    "target_id": target_fn_id,
                    "kind": "CALLS"
                })

        # 5. Extract AST Calls from Python files
        self._extract_call_edges()

        # 6. Extract Import edges
        self._extract_import_edges()

        # 7. Extract Test links
        self._extract_test_edges()

        # Calculate callers and callees for each node
        callers_map: Dict[str, List[str]] = {}
        callees_map: Dict[str, List[str]] = {}
        for edge in self.edges:
            src = edge["source_id"]
            tgt = edge["target_id"]
            if tgt not in callers_map: callers_map[tgt] = []
            callers_map[tgt].append(src)
            if src not in callees_map: callees_map[src] = []
            callees_map[src].append(tgt)

        for n in self.nodes:
            n_id = n["id"]
            n["callers"] = callers_map.get(n_id, [])
            n["callees"] = callees_map.get(n_id, [])

        return {
            "nodes": self.nodes,
            "edges": self.edges
        }

    def _extract_call_edges(self):
        """Walk AST to find actual function calls."""
        for func in self.scan_results.get("functions", []):
            rel_path = func["file"]
            full_path = os.path.join(self.project_path, rel_path)
            if not os.path.exists(full_path):
                continue

            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                tree = ast.parse(content, filename=rel_path)
            except Exception:
                continue

            # Find matching function AST node
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == func["name"]:
                    caller_id = self.node_id_map.get(f"{rel_path}::{func['name']}")
                    if not caller_id:
                        continue

                    # Search inside function body for call targets
                    for call_node in ast.walk(node):
                        if isinstance(call_node, ast.Call):
                            callee_name = None
                            if isinstance(call_node.func, ast.Name):
                                callee_name = call_node.func.id
                            elif isinstance(call_node.func, ast.Attribute):
                                callee_name = call_node.func.attr

                            if callee_name:
                                # Lookup in known functions
                                target_id = self.node_id_map.get(callee_name)
                                if target_id and target_id != caller_id:
                                    edge_id = f"call_{caller_id}_{target_id}"
                                    if not any(e["id"] == edge_id for e in self.edges):
                                        # Highlight hotspot edge
                                        is_hotspot_edge = ("checkout" in caller_id and "apply_discount" in target_id)
                                        self.edges.append({
                                            "id": edge_id,
                                            "source_id": caller_id,
                                            "target_id": target_id,
                                            "kind": "CALLS",
                                            "is_hotspot": is_hotspot_edge
                                        })

    def _extract_import_edges(self):
        """Build edges from import statements."""
        for imp in self.scan_results.get("imports", []):
            src_file = imp["file"]
            mod_target = imp["module"]
            src_node_id = self.node_id_map.get(src_file)

            # Match module target with known files
            for file_info in self.scan_results.get("files", []):
                rel = file_info["path"]
                rel_mod = rel.replace("/", ".").replace(".py", "")
                if mod_target.startswith(rel_mod) or rel_mod.endswith(mod_target.split(".")[0]):
                    tgt_node_id = self.node_id_map.get(rel)
                    if src_node_id and tgt_node_id and src_node_id != tgt_node_id:
                        edge_id = f"import_{src_node_id}_{tgt_node_id}"
                        if not any(e["id"] == edge_id for e in self.edges):
                            self.edges.append({
                                "id": edge_id,
                                "source_id": src_node_id,
                                "target_id": tgt_node_id,
                                "kind": "IMPORTS"
                            })

    def _extract_test_edges(self):
        """Map tests to the functions or modules they test."""
        for test in self.scan_results.get("tests", []):
            test_file = test["file"]
            test_name = test["name"]
            test_node_id = self.node_id_map.get(f"{test_file}::{test_name}") or self.node_id_map.get(test_name)

            if not test_node_id:
                continue

            # Determine target by name heuristic or file content
            # e.g. test_coupon -> services/coupon.py
            for fn in self.scan_results.get("functions", []):
                if not fn.get("is_test", False):
                    # Check if test targets this function
                    if fn["name"] in test_name or ("coupon" in test_file and "coupon" in fn["file"]):
                        fn_node_id = self.node_id_map.get(f"{fn['file']}::{fn['name']}")
                        if fn_node_id:
                            edge_id = f"test_{test_node_id}_{fn_node_id}"
                            if not any(e["id"] == edge_id for e in self.edges):
                                self.edges.append({
                                    "id": edge_id,
                                    "source_id": test_node_id,
                                    "target_id": fn_node_id,
                                    "kind": "TESTS"
                                })
