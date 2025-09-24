<div align="center">
  <h1>FlowAI</h1>
  <p><strong>A powerful AI-driven knowledge synthesis platform for transforming ideas into structured, actionable insights.</strong></p>
  
  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <a href="https://github.com/LookUpMark/flow-ai/releases/tag/v1.0.2"><img src="https://img.shields.io/badge/version-v1.0.2-brightgreen.svg" alt="Version: v1.0.2"></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19.1.1-blue.svg" alt="React"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8.2-blue.svg" alt="TypeScript"></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6.2.0-purple.svg" alt="Vite"></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-blue.svg?logo=docker" alt="Docker Ready"></a>
  </p>
</div>

---

## 🌟 Overview

**FlowAI** is an intelligent knowledge management tool designed to help researchers, writers, and knowledge workers transform raw information into structured, interconnected insights. The platform leverages advanced AI capabilities to analyze, synthesize, and organize content from multiple formats and sources.

Whether you're conducting academic research, writing an in-depth article, or simply trying to make sense of a large amount of information, FlowAI is your partner for clarity and structure.

## ✨ Key Features

- **🔄 Multi-Stage Knowledge Pipeline**: Transform raw content through configurable stages of analysis, synthesis, condensation, and enhancement with enhanced consistency and quality controls.
- **📁 Universal File Support**: Process text files, PDFs, Word documents, PowerPoint presentations, and direct text input with a single workflow.
- **🧠 Intelligent Analysis**: Leverage state-of-the-art AI models for deep content understanding and contextual relationship mapping.
- **📊 Flexible Exporting**: Generate polished outputs in PDF, HTML, and Markdown formats with professional styling and print optimization.
- **⚙️ Configurable AI Models**: Full support for different AI providers and model configurations directly from the user interface.
- **🎨 Enhanced Rendering**: Perfect rendering of code blocks, mathematical equations, and Mermaid diagrams with robust error handling.
- **📱 Responsive Design**: A smooth and optimized user experience for both desktop and mobile workflows with improved font loading.
- **🐳 Dockerized Development Environment**: Quick and consistent setup with Docker for development and deployment.

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended method)
- **OR** Node.js 18+ and npm

---

### 🐳 Docker Setup (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/LookUpMark/flow-ai.git
    cd flow-ai
    ```

2.  **Configure Environment Variables:**
    Create a `.env.local` file from the example template:
    ```bash
    cp .env.local.example .env.local
    ```
    Edit the `.env.local` file and add your API keys:
    ```
    GEMINI_API_KEY=your_actual_gemini_api_key_here
    ```

3.  **Start the development environment:**
    This command will start a container with hot-reloading enabled.
    ```bash
    docker compose up --build
    ```

4.  **Access and Configure:**
    - **Access:** [http://localhost:5174](http://localhost:5174)
    - **Configure API Keys:** You can also configure API keys directly in the **Settings** panel for the desired AI providers (e.g., Google Gemini, OpenRouter).

5.  **Production Deployment:**
    To run the application in an optimized production environment:
    ```bash
    # Start the production container
    docker compose --profile production up
    ```
    - **Production:** [http://localhost:8080](http://localhost:8080)
    
    **Note:** The production profile doesn't require the `.env.local` file as it uses a different configuration approach.

---

### 📦 Local Node.js Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    The development server runs on port 5174 for consistency with Docker:
    ```bash
    npm run dev
    ```
    - **Access:** [http://localhost:5174](http://localhost:5174)

3.  **Configure API Keys:**
    Once the application is running, open the **Settings** panel to enter your API keys for the desired AI providers.

4.  **Build for production:**
    ```bash
    npm run build
    npm run preview
    ```

## 🔄 Recent Updates

### v1.0.2 Release - Enhanced Rendering & Font Loading (2025-09-24)

#### 🚀 **Major Improvements**
- **✨ Font Loading Enhancements**: Fixed Google Fonts Inter loading errors with comprehensive fallback system and JavaScript-based error handling
- **🔧 Code Block Rendering**: Enhanced all stage prompts with mandatory backtick syntax validation to ensure perfect code block rendering
- **🛠️ HTML Preview**: Improved PreviewDisplay component with DOCTYPE validation to prevent KaTeX quirks mode warnings
- **📚 Standardization**: Strengthened consistency rules across all AI models and processing sessions
- **🔍 Quality Assurance**: Comprehensive validation system for mathematical equations, Mermaid diagrams, and code blocks

#### 🐛 **Key Fixes**
- Resolved OTS parsing errors for Google Fonts
- Fixed code blocks not rendering when missing opening backticks
- Corrected KaTeX quirks mode warnings in HTML output
- Enhanced clipboard functionality with better error handling

#### 🎯 **Performance & UX**
- Optimized font loading with `font-display: swap`
- Improved cross-browser compatibility with robust fallback strategies
- Better rendering consistency across different content scenarios

### v1.0.1 Release - Port Configuration & Docker Improvements (2025-09-23)
- **Unified Port Configuration**: Development server consistently uses port **5174** for both Docker and local development
- **Docker Improvements**: Enhanced Docker setup with clearer logging and unified port mapping (`5174:5174`)
- **Better Developer Experience**: Container logs now clearly indicate the correct access URL
- **LMStudio Integration**: Maintained proxy configuration for LMStudio API compatibility

### Docker Configuration
- **Development**: Access at [http://localhost:5174](http://localhost:5174)
- **Production**: Access at [http://localhost:8080](http://localhost:8080)
- **Container Internal Port**: 5174 (aligned with external access)

---

## ⚙️ Usage and Configuration

### User Guide

1.  **Input Content**: Upload files (PDF, DOCX, TXT) or paste text directly into the input area.
2.  **Configure the Pipeline**: In the **Settings** panel, select the AI provider, enter the corresponding API key, choose a model, and customize the processing stages.
3.  **Start Processing**: Run the knowledge synthesis pipeline with enhanced quality controls and standardization.
4.  **Review the Results**: Examine the analysis and insights generated at each stage with improved formatting and rendering.
5.  **Export the Results**: Download the final document in your preferred format (PDF, DOCX, HTML, Markdown) with professional styling.

### Quality & Rendering Features

#### 🎨 **Enhanced Content Rendering**
- **Perfect Code Blocks**: All code snippets are guaranteed to render with proper syntax highlighting through mandatory backtick validation
- **Mathematical Equations**: LaTeX equations render flawlessly with proper escaping and KaTeX compatibility
- **Mermaid Diagrams**: Consistent diagram rendering with responsive sizing and error handling
- **Cross-Platform Compatibility**: Optimized for Obsidian, HTML export, and A4 print formatting

#### 🔧 **Improved Consistency**
- **Standardized Output**: Enhanced prompts ensure consistent formatting across different AI models and sessions
- **Quality Assurance**: Multi-stage validation prevents rendering issues before they occur
- **Error Prevention**: Comprehensive checks for malformed content and graceful error handling

### Troubleshooting

#### Port Issues
- **Development**: Always use port **5174** for consistent access across Docker and local development
- **Docker Logs**: Look for the message "🌐 Access the app at: http://localhost:5174" in container logs
- **Port Conflicts**: If port 5174 is occupied, modify the `ports` section in `docker-compose.yml`

#### Font Loading Issues (Fixed in v1.0.2)
- **Google Fonts**: The application now handles font loading errors gracefully with system font fallbacks
- **Performance**: Font loading is optimized with `font-display: swap` for better user experience
- **Fallback System**: Automatic fallback to system fonts (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`) if Google Fonts fail

