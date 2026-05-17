# CodeCompass

**Understand any codebase in minutes, not hours.**

CodeCompass is an intelligent developer tool that transforms how you explore unfamiliar repositories. Point it at any public GitHub repo and get instant AI-powered insights: visual architecture maps, intelligent chat assistance, dependency breakdowns, and automated setup instructions.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5-blue) ![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-orange)

---

## Why CodeCompass?

Ever cloned a repository and spent hours trying to understand its structure? Reading through endless files, trying to piece together how components interact, searching for setup instructions scattered across multiple docs?

**CodeCompass solves this.** It automatically analyzes repositories and presents everything you need in one beautiful interface.

### What You Get

🔍 **Smart Repository Analysis**  
Paste any GitHub URL and watch CodeCompass clone, parse, and index the entire codebase in seconds.

🗺️ **Interactive Architecture Visualization**  
See how your codebase is structured with auto-generated node diagrams. Components, modules, and their relationships laid out visually using intelligent graph algorithms.

💡 **AI-Powered Q&A**  
Ask questions in plain English about the codebase. Get accurate answers backed by actual code snippets using Retrieval-Augmented Generation (RAG).

📋 **Automated Setup Instructions**  
No more hunting for installation steps. CodeCompass generates complete setup guides with commands, environment variables, and deployment notes.

📦 **Dependency Intelligence**  
Understand what libraries the project uses, categorized and searchable. See the full technology stack at a glance.

✨ **Beautiful Interface**  
Built with modern web technologies: animated Three.js backgrounds, smooth Framer Motion transitions, and a clean Tailwind design.

---

## How It Works

CodeCompass combines several technologies to deliver its magic:

```
User Input (GitHub URL)
        ↓
    GitPython clones repository
        ↓
    Parser extracts code structure
        ↓
    ChromaDB creates vector embeddings (local ONNX)
        ↓
    Gemini AI analyzes patterns
        ↓
    Beautiful Next.js dashboard displays results
```

### The Technical Pipeline

**Step 1: Repository Ingestion**  
When you submit a GitHub URL, GitPython clones the repository to a temporary location. Our custom parser then walks through the file tree, extracting meaningful code chunks.

**Step 2: Vector Embedding**  
Each code chunk gets embedded into a high-dimensional vector space using ChromaDB's local ONNX model (`all-MiniLM-L6-v2`). This happens entirely on your machine—no external API calls for embeddings.

**Step 3: Semantic Storage**  
Vectors are stored in a persistent ChromaDB collection, creating a searchable knowledge base of the codebase.

**Step 4: Intelligent Retrieval**  
When you ask a question, your query is embedded using the same model. ChromaDB finds the most semantically similar code chunks.

**Step 5: AI Generation**  
Retrieved chunks are sent to Gemini 2.0 Flash as context. The AI generates accurate, grounded answers based on actual code.

---

## Getting Started

### What You'll Need

- Python 3.10 or higher
- Node.js 18 or higher  
- A free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Setting Up the Backend

The backend handles repository cloning, code analysis, and AI interactions.

```bash
# Navigate to the backend directory
cd backend

# Create an isolated Python environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Or on macOS/Linux
source venv/bin/activate

# Install required packages
pip install -r requirements.txt

# Set up your environment variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY

# Launch the server
uvicorn app.main:app --reload --port 8000
```

Your backend is now running at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Setting Up the Frontend

The frontend provides the visual interface and user experience.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# (Optional) Configure API endpoint
cp .env.example .env.local
# Default points to http://localhost:8000

# Start the development server
npm run dev
```

Open http://localhost:3000 in your browser and you're ready to go!

### Development Mode

For frontend development without running the backend, enable mock data mode:

```typescript
// In frontend/lib/api.ts
export const USE_MOCK = true;
```

This returns realistic sample data instantly, perfect for UI work.

---

## API Reference

### Repository Ingestion

**POST** `/api/ingest`  
Submit a GitHub repository for analysis.

```json
{
  "github_url": "https://github.com/username/repository"
}
```

**GET** `/api/ingest/status/{repo_id}`  
Check the progress of repository indexing.

### Conversational Interface

**POST** `/api/chat`  
Ask questions about the codebase.

```json
{
  "repo_id": "unique-repo-identifier",
  "message": "How does the authentication system work?",
  "history": []
}
```

### Code Analysis

**GET** `/api/analysis/overview/{repo_id}`  
Retrieve project summary, technology stack, and health metrics.

**GET** `/api/analysis/architecture/{repo_id}`  
Get architecture diagram data (nodes and edges).

**GET** `/api/analysis/setup/{repo_id}`  
Fetch generated setup instructions.

**GET** `/api/analysis/dependencies/{repo_id}`  
List all project dependencies with categorization.

---

## Project Structure

### Backend Organization

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry
│   ├── models/
│   │   └── schemas.py          # Pydantic data models
│   ├── routers/
│   │   ├── ingest.py           # Repository ingestion endpoints
│   │   ├── chat.py             # Conversational AI endpoints
│   │   └── analysis.py         # Code analysis endpoints
│   └── services/
│       ├── git_service.py      # Git operations
│       ├── parser.py           # Code parsing logic
│       ├── vector_store.py     # ChromaDB interface
│       ├── rag.py              # RAG implementation
│       └── gemini_service.py   # Gemini AI integration
├── requirements.txt
├── Procfile                    # Railway deployment config
└── .env.example
```

