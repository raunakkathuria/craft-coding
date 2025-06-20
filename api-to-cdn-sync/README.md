# API-to-CDN Sync - Phase 1

🚀 **Automated API-to-CDN synchronization system** that transforms rarely-changing API data into static JavaScript files served via CDN for improved performance and cost reduction.

## 📊 Phase 1 Status

**Current Implementation:** Phase 1 - GitHub Actions + CDN Deployment
**Building On:** ✅ MVP (Proven local sync concept)
**Next Phase:** Phase 2 - Scheduling & Reliability

### ✅ Completed Features
- **CDN Deployment Foundation** - Cloudflare KV integration with validation
- **GitHub Actions Workflows** - Daily and manual automation
- **Environment Configuration** - Development/production setup with secrets management
- **Mock API Integration** - Phase 1a safe testing approach

## 🏗️ Architecture

```
GitHub Actions → Mock/Real API → Transform → Cloudflare CDN
     ↓              ↓              ↓           ↓
  Automation    Fetch Data    Generate JS   Global CDN
```

### Key Components

- **`src/`** - Core application (MVP foundation)
  - `fetcher.js` - API data fetching with authentication
  - `transformer.js` - Data to ES6 module transformation
  - `deployer.js` - Cloudflare CDN deployment
  - `main.js` - Orchestration workflow

- **`.github/workflows/`** - Automation (Phase 1)
  - `sync-daily.yml` - Scheduled daily sync (6 AM UTC)
  - `sync-manual.yml` - Manual trigger with options

- **`cloudflare/`** - CDN Configuration
  - `config.json` - Environment-specific settings
  - `deploy.js` - CLI deployment tool

- **`scripts/`** - Setup & Utilities
  - `setup.sh` - Interactive environment configuration

## 🚀 Quick Start

### 1. Interactive Setup (Recommended)
```bash
./scripts/setup.sh
```
This guided setup will:
- Create `.env` file with your credentials
- Install dependencies
- Validate configuration
- Provide next steps

### 2. Manual Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
vim .env

# Install dependencies
cd src && npm install

# Validate setup
npm run validate:config
```

### 3. Test Phase 1a (Mock API)
```bash
# Start mock API server
node mock-server.js &

# Run sync process
cd src && npm run sync

# Test deployment (requires Cloudflare setup)
npm run deploy
```

## 🔧 Configuration

### Required Environment Variables
```bash
# API Authentication
API_AUTH_TOKEN=test-token-123  # For mock API

# Cloudflare CDN (Phase 1b - Real deployment)
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Environment
NODE_ENV=development  # or production
```

### Cloudflare Setup
1. **Get API Token**: https://dash.cloudflare.com/profile/api-tokens
2. **Find Zone ID**: Domain overview page
3. **Find Account ID**: Dashboard right sidebar
4. **Update config**: Edit `cloudflare/config.json` with real namespace IDs

## 📋 Usage

### Local Development
```bash
# Sync API data locally
cd src && npm run sync

# Deploy to development CDN
npm run deploy

# Deploy to production CDN
npm run deploy:prod

# Validate configuration
npm run validate:config
```

### GitHub Actions

#### Daily Automation
- **Automatic**: Runs daily at 6 AM UTC
- **Manual Override**: GitHub Actions tab → "Daily API-to-CDN Sync" → Run workflow

#### Manual Execution
GitHub Actions tab → "Manual API-to-CDN Sync" → Run workflow with options:
- **Environment**: development/production
- **Debug Mode**: Enable verbose logging
- **Force Deploy**: Skip validation failures
- **API Endpoint**: Override default endpoint

### Testing Commands
```bash
# Run all tests
npm test

# Start mock API server
node mock-server.js

# Health check mock server
curl http://localhost:3001/health

# Test API endpoint
curl -H "Authorization: Bearer test-token-123" \
     http://localhost:3001/api/account-specs
