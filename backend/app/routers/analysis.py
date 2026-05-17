import json
import re
from typing import List, Any

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    OverviewResponse,
    ArchitectureResponse,
    ArchNode,
    ArchEdge,
    SetupResponse,
    SetupStep,
    DependenciesResponse,
    Dependency,
)
from app.routers.ingest import status_store
from app.services.gemini_service import generate_text
from app.services.vector_store import query_documents

router = APIRouter()


def _require_repo(repo_id: str) -> dict:
    entry = status_store.get(repo_id)
    if not entry or entry.get("status") != "ready":
        raise HTTPException(
            status_code=404,
            detail=f"Repository '{repo_id}' not found or not ready.",
        )
    return entry


def get_repo_context(repo_id: str, query: str, n: int = 10) -> str:
    docs = query_documents(repo_id, query, n_results=n)
    return "\n\n---\n\n".join(
        f"File: {doc['path']}\n{doc['content']}" for doc in docs
    )


def _extract_json(response: str) -> Any:
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    match = re.search(r"\[.*\]", response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


def _safe_list(value: Any, fallback=None) -> list:
    if isinstance(value, list):
        return value
    return fallback or []


@router.get("/overview/{repo_id}", response_model=OverviewResponse)
async def get_overview(repo_id: str):
    entry = _require_repo(repo_id)
    context = get_repo_context(repo_id, "project overview architecture technology stack")

    prompt = (
        "Analyze this codebase and return a JSON object with these exact keys:\n"
        "- name (string): repository name\n"
        "- description (string): 2-3 sentence project description\n"
        "- primary_language (string): main programming language\n"
        "- tech_stack (array of strings): frameworks and major libraries\n"
        "- key_features (array of strings): 3-5 main features/capabilities\n"
        "- file_count (integer): number of files\n"
        "- health_score (integer 0-100): code health estimate\n\n"
        f"Repository name: {entry.get('name', 'unknown')}\n"
        f"File count: {entry.get('file_count', 0)}\n\n"
        f"Code context:\n{context}\n\n"
        "Respond with ONLY valid JSON, no markdown fences, no explanation."
    )

    response = generate_text(prompt)
    data = _extract_json(response)
    if not data or not isinstance(data, dict):
        data = {}

    return OverviewResponse(
        name=data.get("name", entry.get("name", repo_id)),
        description=data.get("description", "No description available."),
        primary_language=data.get("primary_language", "Unknown"),
        tech_stack=_safe_list(data.get("tech_stack"), []),
        key_features=_safe_list(data.get("key_features"), []),
        file_count=data.get("file_count", entry.get("file_count", 0)),
        health_score=int(data.get("health_score", 50)),
    )


@router.get("/architecture/{repo_id}", response_model=ArchitectureResponse)
async def get_architecture(repo_id: str):
    _require_repo(repo_id)
    context = get_repo_context(
        repo_id,
        "architecture components services database frontend backend API",
    )

    prompt = (
        "Analyze this codebase architecture and return JSON with:\n"
        "- nodes (array): each has id (string), label (string), type (one of: frontend, backend, database, service, queue, cache, external), description (string)\n"
        "- edges (array): each has source (string node id), target (string node id), label (string)\n"
        "- summary (string): 2-3 sentence architecture summary\n\n"
        f"Code context:\n{context}\n\n"
        "Respond with ONLY valid JSON, no markdown fences, no explanation."
    )

    response = generate_text(prompt)
    data = _extract_json(response)
    if not data or not isinstance(data, dict):
        data = {}

    valid_types = {"frontend", "backend", "database", "service", "queue", "cache", "external"}
    raw_nodes = _safe_list(data.get("nodes"), [])
    raw_edges = _safe_list(data.get("edges"), [])

    nodes: List[ArchNode] = []
    for n in raw_nodes:
        if not isinstance(n, dict):
            continue
        node_type = n.get("type", "service")
        if node_type not in valid_types:
            node_type = "service"
        nodes.append(ArchNode(
            id=str(n.get("id", "")),
            label=str(n.get("label", "")),
            type=node_type,
            description=str(n.get("description", "")),
        ))

    edges: List[ArchEdge] = []
    node_ids = {node.id for node in nodes}
    for e in raw_edges:
        if not isinstance(e, dict):
            continue
        source = str(e.get("source", ""))
        target = str(e.get("target", ""))
        if source in node_ids and target in node_ids:
            edges.append(ArchEdge(
                source=source,
                target=target,
                label=str(e.get("label", "")),
            ))

    return ArchitectureResponse(
        nodes=nodes,
        edges=edges,
        summary=data.get("summary", "Architecture analysis not available."),
    )


@router.get("/setup/{repo_id}", response_model=SetupResponse)
async def get_setup(repo_id: str):
    entry = _require_repo(repo_id)
    context = get_repo_context(
        repo_id,
        "setup installation configuration environment variables getting started README",
    )

    prompt = (
        "Analyze this codebase and produce developer setup instructions as JSON:\n"
        "- steps (array): each has step (integer), title (string), command (string or empty), description (string)\n"
        "- environment_vars (array of strings): required environment variable names\n\n"
        f"Repository name: {entry.get('name', 'unknown')}\n"
        f"Repository URL: {entry.get('url', '')}\n\n"
        f"Code context:\n{context}\n\n"
        "Respond with ONLY valid JSON, no markdown fences, no explanation."
    )

    response = generate_text(prompt)
    data = _extract_json(response)
    if not data or not isinstance(data, dict):
        data = {}

    raw_steps = _safe_list(data.get("steps"), [])
    steps: List[SetupStep] = []
    for i, s in enumerate(raw_steps, start=1):
        if not isinstance(s, dict):
            continue
        steps.append(SetupStep(
            step=int(s.get("step", i)),
            title=str(s.get("title", f"Step {i}")),
            command=str(s.get("command", "")),
            description=str(s.get("description", "")),
        ))

    env_vars = [str(v) for v in _safe_list(data.get("environment_vars"), [])]
    return SetupResponse(steps=steps, environment_vars=env_vars)


@router.get("/dependencies/{repo_id}", response_model=DependenciesResponse)
async def get_dependencies(repo_id: str):
    _require_repo(repo_id)
    context = get_repo_context(
        repo_id,
        "dependencies packages libraries requirements package.json pyproject.toml go.mod",
    )

    prompt = (
        "Analyze this codebase dependencies and return JSON:\n"
        "- dependencies (array): each has name (string), purpose (string), category (one of: frontend, backend, database, devops, testing, utility)\n\n"
        f"Code context:\n{context}\n\n"
        "Respond with ONLY valid JSON, no markdown fences, no explanation."
    )

    response = generate_text(prompt)
    data = _extract_json(response)
    if not data or not isinstance(data, dict):
        data = {}

    valid_categories = {"frontend", "backend", "database", "devops", "testing", "utility"}
    raw_deps = _safe_list(data.get("dependencies"), [])

    deps: List[Dependency] = []
    for d in raw_deps:
        if not isinstance(d, dict):
            continue
        cat = d.get("category", "utility")
        if cat not in valid_categories:
            cat = "utility"
        deps.append(Dependency(
            name=str(d.get("name", "")),
            purpose=str(d.get("purpose", "")),
            category=cat,
        ))

    return DependenciesResponse(dependencies=deps)
