FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy application code
COPY . .

# Create output directory
RUN mkdir -p output

# Default command (can be overridden)
CMD ["node", "main.js"]
