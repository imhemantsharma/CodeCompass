from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException

from app.models.schemas import IngestRequest, IngestResponse, IngestStatusResponse
from app.services.git_service import clone_repo, get_repo_id
from app.services.parser import parse_repository
from app.services.vector_store import store_documents

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory status store
# ---------------------------------------------------------------------------
# Keyed by repo_id; each value is a dict with keys:
#   name, url, path, files (list[str]), file_count, status ("ready"|"error")
status_store: Dict[str, Dict[str, Any]] = {}

MAX_CHUNKS = 500  # Free-tier quota guard


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=IngestResponse)
async def ingest_repo(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Kick off (or re-trigger) ingestion for a GitHub repository.

    The cloning and embedding happen synchronously here so the caller
    gets a definitive result.  For very large repos consider switching
    to a proper task queue; for a hackathon synchronous is fine.
    """
    github_url = request.github_url.strip().rstrip("/")
    repo_id = get_repo_id(github_url)

    # Mark as processing
    status_store[repo_id] = {"status": "processing", "url": github_url}

    try:
        # 1. Clone
        _, repo_name, clone_path = clone_repo(github_url)

        # 2. Parse
        chunks = parse_repository(clone_path)

        # 3. Cap
        chunks = chunks[:MAX_CHUNKS]

        # 4. Prepare texts and metadatas
        texts: List[str] = [c["content"] for c in chunks]
        metadatas: List[Dict[str, str]] = [
            {"path": c["path"], "filename": c["filename"]}
            for c in chunks
        ]

        # 5. Store — ChromaDB embeds locally via ONNX
        store_documents(repo_id, texts, metadatas)

        # 7. Record metadata
        unique_paths: List[str] = list({c["path"] for c in chunks})
        status_store[repo_id] = {
            "name": repo_name,
            "url": github_url,
            "path": clone_path,
            "files": unique_paths,
            "file_count": len(unique_paths),
            "status": "ready",
        }

        return IngestResponse(
            repo_id=repo_id,
            repo_name=repo_name,
            files_indexed=len(unique_paths),
            message=f"Successfully indexed {len(unique_paths)} files ({len(chunks)} chunks).",
        )

    except Exception as exc:
        status_store[repo_id] = {
            "status": "error",
            "url": github_url,
            "error": str(exc),
        }
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}")


@router.get("/status/{repo_id}", response_model=IngestStatusResponse)
async def get_status(repo_id: str):
    """Return the ingestion status for a previously submitted repo."""
    if repo_id not in status_store:
        raise HTTPException(status_code=404, detail="repo_id not found")

    entry = status_store[repo_id]
    return IngestStatusResponse(
        status=entry.get("status", "unknown"),
        name=entry.get("name", ""),
        url=entry.get("url", ""),
        file_count=entry.get("file_count", 0),
    )
