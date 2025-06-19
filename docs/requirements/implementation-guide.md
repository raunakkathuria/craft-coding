# Implementation Guide: API-to-CDN Sync

## TDD Development Approach

This project follows Test-Driven Development (TDD) principles:
1. **Write tests first** for each module
2. **Keep modules simple** and focused on single responsibility
3. **Use pure functions** where possible for easy testing
4. **Start with MVP**, then iterate

## MVP Phase (2-3 days)

### Goal
Prove the core concept: Fetch → Transform → Save locally

### Project Structure
```
api-to-cdn-sync/
├── src/
│   ├── fetcher.js           # Pure function: url → data
│   ├── transformer.js       # Pure function: data → js string
│   └── main.js             # Simple orchestration
├── test/
│   ├── fetcher.test.js
│   ├── transformer.test.js
│   └── integration.test.js
├── output/                  # Generated files
├── package.json
└── config.json             # Simple configuration
```

### Setup
```bash
npm init -y
npm install --save-dev jest
npm install axios
```

### Configuration (`config.json`)
```json
{
  "apiBaseUrl": "https://your-api.com",
  "endpoints": [
    {
      "name": "account-specs",
      "path": "/api/account-specs",
      "outputFile": "account-specifications.js"
    }
  ]
}
```

## MVP Implementation (Start Here)

### 1. Test-First: Fetcher (`test/fetcher.test.js`)
```javascript
const { fetchApiData } = require('../src/fetcher');

describe('fetchApiData', () => {
  test('should fetch data from valid URL', async () => {
    const mockConfig = {
      apiBaseUrl: 'https://api.example.com',
      path: '/account-specs'
    };

    // Mock successful response
    const mockData = { data: [{ account: { specification: {} } }] };
    const result = await fetchApiData(mockConfig);

    expect(result).toEqual(mockData);
  });

  test('should handle API errors gracefully', async () => {
    const mockConfig = {
      apiBaseUrl: 'https://invalid-api.com',
      path: '/nonexistent'
    };

    await expect(fetchApiData(mockConfig)).rejects.toThrow();
  });
});
```

### 2. Simple Fetcher (`src/fetcher.js`)
```javascript
const axios = require('axios');

async function fetchApiData(config) {
  const url = `${config.apiBaseUrl}${config.path}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch from ${url}: ${error.message}`);
  }
}

module.exports = { fetchApiData };
```

### 3. Test-First: Transformer (`test/transformer.test.js`)
```javascript
const { transformToJS } = require('../src/transformer');

describe('transformToJS', () => {
  test('should convert JSON to JS module format', () => {
    const input = { data: [{ name: 'test' }] };
    const config = { name: 'account-specs' };

    const result = transformToJS(input, config);

    expect(result).toContain('export const accountSpecs');
    expect(result).toContain(JSON.stringify(input));
  });

  test('should handle camelCase conversion', () => {
    const input = { data: [] };
    const config = { name: 'trading-instruments' };

    const result = transformToJS(input, config);

    expect(result).toContain('export const tradingInstruments');
  });
});
```

### 4. Simple Transformer (`src/transformer.js`)
```javascript
const fs = require('fs');
const path = require('path');

function transformToJS(data, config) {
  const varName = toCamelCase(config.name);
  const timestamp = new Date().toISOString();

  return `// Generated on ${timestamp}
export const ${varName} = ${JSON.stringify(data, null, 2)};

export const metadata = {
  timestamp: "${timestamp}",
  source: "${config.name}"
};
`;
}

function saveToFile(content, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, content, 'utf8');
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

module.exports = { transformToJS, saveToFile };
```

### 5. Simple Main Script (`src/main.js`)
```javascript
const { fetchApiData } = require('./fetcher');
const { transformToJS, saveToFile } = require('./transformer');
const config = require('../config.json');

async function main() {
  try {
    console.log('Starting API-to-CDN sync...');

    const endpoint = config.endpoints[0]; // Single endpoint for MVP

    // 1. Fetch data
    const data = await fetchApiData({
      apiBaseUrl: config.apiBaseUrl,
      path: endpoint.path
    });

    // 2. Transform to JS
    const jsContent = transformToJS(data, endpoint);

    // 3. Save locally
    const outputPath = `output/${endpoint.outputFile}`;
    saveToFile(jsContent, outputPath);

    console.log(`✅ Successfully generated ${outputPath}`);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

### 6. Integration Test (`test/integration.test.js`)
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('End-to-end MVP', () => {
  beforeEach(() => {
    // Clean output directory
    if (fs.existsSync('output')) {
      fs.rmSync('output', { recursive: true });
    }
  });

  test('should complete full sync process', async () => {
    // Run the main script
    execSync('node src/main.js');

    // Check output file exists
    const outputFile = 'output/account-specifications.js';
    expect(fs.existsSync(outputFile)).toBe(true);

    // Check file content
    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).toContain('export const accountSpecs');
    expect(content).toContain('metadata');
  });
});
```

## MVP Testing & Validation

### Run Tests
```bash
npm test
```

### Manual Testing
```bash
# Test the MVP
node src/main.js

# Verify output
ls output/
cat output/account-specifications.js

# Test in browser/Node.js
node -e "const mod = require('./output/account-specifications.js'); console.log(mod.metadata);"
```

