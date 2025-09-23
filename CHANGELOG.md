# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-09-23

### 🔧 Configuration & Developer Experience

#### Port Configuration Improvements
- **Unified Port 5174**: Standardized development server to use port 5174 for both Docker and local development
- **Consistent Access**: Eliminated confusion between container internal ports and external access ports
- **Docker Port Mapping**: Updated `docker-compose.yml` to use `5174:5174` mapping for clearer port configuration

#### Docker Enhancements
- **Enhanced Logging**: Added informative startup messages showing correct access URLs
- **Better Developer Experience**: Container logs now clearly indicate access at `http://localhost:5174`
- **Vite Configuration**: Updated Vite config to use port 5174 for consistency across all development environments

#### Documentation Updates
- **README.md**: Updated all port references and Docker setup instructions
- **Recent Updates Section**: Added changelog summary in README for better visibility
- **Troubleshooting Guide**: Enhanced troubleshooting section with port configuration help
- **Architecture Documentation**: Updated project structure to reflect current codebase organization

### 🛠️ Technical Changes

- **docker-compose.yml**: Changed port mapping from `8000:5173` to `5174:5174`
- **Dockerfile**: Updated EXPOSE directive from 5173 to 5174
- **vite.config.ts**: Changed server port from 3000 to 5174
- **Enhanced startup script**: Added clear messaging for container startup

### 🐛 Fixes

- **Port Consistency**: Resolved confusion between logged ports and actual access ports
- **Docker Development**: Improved developer experience with unified port configuration
- **Documentation Accuracy**: All documentation now reflects current configuration

---

## [1.0.0] - 2025-09-22

### 🎉 Initial Release

FlowAI v1.0.0 marks the first stable release of our AI-driven knowledge synthesis platform.

### ✨ Features

#### Core Functionality
- **Multi-Stage Knowledge Pipeline**: Transform raw content through configurable stages of analysis, synthesis, condensation, and enhancement
- **Universal File Support**: Process text files, PDFs, Word documents, PowerPoint presentations, and direct text input
- **Intelligent Analysis**: Leverage state-of-the-art AI models for deep content understanding and contextual relationship mapping

#### AI Integration
- **Google Gemini Support**: Full integration with Google's Generative AI models
- **Flexible Model Configuration**: Support for different AI providers and model configurations
- **Configurable Processing Stages**: Customizable analysis, synthesis, and enhancement workflows

#### User Experience
- **Responsive Design**: Optimized for both desktop and mobile workflows
- **Intuitive Interface**: Clean, modern UI with easy-to-use input and output panels
- **Real-time Processing**: Live updates during the knowledge synthesis process
- **History Management**: Track and revisit previous processing sessions

#### Export Capabilities
- **Multiple Export Formats**: Generate outputs in PDF, DOCX, and Markdown formats
- **Polished Documents**: Professional formatting ready for sharing or archiving
- **Customizable Output**: Flexible export options to meet different needs

#### Development & Deployment
- **Docker Support**: Complete Docker and Docker Compose setup for development and production
- **Modern Tech Stack**: Built with React 19, TypeScript, and Vite
- **Production Ready**: Optimized build process with Nginx configuration
- **Security Features**: Comprehensive security architecture and compliance measures

#### Developer Experience
- **TypeScript Support**: Full type safety throughout the application
- **Component Architecture**: Modular, maintainable component structure
- **Custom Hooks**: Reusable state management with React hooks
- **Service Layer**: Clean separation of concerns with dedicated service modules

### 🛠️ Technical Specifications

- **Frontend**: React 19.1.1, TypeScript 5.8.2, Tailwind CSS
- **Build Tool**: Vite 6.2.0
- **AI Integration**: Google Generative AI v1.17.0
- **File Processing**: Support for PDF, DOCX, TXT, and PPTX files
- **Export Libraries**: jsPDF 3.0.2, DocX 9.5.1
- **Development**: Hot-reloading, Docker containerization
- **Production**: Nginx optimization, Docker multi-stage builds

### 📦 Installation Methods

- **Docker Compose**: Quick setup with `docker compose up`
- **Local Development**: Node.js 18+ with npm install
- **Production Deployment**: Optimized Docker containers

### 🔧 Configuration

- **Environment Variables**: Support for `.env.local` configuration
- **API Key Management**: In-app settings panel for AI provider configuration
- **Processing Stages**: Customizable workflow configuration
- **Export Settings**: Flexible output format options

### 📚 Documentation

- **Comprehensive README**: Complete setup and usage instructions
- **Security Documentation**: Detailed security architecture and compliance guides
- **API Documentation**: LM Studio integration and troubleshooting guides
- **Error Management**: Comprehensive error handling and debugging guides

### 🔒 Security

- **Secure API Handling**: Safe management of API keys and sensitive data
- **Input Validation**: Comprehensive validation for all user inputs
- **Error Boundaries**: Graceful error handling and recovery
- **Compliance Ready**: Security architecture designed for enterprise use

---

For more information, see the [README.md](README.md) and [documentation](docs/) folder.