#### Content Rendering Issues (Enhanced in v1.0.2)
- **Code Blocks**: All code blocks are now guaranteed to render properly with mandatory backtick validation
- **Mathematical Equations**: KaTeX quirks mode warnings have been eliminated with proper DOCTYPE handling
- **Mermaid Diagrams**: Improved diagram rendering with consistent theming and responsive sizing

#### LMStudio Integration
- **API Endpoint**: The app proxies `/api/v0` requests to `http://localhost:1234`
- **CORS Issues**: The proxy configuration handles cross-origin requests automatically
- **Documentation**: See `/docs/LMSTUDIO_*.md` for detailed setup and troubleshooting

## 🏗️ Project Architecture

The application follows a modular, component-based architecture to ensure maintainability and scalability.

```
.
├── /components           # Reusable React components (UI)
│   ├── ErrorDashboard.tsx
│   ├── ExportControls.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── HistoryPanel.tsx
│   ├── Icons.tsx
│   ├── InputPanel.tsx
│   ├── NotificationSystem.tsx
│   ├── OutputPanel.tsx
│   ├── PreviewDisplay.tsx
│   ├── PreviewModal.tsx
│   ├── SettingsModal.tsx
│   └── StageDisplay.tsx
├── /hooks                # Custom React hooks (state logic)
│   ├── useHistory.ts
│   └── useSettings.ts
├── /services             # Integrations with external services (AI, export)
│   ├── aiService.ts
│   ├── errorService.ts
│   ├── exportService.ts
│   └── loggingService.ts
├── /types                # TypeScript type definitions
├── /utils                # Utility functions
│   └── modelUtils.ts
├── /docs                 # Documentation
│   ├── LMSTUDIO_API_ENDPOINTS.md
│   ├── LMSTUDIO_TROUBLESHOOTING.md
│   └── SECURITY_*.md
├── /specs                # Project specifications and planning
├── /tests                # Test suites
│   ├── contract/
│   ├── integration/
│   └── unit/
├── App.tsx               # Root application component
├── constants.ts          # Global constants and configurations
├── types.ts              # Main TypeScript type definitions
├── index.tsx             # Application entry point
├── .env.local.example    # Example file for environment variables
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Multi-stage Dockerfile for dev/prod
├── nginx.conf            # Nginx configuration for production
├── package.json          # Project dependencies and scripts
└── vite.config.ts        # Vite configuration with proxy settings
```

### Technology Stack

-   **Frontend**: React 19.1.1, TypeScript 5.8.2, Tailwind CSS with enhanced font loading system
-   **Build Tool**: Vite 6.2.0 with optimized development server configuration
-   **AI Integration**: Google Generative AI (Gemini), LMStudio API support with enhanced prompt engineering
-   **Content Rendering**: Enhanced LaTeX (MathJax), Mermaid diagrams, syntax-highlighted code blocks
-   **File Processing**: PDF.js, Mammoth.js, JSZip for comprehensive file format support
-   **Exporting**: jsPDF, DocX with improved HTML generation and print optimization
-   **Quality Assurance**: Multi-stage validation system for consistent output across AI models
-   **Development**: Hot reloading, TypeScript strict mode, comprehensive error handling
-   **Containerization**: Docker multi-stage builds, Docker Compose with unified port configuration

## 📄 License

This project is released under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  © 2025 Marc'Antonio Lopez. All rights reserved.
</div>