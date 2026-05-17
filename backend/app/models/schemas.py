from pydantic import BaseModel, Field
from typing import List, Optional, Any


# ── Ingest ──────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    github_url: str


class IngestResponse(BaseModel):
    repo_id: str
    repo_name: str
    files_indexed: int
    message: str


class IngestStatusResponse(BaseModel):
    status: str
    name: str
    url: str
    file_count: int


# ── Chat ─────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str          # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    repo_id: str
    message: str
    history: List[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    sources: List[str]


# ── Analysis – Overview ──────────────────────────────────────────────────────

class OverviewResponse(BaseModel):
    name: str
    description: str
    primary_language: str
    tech_stack: List[str]
    key_features: List[str]
    file_count: int
    health_score: int


# ── Analysis – Architecture ──────────────────────────────────────────────────

class ArchNode(BaseModel):
    id: str
    label: str
    type: str          # frontend | backend | database | service | queue | cache | external
    description: str


class ArchEdge(BaseModel):
    source: str
    target: str
    label: str


class ArchitectureResponse(BaseModel):
    nodes: List[ArchNode]
    edges: List[ArchEdge]
    summary: str


# ── Analysis – Setup ─────────────────────────────────────────────────────────

class SetupStep(BaseModel):
    step: int
    title: str
    command: str
    description: str


class SetupResponse(BaseModel):
    steps: List[SetupStep]
    environment_vars: List[str]


# ── Analysis – Dependencies ──────────────────────────────────────────────────

class Dependency(BaseModel):
    name: str
    purpose: str
    category: str      # frontend | backend | database | devops | testing | utility


class DependenciesResponse(BaseModel):
    dependencies: List[Dependency]