## Phase 1: Add GitHub Actions (After MVP Works)

Only proceed to Phase 1 after MVP is proven to work locally.

## GitHub Actions Workflows

### 1. Daily Sync (`.github/workflows/sync-daily.yml`)
```yaml
name: Daily API Sync

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:      # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build TypeScript
      run: npx tsc

    - name: Sync all endpoints
      env:
        API_BASE_URL: ${{ secrets.API_BASE_URL }}
        API_AUTH_TOKEN: ${{ secrets.API_AUTH_TOKEN }}
        CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      run: node dist/index.js

    - name: Notify on failure
      if: failure()
      uses: actions/github-script@v7
      with:
        script: |
          const { owner, repo } = context.repo;
          await github.rest.issues.create({
            owner,
            repo,
            title: 'Daily API Sync Failed',
            body: `The daily API sync failed. Check the [workflow run](${context.payload.workflow_run?.html_url || 'workflow'}) for details.`,
            labels: ['bug', 'automation']
          });
```

### 2. On-Demand Sync (`.github/workflows/sync-on-demand.yml`)
```yaml
name: On-Demand API Sync

on:
  repository_dispatch:
    types: [api-data-changed]
  workflow_dispatch:
    inputs:
      endpoint:
        description: 'Specific endpoint to sync (optional)'
        required: false
        type: string

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build TypeScript
      run: npx tsc

    - name: Sync endpoint
      env:
        API_BASE_URL: ${{ secrets.API_BASE_URL }}
        API_AUTH_TOKEN: ${{ secrets.API_AUTH_TOKEN }}
        CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      run: |
        ENDPOINT="${{ github.event.inputs.endpoint || github.event.client_payload.endpoint }}"
        if [ -n "$ENDPOINT" ]; then
          node dist/index.js "$ENDPOINT"
        else
          node dist/index.js
        fi
```

## Real-time Triggering Setup

### 1. Webhook Endpoint (in your main application)
```typescript
// Express.js example
app.post('/webhooks/api-changed', async (req, res) => {
  const { endpoint } = req.body;

  try {
    await axios.post(
      'https://api.github.com/repos/your-org/api-to-cdn-sync/dispatches',
      {
        event_type: 'api-data-changed',
        client_payload: { endpoint }
      },
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to trigger sync:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});
```

### 2. Trigger from API Changes
```bash
# Curl example - call this when your API data changes
curl -X POST https://api.github.com/repos/your-org/api-to-cdn-sync/dispatches \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"event_type": "api-data-changed", "client_payload": {"endpoint": "account-specifications"}}'
```

## Usage in Client Applications

### 1. Direct Import
```javascript
// Modern ES6 import
import { accountSpecifications, metadata } from 'https://cdn.your-domain.com/account-specifications.js';

console.log('Data version:', metadata.version);
console.log('Account specs:', accountSpecifications);
```

### 2. Dynamic Loading
```javascript
// Dynamic import with error handling
async function loadAccountSpecs() {
  try {
    const module = await import('https://cdn.your-domain.com/account-specifications.js');
    return module.accountSpecifications;
  } catch (error) {
    console.error('Failed to load account specs:', error);
    // Fallback to API
    const response = await fetch('/api/account-specs');
    return response.json();
  }
}
```

## Troubleshooting

### Common Issues

**1. Cloudflare API Token Permissions**
```
Error: "Insufficient permissions"
```
**Solution**: Ensure your Cloudflare API token has `Zone:Edit` permissions for your domain.

**2. GitHub Actions Secrets**
```
Error: "CLOUDFLARE_API_TOKEN is not defined"
```
**Solution**: Add the secret in GitHub repository settings under `Settings > Secrets and variables > Actions`.

**3. CORS Issues**
```
Error: "CORS policy blocked the request"
```
**Solution**: Configure Cloudflare to add proper CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

**4. File Not Found on CDN**
```
Error: "404 Not Found"
```
**Solution**: Check Cloudflare DNS settings and ensure your domain is properly configured.

### Debugging Steps

1. **Check GitHub Actions logs** for build/deployment errors
2. **Verify Cloudflare Zone ID** in your account dashboard
3. **Test API endpoints** manually with curl or Postman
4. **Check CDN file accessibility** directly in browser
5. **Monitor Cloudflare Analytics** for cache hit rates

### Monitoring Commands
```bash
# Test endpoint manually
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.yoursite.com/api/account-specs

# Check CDN file
curl https://cdn.your-domain.com/account-specifications.js

# Trigger manual sync
gh workflow run sync-on-demand.yml
```

## Adding New Endpoints

### 1. Update Configuration
Add to `src/config.ts`:
```typescript
{
  name: 'trading-instruments',
  apiPath: '/api/instruments',
  outputFile: 'trading-instruments.js',
  cacheTtl: 43200 // 12 hours
}
```

### 2. Test Locally
```bash
npm run build
node dist/index.js trading-instruments
```

### 3. Deploy
Commit and push - the workflow will automatically handle the new endpoint.

That's it! Your API-to-CDN sync is now ready for production use.