```

## 🎯 Phase 1 Implementation Strategy

### Phase 1a: Mock API (Current) ✅
- ✅ GitHub Actions with mock API server
- ✅ Complete automation pipeline testing
- ✅ CDN deployment infrastructure
- ✅ Safe testing without external dependencies

### Phase 1b: Real API (Next)
- 🔄 Switch configuration to real API endpoints
- 🔄 Add real authentication tokens to GitHub secrets
- 🔄 Test with live data
- 🔄 Handle production edge cases

## 📁 Generated Output

### File Structure
```
src/output/
└── account-specifications.js  # Generated ES6 module
```

### Generated Content Example
```javascript
// Generated on 2025-06-17T15:30:50.621Z
// Source: account-specs

export const accountSpecs = [
  {
    "account": {
      "specification": {
        "display_name": "Standard",
        "information": "Trade CFDs with competitive spreads...",
        // ... full data
      }
    }
  }
];

export const metadata = {
  timestamp: "2025-06-17T15:30:50.621Z",
  source: "account-specs",
  generator: "api-to-cdn-sync",
  version: "1.0.0"
};
```

## 🔍 Monitoring & Debugging

### GitHub Actions Logs
- **Daily Workflow**: Actions tab → Recent runs
- **Manual Workflow**: Enhanced logging with debug mode
- **Artifacts**: Download generated files (30-day retention)

### Local Debugging
```bash
# Debug mode
DEBUG=* npm run sync

# Validate specific environment
npm run validate:config -- production

# Test CDN accessibility (after deployment)
curl https://your-cdn-domain.com/account-specifications.js
```

### Common Issues
1. **Configuration Validation Fails**
   - Check all required environment variables are set
   - Verify Cloudflare credentials are correct
   - Use force deploy option in manual workflow

2. **CDN Deployment Fails**
   - Verify Cloudflare API permissions
   - Check namespace ID in config.json
   - Review CDN domain configuration

3. **API Authentication Fails**
   - Verify API_AUTH_TOKEN matches expected value
   - For real API: check token is valid and has permissions

## 🚦 Success Criteria (Phase 1)

- ✅ **GitHub Actions workflow executes** - Daily and manual triggers work
- ✅ **CDN deployment succeeds** - Files uploaded to Cloudflare successfully
- 🔄 **Generated files accessible via CDN** - Public URLs serve JS modules correctly
- ✅ **End-to-end automation works** - Complete pipeline from trigger to CDN
- ✅ **Manual triggers functional** - Can manually execute sync via GitHub UI
- ✅ **Error handling works** - Failed deployments are handled gracefully
- ✅ **Documentation updated** - Setup instructions for CDN and secrets

## 🔮 What's Next - Phase 2

Planned features for Phase 2:
- **Advanced Scheduling** - Multiple sync frequencies, timezone support
- **Retry Mechanisms** - Exponential backoff, dead letter queues
- **Cache Invalidation** - Automatic CDN cache clearing
- **Enhanced Monitoring** - Slack/email notifications, metrics dashboard
- **Multi-endpoint Support** - Process multiple API endpoints simultaneously

## 📚 Documentation

- **MVP Documentation**: `docs/` - Complete implementation guide and architecture
- **Best Practices**: `docs/best-practices.md` - Core development principles
- **Requirements**: `docs/requirements.md` - Business requirements and phases

## 🤝 Contributing

This project follows **feature-based commits** with comprehensive documentation:

```bash
git commit -m "feat: feature description

## Feature Description
[Detailed explanation]

## Prompt History
[Implementation context]"
```

## 📄 License & Support

Built for **Phase 1** requirements with focus on automation and CDN deployment.
For issues or questions, check the GitHub Actions logs and validation output.

---

**Phase 1 Complete**: GitHub Actions automation + Cloudflare CDN deployment ✅
**Ready for**: Phase 1b (real API integration) and Phase 2 (advanced features)
