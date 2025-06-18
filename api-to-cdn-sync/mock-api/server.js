const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load mock data
const loadMockData = () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'account-specs.json');
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (error) {
    console.error('Failed to load mock data:', error.message);
    return { data: [] };
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.API_AUTH_TOKEN || 'test-token-123';

  console.log(`[${new Date().toISOString()}] Auth check for ${req.path}`);
  console.log(`Expected: Bearer ${expectedToken}`);
  console.log(`Received: ${authHeader || 'None'}`);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      expected: 'Bearer <token>',
      received: authHeader || 'None'
    });
  }

  const token = authHeader.substring(7);
  if (token !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid authentication token',
      provided: token.substring(0, 8) + '...'
    });
  }

  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mock-api-server'
  });
});

// Protected API endpoints
app.use('/api/*', authenticateToken);

// Account specifications endpoint
app.get('/api/account-specs', (req, res) => {
  console.log(`[${new Date().toISOString()}] Serving account specifications`);

  const mockData = loadMockData();

  // Add response metadata
  const response = {
    ...mockData,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'mock-api-server',
      version: '1.0.0'
    }
  };

  res.json(response);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /api/account-specs (requires auth)'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/account-specs`);
  console.log(`Expected auth token: ${process.env.API_AUTH_TOKEN || 'test-token-123'}`);
});
