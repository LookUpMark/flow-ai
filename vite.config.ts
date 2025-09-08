import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: '0.0.0.0'
      },
      optimizeDeps: {
        include: ['@google/genai', 'docx', 'file-saver', 'jspdf', 'marked'],
        exclude: []
      },
      build: {
        rollupOptions: {
          external: [],
          output: {
            manualChunks: {
              'google-genai': ['@google/genai'],
              'office-utils': ['docx', 'file-saver', 'jspdf']
            }
          }
        }
      }
    };
});
