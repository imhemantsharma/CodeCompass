from typing import List, Dict, Tuple

from app.services.gemini_service import chat_with_history
from app.services.vector_store import query_documents

SYSTEM_PROMPT = (
    "You are CodeCompass, an expert developer onboarding assistant. "
    "Help developers understand codebases. "
    "Reference file paths when relevant. "
    "Use markdown formatting."
)


def _build_context(docs: List[Dict]) -> str:
    return "\n\n---\n\n".join(
        f"File: {doc.get('path', 'unknown')}\n{doc.get('content', '')}"
        for doc in docs
    )


def answer_with_rag(
    repo_id: str,
    user_message: str,
    history: List[Dict],
    n_docs: int = 5,
) -> Tuple[str, List[str]]:
    docs = query_documents(repo_id, user_message, n_results=n_docs)
    context = _build_context(docs)

    augmented = (
        f"Use the following code context to answer the question.\n\n"
        f"<context>\n{context}\n</context>\n\n"
        f"Question: {user_message}"
    )

    gemini_history: List[Dict] = []
    for msg in history:
        role = "model" if msg["role"] == "assistant" else msg["role"]
        gemini_history.append({"role": role, "content": msg["content"]})
    gemini_history.append({"role": "user", "content": augmented})

    answer = chat_with_history(gemini_history, system=SYSTEM_PROMPT)

    sources: List[str] = []
    seen: set = set()
    for doc in docs:
        p = doc.get("path", "")
        if p and p not in seen:
            sources.append(p)
            seen.add(p)

    return answer, sources
