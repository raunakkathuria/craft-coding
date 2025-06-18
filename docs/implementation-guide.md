# Implementation Guide: API-to-CDN Sync

## Prerequisites

### Required Accounts & Access
- **GitHub Repository** with Actions enabled
- **Cloudflare Account** with API access
- **Node.js 18+** installed locally
- **Your API endpoint** accessible via HTTP/HTTPS

### Required Secrets
Set these in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Zone:Edit permissions | `abc123...` |
| `CLOUDFLARE_ZONE_ID` | Your domain's Cloudflare Zone ID | `def456...` |
| `API_BASE_URL` | Your API base URL | `https://api.yoursite.com` |
| `API_AUTH_TOKEN` | API authentication token (if required) | `Bearer xyz789...` |

## Project Setup

### 1. Repository Structure
```
api-to-cdn-sync/
├── .github/workflows/
│   ├── sync-daily.yml
│   └── sync-on-demand.yml
├── src/
│   ├── config.ts
│   ├── fetcher.ts
│   ├── transformer.ts
│   └── publisher.ts
├── dist/                     # Generated files
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Initialize Project
```bash
npm init -y
npm install --save-dev typescript @types/node
npm install axios dotenv
npx tsc --init
```

### 3. TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Core Implementation

### 1. Configuration (`src/config.ts`)
```typescript
export interface EndpointConfig {
  name: string;
  apiPath: string;
  outputFile: string;
  cacheTtl?: number;
}

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || '',
  apiAuthToken: process.env.API_AUTH_TOKEN,
  cloudflareZoneId: process.env.CLOUDFLARE_ZONE_ID || '',
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || '',

  endpoints: [
    {
      name: 'account-specifications',
      apiPath: '/api/account-specs',
      outputFile: 'account-specifications.js',
      cacheTtl: 86400 // 24 hours
    }
  ] as EndpointConfig[]
};
```

### 2. Data Fetcher (`src/fetcher.ts`)
```typescript
import axios from 'axios';
import { config, EndpointConfig } from './config';

export async function fetchApiData(endpoint: EndpointConfig): Promise<any> {
  const url = `${config.apiBaseUrl}${endpoint.apiPath}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'API-to-CDN-Sync/1.0'
  };

  if (config.apiAuthToken) {
    headers['Authorization'] = config.apiAuthToken;
  }

  try {
    console.log(`Fetching data from: ${url}`);
    const response = await axios.get(url, {
      headers,
      timeout: 30000,
      validateStatus: (status) => status < 500
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ Successfully fetched ${endpoint.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${endpoint.name}:`, error);
    throw error;
  }
}
```

### 3. Data Transformer (`src/transformer.ts`)
```typescript
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { EndpointConfig } from './config';

export function transformToJavaScript(
  data: any,
  endpoint: EndpointConfig
): string {
  const timestamp = new Date().toISOString();
  const version = timestamp.split('T')[0].replace(/-/g, '');

  const jsContent = `// Auto-generated on ${timestamp}
// Source: ${endpoint.apiPath}
// Version: ${version}

export const ${toCamelCase(endpoint.name)} = ${JSON.stringify(data, null, 2)};

export const metadata = {
  version: "${version}",
  timestamp: "${timestamp}",
  source: "${endpoint.apiPath}",
  cacheTtl: ${endpoint.cacheTtl || 3600}
};

// For legacy support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ${toCamelCase(endpoint.name)}, metadata };
}
`;

  return jsContent;
}

export function saveToFile(content: string, outputPath: string): void {
  const fullPath = `dist/${outputPath}`;
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Saved to: ${fullPath}`);
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
```

### 4. Cloudflare Publisher (`src/publisher.ts`)
```typescript
import axios from 'axios';
import { readFileSync } from 'fs';
import { config } from './config';

export async function publishToCloudflare(fileName: string): Promise<void> {
  const filePath = `dist/${fileName}`;
  const content = readFileSync(filePath, 'utf8');

  const uploadUrl = `https://api.cloudflare.com/client/v4/zones/${config.cloudflareZoneId}/files/${fileName}`;

  try {
    const response = await axios.put(uploadUrl, content, {
      headers: {
        'Authorization': `Bearer ${config.cloudflareApiToken}`,
        'Content-Type': 'application/javascript'
      }
    });

    console.log(`✅ Published ${fileName} to Cloudflare`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to publish ${fileName}:`, error);
    throw error;
  }
}

export async function invalidateCache(fileName: string): Promise<void> {
  const purgeUrl = `https://api.cloudflare.com/client/v4/zones/${config.cloudflareZoneId}/purge_cache`;

  try {
    await axios.post(purgeUrl, {
      files: [`https://your-domain.com/${fileName}`]
    }, {
      headers: {
        'Authorization': `Bearer ${config.cloudflareApiToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Cache invalidated for ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to invalidate cache for ${fileName}:`, error);
    throw error;
  }
}
```

### 5. Main Script (`src/index.ts`)
```typescript
import { config } from './config';
import { fetchApiData } from './fetcher';
import { transformToJavaScript, saveToFile } from './transformer';
import { publishToCloudflare, invalidateCache } from './publisher';

async function syncEndpoint(endpointName?: string) {
  const endpointsToSync = endpointName
    ? config.endpoints.filter(e => e.name === endpointName)
    : config.endpoints;

  if (endpointsToSync.length === 0) {
    throw new Error(`Endpoint '${endpointName}' not found`);
  }

  for (const endpoint of endpointsToSync) {
    try {
      console.log(`\n🔄 Processing ${endpoint.name}...`);

      // 1. Fetch data from API
      const data = await fetchApiData(endpoint);

      // 2. Transform to JavaScript
      const jsContent = transformToJavaScript(data, endpoint);

      // 3. Save locally
      saveToFile(jsContent, endpoint.outputFile);

      // 4. Publish to Cloudflare
      await publishToCloudflare(endpoint.outputFile);

      // 5. Invalidate cache
      await invalidateCache(endpoint.outputFile);

      console.log(`✅ ${endpoint.name} sync completed successfully`);
    } catch (error) {
      console.error(`❌ Failed to sync ${endpoint.name}:`, error);
      process.exit(1);
    }
  }
}

// CLI interface
const endpointName = process.argv[2];
syncEndpoint(endpointName)
  .then(() => {
    console.log('\n🎉 All endpoints synced successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Sync failed:', error);
    process.exit(1);
  });
```

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
