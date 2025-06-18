FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start server
CMD ["node", "server.js"]
