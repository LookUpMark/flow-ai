# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 5174
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Docker Development
- `docker compose up --build` - Start development environment with hot reloading
- `docker compose --profile production up` - Start production environment on port 8080

### Environment Setup
- Copy `.env.local.example` to `.env.local` and configure API keys
- Development server runs on port 5174 for both local and Docker setups
- Production environment uses port 8080

## Architecture Overview

FlowAI is a React-based knowledge synthesis platform that processes content through multiple AI-powered stages.

### Core Components

**Main Application (`App.tsx`)**
- Central orchestrator managing the knowledge pipeline
- Handles file processing, AI service integration, and state management
- Implements comprehensive error handling and user feedback

**Pipeline Stages (defined in `types.ts`)**
- `synthesizer` - Initial content organization and comprehension
- `condenser` - Content summarization and key point extraction
- `enhancer` - Content enhancement with additional insights
- `mermaidValidator` - Diagram validation and formatting
- `finalizer` - Final output formatting and polish
- `htmlTranslator` - HTML generation for export functionality

### Service Layer

**AI Service (`services/aiService.ts`)**
- Manages interactions with Google Gemini AI and LMStudio
- Implements retry logic, error handling, and performance monitoring
- Proxy-aware for development (proxies `/api/v0` to `localhost:1234` for LMStudio)

**Error Service (`services/errorService.ts`)**
- Centralized error management with unique error codes
- Enhanced error context with severity levels and user actions
- Integrates with logging service for comprehensive tracking

**Export Service (`services/exportService.ts`)**
- Handles PDF, DOCX, HTML, and Markdown export generation
- Integrates with jsPDF, DocX libraries for document generation

**Logging Service (`services/loggingService.ts`)**
- Comprehensive logging for API calls, performance metrics, and user actions
- Supports debugging and monitoring of application behavior

### Key Features

**Multi-Stage Processing Pipeline**
- Configurable AI-powered transformation stages
- Enhanced consistency controls and quality validation
- Mandatory rendering specifications for code blocks, equations, and diagrams

**File Processing**
- Supports PDF, DOCX, TXT files via PDF.js, Mammoth.js
- Direct text input capabilities
- Comprehensive file type handling

**Content Rendering**
- Enhanced LaTeX equation rendering with KaTeX
- Mermaid diagram validation and responsive sizing
- Syntax-highlighted code blocks with mandatory backtick validation
- Cross-platform compatibility (Obsidian, HTML export, A4 print)

**Quality Assurance**
- Multi-stage validation system preventing rendering issues
- Standardized output formatting across AI models
- Comprehensive error handling with user-friendly messages

### Technology Stack

- **Frontend**: React 19.1.1, TypeScript 5.8.2, Tailwind CSS
- **Build Tool**: Vite 6.2.0 with development server on port 5174
- **AI Integration**: Google Generative AI (Gemini), LMStudio API support
- **Content Processing**: PDF.js, Mammoth.js, JSZip for file handling
- **Export**: jsPDF, DocX, marked for Markdown processing
- **Development**: Hot reloading, TypeScript strict mode, Docker support

### Configuration Files

**Vite Configuration (`vite.config.ts`)**
- Development server on port 5174 with host binding
- Proxy configuration for LMStudio API (`/api/v0` → `localhost:1234`)
- Manual chunk optimization for Google GenAI and office utilities

**Docker Configuration**
- Multi-stage Dockerfile with development and production targets
- Development: Node.js 20 Alpine with hot reloading
- Production: Nginx serving pre-built static files

### Development Notes

**Port Configuration**
- Always use port 5174 for development (both local and Docker)
- Production uses port 8080
- Container logs display access URL for confirmation

**Error Handling**
- Enhanced error system with unique codes (e.g., 'API_001', 'VAL_002')
- Categorized by severity levels and error types
- Provides user-friendly action suggestions

**Content Rendering Standards**
- Code blocks MUST use triple backticks with language specification
- Mathematical equations use LaTeX syntax with proper delimiters
- Mermaid diagrams follow standardized syntax within code blocks
- Consistent heading hierarchy and formatting enforced across all stages