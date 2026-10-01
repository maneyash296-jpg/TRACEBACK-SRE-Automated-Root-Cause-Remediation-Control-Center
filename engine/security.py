"""
TRACEBACK Security Validation & Sanitization Engine
Guards against untrusted project uploads, ZIP path traversals, command injection,
and host environment variable leakage.
"""
import os
import zipfile
import re
from typing import List, Dict, Any, Optional

MAX_ARCHIVE_BYTES = 50 * 1024 * 1024       # 50 MB max zip size
MAX_UNCOMPRESSED_BYTES = 150 * 1024 * 1024  # 150 MB max extracted footprint
MAX_FILE_COUNT = 3000                       # Max files in archive

SAFE_ENV_ALLOWLIST = {
    "PATH", "PYTHONUNBUFFERED", "PYTHONPATH", "LANG", "LC_ALL",
    "HOME", "TMPDIR", "TEMP", "VIRTUAL_ENV", "PYTHONDONTWRITEBYTECODE"
}

ALLOWED_COMMAND_BINARIES = {
    "pytest", "py.test", "python3", "python", "unittest", "tox"
}

class SecurityError(Exception):
    pass

class SafeZipExtractor:
    @staticmethod
    def inspect_and_extract(zip_path: str, destination_dir: str) -> Dict[str, Any]:
        """
        Safely extracts an uploaded ZIP archive with strict Path Traversal
        and Zip Bomb protections.
        """
        if not os.path.exists(zip_path):
            raise SecurityError(f"Archive file not found: {zip_path}")

        archive_size = os.path.getsize(zip_path)
        if archive_size > MAX_ARCHIVE_BYTES:
            raise SecurityError(
                f"Archive exceeds size limit ({archive_size / (1024*1024):.1f}MB > {MAX_ARCHIVE_BYTES / (1024*1024)}MB)"
            )

        os.makedirs(destination_dir, exist_ok=True)
        dest_abs = os.path.realpath(destination_dir)

        total_uncompressed = 0
        file_count = 0
        extracted_files = []

        with zipfile.ZipFile(zip_path, 'r') as zf:
            members = zf.infolist()
            if len(members) > MAX_FILE_COUNT:
                raise SecurityError(f"Archive contains {len(members)} files, exceeding limit of {MAX_FILE_COUNT}")

            # First pass: validate all file names and compression ratio
            for member in members:
                # Security Check 1: No absolute paths or drive letters
                name = member.filename
                if name.startswith("/") or name.startswith("\\") or (len(name) > 1 and name[1] == ":"):
                    raise SecurityError(f"Security Alert: Absolute path detected in ZIP member: {name}")

                # Security Check 2: No directory traversal elements ('..' components)
                normalized = os.path.normpath(name)
                parts = normalized.split(os.sep)
                if ".." in parts:
                    raise SecurityError(f"Security Alert: Directory traversal ('..') detected in ZIP member: {name}")

                # Security Check 3: Check cumulative extracted byte volume
                total_uncompressed += member.file_size
                if total_uncompressed > MAX_UNCOMPRESSED_BYTES:
                    raise SecurityError(
                        f"Zip bomb protection: Total extracted size exceeds {MAX_UNCOMPRESSED_BYTES / (1024*1024)}MB"
                    )

                # Security Check 4: Path resolution boundary check
                target_path = os.path.realpath(os.path.join(dest_abs, member.filename))
                if not (target_path == dest_abs or target_path.startswith(dest_abs + os.sep)):
                    raise SecurityError(f"Path traversal detected: {member.filename} resolves outside workspace")

            # Detect if all items share a single top-level directory (e.g. GitHub zip export)
            top_level_dirs = set()
            for m in members:
                parts = m.filename.strip("/").split("/")
                if parts and parts[0]:
                    top_level_dirs.add(parts[0])

            strip_prefix = ""
            if len(top_level_dirs) == 1 and all("/" in m.filename for m in members if not m.is_dir()):
                strip_prefix = list(top_level_dirs)[0] + "/"

            # Second pass: safe extraction
            for member in members:
                rel_name = member.filename
                if strip_prefix and rel_name.startswith(strip_prefix):
                    rel_name = rel_name[len(strip_prefix):]
                if not rel_name:
                    continue

                target_file_path = os.path.join(dest_abs, rel_name)
                if member.is_dir():
                    os.makedirs(target_file_path, exist_ok=True)
                else:
                    os.makedirs(os.path.dirname(target_file_path), exist_ok=True)
                    with zf.open(member) as source, open(target_file_path, "wb") as target:
                        # Stream in 64KB chunks
                        while True:
                            chunk = source.read(64 * 1024)
                            if not chunk:
                                break
                            target.write(chunk)
                    file_count += 1
                    extracted_files.append(rel_name)

        return {
            "success": True,
            "destination": dest_abs,
            "file_count": file_count,
            "total_bytes": total_uncompressed,
            "files": extracted_files
        }

class CommandSanitizer:
    @staticmethod
    def sanitize_test_command(command_str: str) -> List[str]:
        """
        Validates and tokenizes test command. Rejects shell injection operators.
        Never passes command to a shell interpreter (sh/bash).
        """
        if not command_str or not command_str.strip():
            return ["pytest", "-q"]

        # Check for dangerous shell metacharacters
        dangerous_patterns = [";", "&&", "||", "|", ">", "<", "`", "$", "\n", "\r", "\t"]
        for pattern in dangerous_patterns:
            if pattern in command_str:
                raise SecurityError(f"Illegal shell metacharacter '{pattern}' in test command")

        # Split into tokens safely
        tokens = command_str.strip().split()
        if not tokens:
            return ["pytest", "-q"]

        binary = tokens[0].lower()
        if binary not in ALLOWED_COMMAND_BINARIES and not binary.endswith("pytest") and not binary.endswith("python"):
            raise SecurityError(
                f"Unauthorized test binary '{binary}'. Permitted binaries: {', '.join(sorted(ALLOWED_COMMAND_BINARIES))}"
            )

        return tokens

class EnvironmentScrubber:
    @staticmethod
    def get_clean_env(extra_env: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Creates an isolated, scrubbed environment variable map.
        Guarantees zero server secrets, tokens, or cloud API credentials leak to sandbox.
        """
        clean_env = {
            "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "PYTHONUNBUFFERED": "1",
            "PYTHONDONTWRITEBYTECODE": "1",
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
            "TERM": "xterm-256color"
        }

        # Inherit only safe keys from host if they exist
        for key in SAFE_ENV_ALLOWLIST:
            if key in os.environ and key not in clean_env:
                clean_env[key] = os.environ[key]

        if extra_env:
            for k, v in extra_env.items():
                if not any(secret_word in k.upper() for secret_word in ["KEY", "SECRET", "TOKEN", "CRED", "PASSWORD", "AUTH"]):
                    clean_env[k] = str(v)

        return clean_env
