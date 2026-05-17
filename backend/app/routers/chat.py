from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.routers.ingest import status_store
from app.services.rag import answer_with_rag

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Answer a developer question about a previously ingested repository.

    *history* should be ordered oldest-first; each item has role "user" or
    "assistant" and a content string.
    """
    repo_id = request.repo_id

    # Validate repo exists and is ready
    entry = status_store.get(repo_id)
    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"Repository '{repo_id}' not found. Please ingest it first.",
        )
    if entry.get("status") != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Repository '{repo_id}' is not ready (status: {entry.get('status')}).",
        )

    # Convert pydantic ChatMessage list to plain dicts for the service layer
    history = [{"role": m.role, "content": m.content} for m in request.history]

    try:
        answer, sources = answer_with_rag(
            repo_id=repo_id,
            user_message=request.message,
            history=history,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat error: {exc}")

    return ChatResponse(response=answer, sources=sources)
