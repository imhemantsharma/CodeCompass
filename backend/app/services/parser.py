import os
from typing import List, Dict, Any

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPPORTED_EXTENSIONS: set[str] = {
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".java", ".go", ".rs", ".rb", ".php",
    ".cs", ".cpp", ".c", ".h", ".swift",
    ".kt", ".md", ".txt", ".json", ".yaml",
    ".yml", ".toml", ".sh",
}

SPECIAL_FILENAMES: set[str] = {
    "Dockerfile", "Makefile", ".gitignore",
}

SKIP_DIRS: set[str] = {
    "node_modules", ".git", "__pycache__", "dist", "build",
    ".next", "venv", ".venv", "env", "vendor", "target",
    "bin", "obj", "coverage", ".cache",
}

MAX_FILE_SIZE: int = 100 * 1024  # 100 KB
CHUNK_SIZE: int = 1500           # chars per chunk


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _should_include(filename: str, extension: str) -> bool:
    if filename in SPECIAL_FILENAMES:
        return True
    return extension in SUPPORTED_EXTENSIONS


def _chunk_text(text: str, path: str, extension: str, filename: str) -> List[Dict[str, Any]]:
    """Split content into ~CHUNK_SIZE chunks on newline boundaries."""
    chunks: List[Dict[str, Any]] = []
    lines = text.splitlines(keepends=True)

    current: List[str] = []
    current_len = 0
    chunk_index = 0

    for line in lines:
        current.append(line)
        current_len += len(line)

        if current_len >= CHUNK_SIZE:
            chunks.append({
                "path": path,
                "content": "".join(current).strip(),
                "extension": extension,
                "filename": filename,
                "chunk_index": chunk_index,
            })
            chunk_index += 1
            current = []
            current_len = 0

    # Remainder
    if current:
        chunks.append({
            "path": path,
            "content": "".join(current).strip(),
            "extension": extension,
            "filename": filename,
            "chunk_index": chunk_index,
        })

    return [c for c in chunks if c["content"]]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_repository(repo_path: str) -> List[Dict[str, Any]]:
    """
    Walk *repo_path*, read every supported file and return a flat list of
    chunk dicts:  {path, content, extension, filename, chunk_index}
    """
    all_chunks: List[Dict[str, Any]] = []

    for root, dirs, files in os.walk(repo_path):
        # Prune skip dirs in-place so os.walk won't descend into them
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in files:
            abs_path = os.path.join(root, filename)
            extension = os.path.splitext(filename)[1].lower()

            if not _should_include(filename, extension):
                continue

            # Size guard
            try:
                if os.path.getsize(abs_path) > MAX_FILE_SIZE:
                    continue
            except OSError:
                continue

            # Read with UTF-8; skip binary files
            try:
                with open(abs_path, "r", encoding="utf-8", errors="strict") as fh:
                    content = fh.read()
            except (UnicodeDecodeError, OSError):
                continue

            if not content.strip():
                continue

            # Relative path for display
            rel_path = os.path.relpath(abs_path, repo_path).replace("\\", "/")

            chunks = _chunk_text(content, rel_path, extension, filename)
            all_chunks.extend(chunks)

    return all_chunks