### Frontend Organization

```
frontend/
├── app/
│   ├── page.tsx                # Landing page with 3D background
│   ├── layout.tsx              # Root layout wrapper
│   ├── globals.css             # Global styles
│   └── dashboard/[repoId]/
│       └── page.tsx            # Main dashboard with tabs
├── components/
│   ├── Overview.tsx            # Project overview tab
│   ├── RepoArchitectureFlow.tsx # Architecture visualization
│   ├── SetupGuide.tsx          # Setup instructions tab
│   ├── Dependencies.tsx        # Dependency analysis tab
│   ├── ChatInterface.tsx       # AI chat interface
│   ├── PipelineFlow.tsx        # Landing page diagram
│   └── ui/
│       ├── glsl-hills.tsx      # Three.js animated background
│       └── ...                 # Reusable UI components
└── lib/
    ├── api.ts                  # API client with mock toggle
    ├── mock-data.ts            # Sample data for development
    └── utils.ts                # Helper functions
```

---

## Technology Stack

### Backend Technologies

| Technology | Purpose |
|------------|---------|
| **FastAPI** | Modern Python web framework with automatic API documentation |
| **uvicorn** | Lightning-fast ASGI server for production |
| **ChromaDB** | Vector database with built-in ONNX embeddings |
| **google-generativeai** | Official Gemini AI Python SDK |
| **GitPython** | Programmatic Git operations |
| **pydantic-settings** | Type-safe environment configuration |

### Frontend Technologies

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router and server components |
| **TypeScript** | Type-safe JavaScript for better developer experience |
| **@xyflow/react** | Interactive node-based diagrams |
| **Framer Motion** | Smooth animations and transitions |
| **Three.js** | WebGL-powered 3D graphics |
| **Tailwind CSS** | Utility-first styling system |
| **Lucide React** | Beautiful icon library |
| **React Markdown** | Render markdown content |

---

## Deployment Guide

### Deploy Backend to Railway

Railway provides simple, scalable hosting for the FastAPI backend.

1. Sign up at [railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Configure the root directory as `backend`
4. Add environment variables:
   - `GEMINI_API_KEY` - Your Gemini API key
   - `ALLOWED_ORIGINS` - Your frontend URL (e.g., `https://yourapp.vercel.app`)
5. Railway automatically detects the `Procfile` and deploys

### Deploy Frontend to Vercel

Vercel is optimized for Next.js applications.

1. Sign up at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Framework preset will auto-detect Next.js
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` - Your Railway backend URL
6. Click Deploy

---

## Development Best Practices

### Virtual Environments Are Essential

Always use a virtual environment for Python development. This isolates project dependencies and prevents conflicts.

```bash
# Wrong approach - pollutes global Python
pip install -r requirements.txt

# Correct approach - isolated environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Understanding ChromaDB Embeddings

ChromaDB uses the `all-MiniLM-L6-v2` model via ONNX runtime, which runs **entirely on your machine**. This means:

✅ No embedding API keys required  
✅ Fast local inference  
✅ No rate limiting  
✅ Works offline after initial model download  
✅ Privacy-friendly—your code never leaves your machine for embeddings

### CORS Configuration

The backend needs to know which origins can access it. Configure this in your `.env`:

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://your-production-domain.com
```

---

## Troubleshooting

### Backend Issues

**Server won't start?**

```bash
# Verify virtual environment is active
which python  # Should point to venv/bin/python

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Verify environment file exists
cat .env
```

### Frontend Issues

**Build failing?**

```bash
# Clear all caches and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### ChromaDB Issues

**Vector database errors?**

```bash
# Remove ChromaDB data directory
rm -rf backend/.chroma

# Restart backend - ChromaDB will reinitialize automatically
```

---

## Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements, your help makes CodeCompass better for everyone.

---

## License

MIT License - This project is open source and free to use for any purpose.

---

## Acknowledgments

This project wouldn't be possible without these amazing technologies:

- **Gemini 2.0 Flash** - Powerful AI analysis capabilities
- **ChromaDB** - Efficient local vector embeddings
- **React Flow** - Beautiful interactive diagrams
- **Three.js** - Stunning WebGL visualizations

---

**Made for developers who believe understanding code shouldn't be a puzzle.**