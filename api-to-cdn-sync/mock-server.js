const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const mockData = {
  "data": [
    {
      "account": {
        "specification": {
          "display_name": "Standard",
          "information": "Trade CFDs with competitive spreads and swap fees.",
          "markets_offered": [
            "Forex",
            "Stock Indices",
            "Commodities",
            "Energies",
            "Cryptocurrencies",
            "ETFs"
          ],
          "max_leverage": 500,
          "pips": 0.6
        }
      }
    },
    {
      "account": {
        "specification": {
          "display_name": "Swap-Free",
          "information": "Hold positions without overnight charges.",
          "markets_offered": [
            "Forex",
            "Stock Indices",
            "Commodities",
            "Energies",
            "Cryptocurrencies",
            "ETFs"
          ],
          "max_leverage": 500,
          "pips": 2.2
        }
      }
    }
  ]
};

const server = http.createServer((req, res) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.API_AUTH_TOKEN || 'test-token-123';

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Auth header: ${authHeader || 'None'}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mock-api-server'
    }));
    return;
  }

  // Protected endpoints
  if (req.url.startsWith('/api/')) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Missing or invalid Authorization header',
        expected: 'Bearer <token>',
        received: authHeader || 'None'
      }));
      return;
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Invalid authentication token',
        provided: token.substring(0, 8) + '...'
      }));
      return;
    }
  }

  // Account specs endpoint
  if (req.url === '/api/account-specs') {
    const response = {
      ...mockData,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'mock-api-server',
        version: '1.0.0'
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }

  // 404 handler
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: `Endpoint not found: ${req.method} ${req.url}`,
    availableEndpoints: [
      'GET /health',
      'GET /api/account-specs (requires auth)'
    ]
  }));
});

server.listen(PORT, 'localhost', () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/account-specs`);
  console.log(`Expected auth token: ${process.env.API_AUTH_TOKEN || 'test-token-123'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down mock API server...');
  server.close(() => {
    console.log('Mock API server stopped.');
    process.exit(0);
  });
});
