# 🧠 Obsidian Knowledge Architect

<div align="center">

**A powerful AI-driven knowledge synthesis platform for transforming ideas into structured, actionable insights.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-purple.svg)](https://vitejs.dev/)

</div>

## 🌟 Overview

Obsidian Knowledge Architect is an intelligent knowledge management tool designed to help researchers, writers, and knowledge workers transform raw information into structured, interconnected insights. The platform leverages advanced AI capabilities to analyze, synthesize, and organize content across multiple formats and sources.

### ✨ Key Features

- **🔄 Multi-Stage Knowledge Pipeline**: Transform raw content through analysis, synthesis, and structuring stages
- **📁 Universal File Support**: Process text files, PDFs, Word documents, and direct text input
- **🧠 Intelligent Analysis**: Deep content understanding and contextual relationship mapping  
- **📊 Export Flexibility**: Generate outputs in PDF, Word, and Markdown formats
- **⚙️ Configurable AI Models**: Support for multiple AI providers and model configurations
- **📱 Responsive Design**: Optimized for desktop and mobile workflows
- **🔧 Local Development**: Complete Docker-based development environment

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **OR** Node.js 18+ and npm

### 🐳 Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/LookUpMark/obsidian-knowledge-architect.git
   cd obsidian-knowledge-architect
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your AI service API key
   ```

3. **Run development environment**
   ```bash
   docker compose up
   ```

4. **Access the application**
   - Development: http://localhost:5173

5. **For production deployment**
   ```bash
   # First build the application locally
   npm run build
   
   # Then run production container
   docker compose --profile production up
   ```
   - Production: http://localhost:8080

### 📦 Local Node.js Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your AI service API key
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## ⚙️ Configuration

### Environment Variables

Create `.env.local` file with the following:

```env
# Required: AI Service API Key
GEMINI_API_KEY=your_api_key_here

# Optional: Additional configuration
NODE_ENV=development
```

### AI Model Configuration

The application supports multiple AI providers and models. Configure your preferred setup through the settings panel in the application interface.

## 🏗️ Architecture

The application follows a modular architecture with clear separation of concerns:

```
├── components/          # React UI components
├── hooks/              # Custom React hooks  
├── services/           # AI service integrations
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
└── utils/              # Utility functions
```

### Core Components

- **Knowledge Pipeline**: Multi-stage content processing engine
- **File Processing**: Universal document format support
- **Export Engine**: Multi-format output generation
- **Settings Management**: Persistent configuration system
- **History Tracking**: Session and processing history

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
```

### Docker Commands

```bash
# Development with hot reload
docker compose up

# Production build
docker compose --profile production up

# Rebuild containers
docker compose up --build
```

## 📖 Usage

1. **Input Content**: Upload files or paste text directly
2. **Configure Pipeline**: Adjust AI model settings and processing stages
3. **Process Content**: Run the knowledge synthesis pipeline
4. **Review Results**: Examine generated analysis and insights
5. **Export Results**: Download in your preferred format

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Follow TypeScript best practices
- Maintain component modularity
- Write descriptive commit messages
- Test changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI Integration**: Google Generative AI
- **File Processing**: PDF.js, Mammoth.js, JSZip
- **Export**: jsPDF, DocX
- **Containerization**: Docker, Docker Compose

## 📞 Support

For questions, issues, or contributions, please:

- Open an issue on GitHub
- Check the documentation
- Review existing discussions

---

<div align="center">

**Built with ❤️ for knowledge workers everywhere**

© 2025 Marc'Antonio Lopez. All rights reserved.

</div>
