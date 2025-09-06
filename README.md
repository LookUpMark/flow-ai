# 🧠 Obsidian Knowledge Architect

**Transform raw content into perfectly structured Obsidian notes with AI**

Obsidian Knowledge Architect is an intelligent web application that leverages AI to convert unstructured text, documents, and files into beautifully formatted Markdown notes optimized for Obsidian. Using a sophisticated 4-stage processing pipeline, it transforms chaotic information into clear, organized, and interconnected knowledge.

## ✨ Key Features

- **🤖 AI-Powered Processing**: Utilizes advanced AI models (Gemini, OpenRouter, Ollama) for intelligent content transformation
- **📄 Multi-Format Support**: Process PDF, DOCX, PPTX, and plain text files
- **🔄 4-Stage Pipeline**: Synthesize → Condense → Enhance → Finalize for optimal content structure
- **📊 Visual Diagrams**: Automatic generation of Mermaid diagrams for complex concepts
- **📱 Multiple Export Options**: Export to PDF, DOCX, Markdown, or LaTeX formats
- **🎨 HTML Preview**: Generate beautiful HTML previews of your processed content
- **⚙️ Flexible Configuration**: Support for multiple AI providers and model configurations
- **🎯 Obsidian-Optimized**: Output specifically formatted for seamless Obsidian integration

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 16 or higher)
- **AI API Key** from one of the supported providers:
  - Google Gemini API key (recommended)
  - OpenRouter API key
  - Local Ollama installation

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/LookUpMark/obsidian-knowledge-architect.git
   cd obsidian-knowledge-architect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your AI provider:**
   
   **For Gemini (Recommended):**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/)
   - Set the `API_KEY` environment variable:
     ```bash
     # Create .env.local file
     echo "API_KEY=your_gemini_api_key_here" > .env.local
     ```

   **For other providers:** Configure through the settings panel in the application.

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## 🛠️ How It Works

### The 4-Stage Pipeline

Obsidian Knowledge Architect processes your content through four specialized AI agents:

#### 1. 🔍 **Synthesizer** - *Comprehension & Initial Organization*
- Analyzes all input sources holistically
- Extracts every piece of information and concept
- Identifies logical structure and sequence
- Creates hierarchical Markdown organization
- Prioritizes completeness over conciseness

#### 2. 🗜️ **Condenser** - *Information Density Optimization*
- Eliminates redundancy and verbosity
- Removes filler words and passive constructions
- Consolidates duplicate concepts
- Increases information density while preserving all content
- Maintains 100% of original information

#### 3. ✨ **Enhancer** - *Clarity & Visual Enrichment*
- Improves logical flow and readability
- Adds transition words and clear connections
- Enriches content with:
  - Code snippets and examples
  - Mathematical equations (LaTeX)
  - Structured tables
  - Mermaid diagrams for complex processes
- Optimizes for comprehension and visual appeal

#### 4. 🎯 **Finalizer** - *Obsidian Optimization*
- Applies Obsidian-specific formatting conventions
- Creates proper internal linking structure
- Optimizes metadata and frontmatter
- Ensures seamless integration with Obsidian workflows
- Final quality check and polish

## 📁 Supported File Formats

| Format | Description | Max Size |
|--------|-------------|----------|
| **PDF** | Extract text from PDF documents | Recommended < 10MB |
| **DOCX** | Microsoft Word documents | Recommended < 5MB |
| **PPTX** | PowerPoint presentations | Recommended < 5MB |
| **TXT** | Plain text files | No practical limit |
| **Direct Input** | Paste text directly into the interface | No practical limit |

## 🤖 AI Provider Configuration

### Gemini (Google AI)
- **Best for:** High-quality processing with diagram generation
- **Setup:** Get API key from [Google AI Studio](https://aistudio.google.com/)
- **Models:** Flash (fast) or Pro (highest quality)
- **Features:** Full feature support including Mermaid diagrams

### OpenRouter
- **Best for:** Access to multiple model providers
- **Setup:** Get API key from [OpenRouter](https://openrouter.ai/)
- **Models:** Choose from various available models
- **Features:** Core processing without diagram generation

### Ollama (Local)
- **Best for:** Privacy-focused local processing
- **Setup:** Install [Ollama](https://ollama.ai/) locally
- **Models:** llama2, codellama, mistral, etc.
- **Features:** Complete local processing

## 📤 Export Options

- **📄 Markdown (.md)** - Perfect for Obsidian import
- **📑 PDF** - Formatted document with preserved styling
- **📝 DOCX** - Microsoft Word format for collaboration
- **🔬 LaTeX** - Academic and scientific document format

## 🎮 Usage Guide

1. **Choose your content source:**
   - Upload a file (PDF, DOCX, PPTX)
   - Paste text directly into the input area
   - Or combine both methods

2. **Set your topic:**
   - Enter a descriptive topic for your content
   - Use the "Generate Topic" button for AI suggestions

3. **Configure processing options:**
   - Enable/disable diagram generation
   - Enable/disable HTML preview
   - Choose model configuration (Flash vs Pro)

4. **Process your content:**
   - Click "Generate Knowledge Architecture"
   - Watch as each stage processes your content
   - Review the output in real-time

5. **Export your results:**
   - Choose your preferred export format
   - Download the processed content
   - Import directly into Obsidian

## ⚙️ Settings & Customization

### Model Configuration
- **Flash Mode**: Faster processing, good quality
- **Pro Mode**: Highest quality processing, slower
- **Reasoning Mode**: Enhanced logical processing (when available)

### Provider Settings
Access the settings panel to configure:
- AI provider selection
- API keys and endpoints
- Model-specific parameters
- Processing preferences

## 🔧 Troubleshooting

### Common Issues

**"API key not valid" error:**
- Verify your API key is correctly set
- Check that the key has appropriate permissions
- Ensure you're using the correct provider

**"Rate limit exceeded" error:**
- Wait a few moments before retrying
- Consider upgrading your API plan
- Switch to a different model configuration

**File upload fails:**
- Check file size limits
- Ensure file format is supported
- Try with a smaller or different file

**Slow processing:**
- Large files take longer to process
- Pro models are slower but higher quality
- Check your network connection

### Performance Tips

- For large documents, consider breaking them into smaller sections
- Use Flash mode for faster processing of simple content
- Pro mode provides better results for complex technical content
- Local Ollama processing may be slower but more private

## 🤝 Contributing

We welcome contributions! Please feel free to:

1. **Report Issues**: Use GitHub Issues for bug reports
2. **Suggest Features**: Open a discussion for new feature ideas
3. **Submit Pull Requests**: 
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/LookUpMark/obsidian-knowledge-architect.git

# Install dependencies
cd obsidian-knowledge-architect
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the intelligent processing
- **Obsidian** for creating an amazing knowledge management platform
- **React** and **TypeScript** for the robust foundation
- **Vite** for the fast development experience
- **Mermaid** for beautiful diagram generation

---

<div align="center">

**Transform your knowledge. Architect your thoughts. Build with AI.**

[🌟 Star this repository](https://github.com/LookUpMark/obsidian-knowledge-architect) if you find it useful!

</div>
