# Developer Prompt: API-to-CDN Sync Implementation

**Document Version:** 2.0
**Current Phase:** Phase 1
**Last Updated:** 2025-06-17

## Project Overview

You are implementing an **API-to-CDN sync system** that transforms rarely-changing API data into static JavaScript files served via CDN for improved performance and cost reduction.

### Business Context
- **Problem**: API endpoints serve business rules/config data that changes infrequently (daily or less), causing unnecessary latency and server load
- **Solution**: Fetch API data → Transform to JS modules → Deploy to Cloudflare CDN for global <100ms response times
- **Expected Impact**: 60%+ cost reduction, 80%+ server load reduction, sub-100ms global response times

### Documentation Structure
All detailed requirements and implementation guidance are in the `docs/` folder:

- **`docs/requirements.md`** - Business requirements, architecture decisions, development phases
- **`docs/implementation-guide.md`** - Complete TDD implementation with code examples
- **`docs/best-practices.md`** - Core development principles (KISS, modularity, TDD, no pre-optimization)

## ⚠️ CRITICAL: Phase-by-Phase Development ONLY

**DO NOT jump ahead to later phases.** Each phase must be completed and validated before proceeding.

### Development Phases Overview
- **MVP (2-3 days)** - Prove concept locally ✅ **COMPLETED**
- **Phase 1 (1 week)** - Add GitHub Actions + CDN deployment ← **YOU ARE HERE**
- **Phase 2 (1 week)** - Add scheduling and reliability
- **Phase 3+ (As needed)** - Advanced features based on real usage

## Current Phase: Phase 1 Implementation

### Goal
Build automated CI/CD pipeline: **GitHub Actions → Fetch → Transform → Deploy to CDN**

### MVP Foundation ✅ COMPLETED
The local proof-of-concept has been successfully implemented:
- ✅ Working fetcher, transformer, and main orchestration modules
- ✅ Complete test suite with unit and integration tests
- ✅ Manual execution generates valid ES6 modules (1,411 bytes output)
- ✅ Authentication with Bearer tokens and error handling
- ✅ Docker environment for consistent development

### Phase 1 Project Structure
```
api-to-cdn-sync/
├── .github/
│   └── workflows/
│       ├── sync-daily.yml        # NEW: Daily automated sync
│       └── sync-manual.yml       # NEW: Manual trigger workflow
├── src/                          # EXISTING: Core application
│   ├── fetcher.js               # ✅ Working MVP implementation
│   ├── transformer.js           # ✅ Working MVP implementation
│   ├── main.js                  # ✅ Working MVP implementation
│   └── deployer.js              # NEW: Cloudflare CDN deployment
├── test/                         # EXISTING: Test suite
├── cloudflare/                   # NEW: CDN configuration
│   ├── deploy.js                # Cloudflare API integration
│   └── config.json              # CDN settings
├── output/                       # EXISTING: Generated files
└── .env.example                  # NEW: Environment variables template
```

### Phase 1 Implementation Order
Build incrementally on the proven MVP foundation:

1. **Setup Cloudflare CDN integration** - API keys, zone configuration
2. **Create deployer module** - Upload generated files to CDN
3. **Test deployment locally** - Verify CDN upload works
4. **Create GitHub Actions workflows** - Daily and manual triggers
5. **Add environment secrets** - API keys, authentication tokens
6. **Test end-to-end automation** - GitHub → API → CDN workflow
7. **Validate CDN accessibility** - Verify files serve correctly

### Phase 1 Constraints
- **Build on MVP** - Use existing fetcher/transformer without changes
- **Single endpoint only** - Still account specifications only
- **Simple workflows** - Basic GitHub Actions, no complex scheduling
- **Manual CDN setup** - Basic Cloudflare integration
- **Basic error handling** - Simple retry logic, basic notifications
- **No performance optimization** - Focus on getting automation working

### Success Criteria for Phase 1 Completion
All of these must be achieved before proceeding to Phase 2:

- ⬜ **GitHub Actions workflow executes** - Daily and manual triggers work
- ⬜ **CDN deployment succeeds** - Files uploaded to Cloudflare successfully
- ⬜ **Generated files accessible via CDN** - Public URLs serve JS modules correctly
- ⬜ **End-to-end automation works** - Complete pipeline from trigger to CDN
- ⬜ **Manual triggers functional** - Can manually execute sync via GitHub UI
- ⬜ **Error handling works** - Failed deployments are handled gracefully
- ⬜ **Documentation updated** - Setup instructions for CDN and secrets

### Validation Commands
Run these to validate Phase 1 completion:
```bash
# Test CDN deployment locally
npm run deploy

# Verify CDN accessibility
curl https://your-cdn-domain.com/account-specifications.js

# Test GitHub Actions (via GitHub UI)
# - Trigger manual workflow
# - Check workflow logs
# - Verify CDN update

# Validate complete pipeline
# API → Transform → Deploy → CDN serving
```

## Development Guidelines

### Core Principles (Reference: best-practices.md)
1. **Keep It Simple (KISS)** - Start with simplest solution that works
2. **Modular Design** - Pure functions, single responsibility
3. **Don't Pre-optimize** - Prove concept first, optimize later
4. **Test-Driven Development** - Red-Green-Refactor cycle

### What NOT to Build (Phase 1)
- ❌ **Complex scheduling logic** - Use simple daily cron, save advanced scheduling for Phase 2
- ❌ **Multiple endpoint support** - Still single endpoint only
- ❌ **Advanced retry mechanisms** - Basic error handling only
- ❌ **Performance optimizations** - Focus on automation working
- ❌ **Advanced monitoring** - Basic GitHub Actions logs only
- ❌ **Cache invalidation** - Simple file replacement for now
- ❌ **TypeScript migration** - Keep JavaScript for simplicity
- ❌ **Multi-environment support** - Single production deployment

### When You're Done with Phase 1
1. **Validate all success criteria** are met
2. **Test complete automation** end-to-end
3. **Verify CDN accessibility** via public URLs
4. **Request approval** to proceed to Phase 2

## Complete Implementation Reference

For detailed code examples and step-by-step TDD implementation, see:
- `docs/implementation-guide.md` - Complete MVP implementation with test examples
- All function signatures, test structures, and file contents are provided

## Version History

### Version 1.0 (2025-01-09) ✅ COMPLETED
- **Phase**: MVP
- **Focus**: Local proof of concept with TDD approach
- **Constraints**: Single endpoint, no automation, JavaScript only
- **Success Criteria**: Unit tests pass, integration test passes, manual execution works
- **Outcome**: Successfully implemented working sync system with 1,411 byte output

### Version 2.0 (2025-06-17)
- **Phase**: Phase 1
- **Focus**: GitHub Actions automation + Cloudflare CDN deployment
- **Constraints**: Single endpoint, basic workflows, simple error handling
- **Success Criteria**: Automated workflows work, CDN deployment succeeds, public URLs accessible
- **Building On**: Proven MVP foundation with working fetcher/transformer modules

---

**Remember: The MVP proved the concept works. Phase 1 focuses on automation and deployment. Keep it simple, get the pipeline working, then iterate based on real deployment feedback.**
