const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/_/backend";

// Set to true to skip all API calls and use mock data for UI development
export const USE_MOCK = false;

export interface IngestResponse {
  repo_id: string;
  repo_name: string;
  files_indexed: number;
  message: string;
}

export interface StatusResponse {
  status: "processing" | "ready" | "error" | "unknown";
  name: string;
  url: string;
  file_count: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  sources: string[];
}

export interface OverviewResponse {
  name: string;
  description: string;
  primary_language: string;
  tech_stack: string[];
  key_features: string[];
  file_count: number;
  health_score: number;
}

export interface ArchNode {
  id: string;
  label: string;
  type: "frontend" | "backend" | "database" | "service" | "queue" | "cache" | "external";
  description: string;
}

export interface ArchEdge {
  source: string;
  target: string;
  label: string;
}

export interface ArchitectureResponse {
  nodes: ArchNode[];
  edges: ArchEdge[];
  summary: string;
}

export interface SetupStep {
  step: number;
  title: string;
  command: string;
  description: string;
}

export interface SetupResponse {
  steps: SetupStep[];
  environment_vars: string[];
  notes?: string;
}

export interface Dependency {
  name: string;
  purpose: string;
  category: "frontend" | "backend" | "database" | "devops" | "testing" | "utility";
  version?: string;
}

export interface DependenciesResponse {
  dependencies: Dependency[];
}

import {
  MOCK_STATUS,
  MOCK_OVERVIEW,
  MOCK_ARCHITECTURE,
  MOCK_SETUP,
  MOCK_DEPENDENCIES,
  MOCK_CHAT,
} from "./mock-data";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function ingestRepo(github_url: string): Promise<IngestResponse> {
  if (USE_MOCK) return { repo_id: "mock-repo", repo_name: "codecompass", files_indexed: 42, message: "Mock ingestion complete." };
  return request<IngestResponse>("/api/ingest", {
    method: "POST",
    body: JSON.stringify({ github_url }),
  });
}

export async function getStatus(repoId: string): Promise<StatusResponse> {
  if (USE_MOCK) return MOCK_STATUS;
  return request<StatusResponse>(`/api/ingest/status/${repoId}`);
}

export async function sendChat(
  repoId: string,
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  if (USE_MOCK) return MOCK_CHAT;
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ repo_id: repoId, message, history }),
  });
}

export async function getOverview(repoId: string): Promise<OverviewResponse> {
  if (USE_MOCK) return MOCK_OVERVIEW;
  return request<OverviewResponse>(`/api/analysis/overview/${repoId}`);
}

export async function getArchitecture(repoId: string): Promise<ArchitectureResponse> {
  if (USE_MOCK) return MOCK_ARCHITECTURE;
  return request<ArchitectureResponse>(`/api/analysis/architecture/${repoId}`);
}

export async function getSetup(repoId: string): Promise<SetupResponse> {
  if (USE_MOCK) return MOCK_SETUP;
  return request<SetupResponse>(`/api/analysis/setup/${repoId}`);
}

export async function getDependencies(repoId: string): Promise<DependenciesResponse> {
  if (USE_MOCK) return MOCK_DEPENDENCIES;
  return request<DependenciesResponse>(`/api/analysis/dependencies/${repoId}`);
}
