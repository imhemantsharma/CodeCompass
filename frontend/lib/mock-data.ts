import type {
  StatusResponse,
  OverviewResponse,
  ArchitectureResponse,
  SetupResponse,
  DependenciesResponse,
  ChatResponse,
} from "./api";

export const MOCK_STATUS: StatusResponse = {
  status: "ready",
  name: "codecompass",
  url: "https://github.com/example/codecompass",
  file_count: 42,
};

export const MOCK_OVERVIEW: OverviewResponse = {
  name: "CodeCompass",
  description:
    "AI-powered developer onboarding tool that analyzes GitHub repositories and generates interactive architecture diagrams, setup guides, and answers developer questions via RAG-powered chat.",
  primary_language: "TypeScript",
  tech_stack: ["Next.js 14", "FastAPI", "ChromaDB", "Gemini AI", "Tailwind CSS", "React Flow", "Framer Motion"],
  key_features: [
    "Automated repository ingestion via GitHub URL",
    "RAG-powered AI chat for codebase Q&A",
    "Interactive n8n-style architecture flow diagram",
    "Auto-generated developer setup guides",
    "Dependency analysis with categorization",
  ],
  file_count: 42,
  health_score: 87,
};

export const MOCK_ARCHITECTURE: ArchitectureResponse = {
  summary:
    "Full-stack RAG application. Next.js frontend communicates with FastAPI backend. Repos ingested via GitPython, chunked, embedded locally via ChromaDB ONNX, and queried against Gemini 2.5 Flash for AI responses.",
  nodes: [
    { id: "fe",      label: "Next.js Frontend",    type: "frontend",  description: "App Router, Tailwind, React Flow, Framer Motion" },
    { id: "api",     label: "FastAPI Backend",      type: "backend",   description: "REST API, CORS, background ingestion tasks" },
    { id: "ingest",  label: "Ingest Service",       type: "service",   description: "GitPython clone, file parser, chunk splitter" },
    { id: "vector",  label: "ChromaDB",             type: "database",  description: "Local persistent vector store with ONNX embeddings" },
    { id: "rag",     label: "RAG Service",          type: "service",   description: "Query retrieval + context injection for Gemini" },
    { id: "gemini",  label: "Gemini 2.5 Flash",     type: "external",  description: "LLM for analysis, chat, and code understanding" },
    { id: "github",  label: "GitHub",               type: "external",  description: "Source repository cloned on ingest request" },
  ],
  edges: [
    { source: "fe",     target: "api",    label: "HTTP/REST" },
    { source: "api",    target: "ingest", label: "trigger" },
    { source: "ingest", target: "github", label: "git clone" },
    { source: "ingest", target: "vector", label: "embed + store" },
    { source: "api",    target: "rag",    label: "query" },
    { source: "rag",    target: "vector", label: "similarity search" },
    { source: "rag",    target: "gemini", label: "augmented prompt" },
    { source: "gemini", target: "api",    label: "response" },
  ],
};

export const MOCK_SETUP: SetupResponse = {
  steps: [
    {
      step: 1,
      title: "Clone Repository",
      command: "git clone https://github.com/example/codecompass && cd codecompass",
      description: "Clone the repo and navigate into the project directory.",
    },
    {
      step: 2,
      title: "Backend — Create virtual environment",
      command: "cd backend && python -m venv venv && .\\venv\\Scripts\\activate",
      description: "Isolate Python dependencies. Always use venv, never global pip.",
    },
    {
      step: 3,
      title: "Backend — Install dependencies",
      command: ".\\venv\\Scripts\\pip install -r requirements.txt",
      description: "Installs FastAPI, ChromaDB, google-genai, GitPython, and other backend deps.",
    },
    {
      step: 4,
      title: "Backend — Configure environment",
      command: "cp .env.example .env",
      description: "Copy the example env file and fill in GEMINI_API_KEY from Google AI Studio.",
    },
    {
      step: 5,
      title: "Backend — Start server",
      command: ".\\venv\\Scripts\\uvicorn app.main:app --reload --port 8000",
      description: "Starts the FastAPI server on http://localhost:8000.",
    },
    {
      step: 6,
      title: "Frontend — Install dependencies",
      command: "cd ../frontend && npm install",
      description: "Installs Next.js, Tailwind, React Flow, Framer Motion, and other frontend deps.",
    },
    {
      step: 7,
      title: "Frontend — Start dev server",
      command: "npm run dev",
      description: "Starts Next.js on http://localhost:3000. Backend must be running first.",
    },
  ],
  environment_vars: ["GEMINI_API_KEY"],
};

export const MOCK_DEPENDENCIES: DependenciesResponse = {
  dependencies: [
    { name: "next",           purpose: "React framework with App Router and SSR",            category: "frontend" },
    { name: "react",          purpose: "UI component library",                                category: "frontend" },
    { name: "@xyflow/react",  purpose: "Interactive node-based flow diagrams",               category: "frontend" },
    { name: "framer-motion",  purpose: "Animation library for smooth UI transitions",        category: "frontend" },
    { name: "lucide-react",   purpose: "Icon library",                                       category: "frontend" },
    { name: "tailwindcss",    purpose: "Utility-first CSS framework",                        category: "frontend" },
    { name: "react-markdown", purpose: "Render markdown from AI chat responses",             category: "frontend" },
    { name: "fastapi",        purpose: "High-performance Python REST framework",             category: "backend" },
    { name: "uvicorn",        purpose: "ASGI server for FastAPI",                            category: "backend" },
    { name: "google-genai",   purpose: "Official Gemini SDK for AI text generation",        category: "backend" },
    { name: "chromadb",       purpose: "Local vector database with ONNX embeddings",        category: "database" },
    { name: "gitpython",      purpose: "Python library to clone and inspect git repos",     category: "utility" },
    { name: "python-dotenv",  purpose: "Load environment variables from .env file",         category: "utility" },
    { name: "typescript",     purpose: "Static typing for JavaScript",                       category: "devops" },
  ],
};

export const MOCK_CHAT: ChatResponse = {
  response:
    "**CodeCompass** uses a RAG (Retrieval-Augmented Generation) pipeline:\n\n1. **Ingest** — your GitHub repo is cloned and split into chunks\n2. **Embed** — ChromaDB embeds chunks locally using the `all-MiniLM-L6-v2` ONNX model (no external API)\n3. **Query** — your question is embedded, top-k similar chunks retrieved\n4. **Generate** — chunks injected as context into Gemini 2.5 Flash prompt\n\nRelevant files: `backend/app/services/rag.py`, `backend/app/services/vector_store.py`",
  sources: [
    "backend/app/services/rag.py",
    "backend/app/services/vector_store.py",
    "backend/app/routers/ingest.py",
  ],
};
