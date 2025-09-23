# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 5174

CMD ["sh", "-c", "echo '🚀 Server starting on port 5174 inside container' && echo '🌐 Access the app at: http://localhost:5174' && npm run dev -- --host 0.0.0.0"]

# Production stage (uses pre-built dist folder)
FROM nginx:alpine AS production

# Copy pre-built application
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]