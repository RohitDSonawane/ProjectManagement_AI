# Case Study Agent

## Overview
The AI Project Management Learning Agent is a prototype designed to help students study project management by providing scenario-driven explanations that bridge the gap between abstract theory and practical application. 

It generates structured Case Study Cards grounded in real-world data and standard PMBOK practices via a simple, intelligent AI agent.

## Core Features
- Intelligent Data Sourcing: Utilizes a Large Language Model (native tool-calling via OpenRouter) to automatically select the most appropriate data sources.
- RAG Integration: Retrieves PMBOK-aligned theory directly from a Supabase Vector database.
- Web Search: Acquires dynamic, real-world examples via the Tavily API.
- Case Study Cards: Returns consistently structured JSON containing a Story, Problem, Decision, and Lessons.

## Architecture
- Backend: Python FastAPI with a linear Reasoning Loop (simplified alternative to LangGraph).
- Database: Supabase (PostgreSQL with pgvector for vector storage and query history).
- AI Provider: OpenRouter (Qwen / GPT-4o / Claude).
- Deployment / Local Execution: Operates via standard Python virtual environments.

## Getting Started

### Prerequisites
- Python 3.10+
- Supabase account and project
- Tavily API key
- OpenRouter API key

### Backend Setup
1. Clone the repository and navigate to the backend directory:
   cd CaseStudy_Agent/backend

2. Create and activate a virtual environment:
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate

3. Install the dependencies:
   pip install -r requirements.txt

4. Configure the environment variables:
   Copy .env.example to .env and fill in your Supabase, Tavily, and OpenRouter API keys.

5. Run the interactive testing shell:
   python interactive_test.py
   # Or to run the FastAPI app directly if a server script is provided.

## Usage
Submit a query through the interactive terminal or FastAPI endpoints (e.g., "What is a Risk Register?") and the system will orchestrate history lookup, database retrieval, and real-time web search before generating a targeted PM case study card in JSON format.

## Contributing
When making contributions, please follow the strict standards defined in the project documentation:
- Enforce strict Python typing and Pydantic models.
- Maintain the single-source-of-truth in Supabase.
- Avoid introducing unstructured decorators or over-complicated metaprogramming.
