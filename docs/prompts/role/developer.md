# Developer Prompt: API-to-CDN Sync Implementation

**Document Version:** 1.0
**Current Phase:** MVP
**Last Updated:** 2025-01-09

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
- **MVP (2-3 days)** - Prove concept locally ← **YOU ARE HERE**
- **Phase 1 (1 week)** - Add GitHub Actions + CDN deployment
- **Phase 2 (1 week)** - Add scheduling and reliability
- **Phase 3+ (As needed)** - Advanced features based on real usage

## Current Phase: MVP Implementation

### Goal
Prove the core concept works locally: **Fetch → Transform → Save locally**

### Project Structure Required
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

### MVP Constraints
- **No TypeScript** - Use plain JavaScript
- **Single endpoint only** - account specifications
- **Manual execution** - no automation yet
- **Local file generation** - no CDN deployment
- **Simple error handling** - basic try/catch
- **No performance optimizations** - focus on correctness

### TDD Implementation Order (MANDATORY)
Follow this exact sequence:

1. **Setup project structure** and package.json
2. **Write tests first** for fetcher module
3. **Implement fetcher** to pass tests
4. **Write tests** for transformer module
5. **Implement transformer** to pass tests
6. **Write integration test** for end-to-end workflow
7. **Implement main script** to pass integration test

### Sample API Data for Testing
Use this sample data structure for your tests:
```json
{
  "data": [
    {
      "account": {
        "specification": {
          "display_name": "Standard",
          "information": "Trade CFDs with competitive spreads and swap fees.",
          "markets_offered": ["Forex", "Stock Indices", "Commodities", "Energies", "Cryptocurrencies", "ETFs"],
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
          "markets_offered": ["Forex", "Stock Indices", "Commodities", "Energies", "Cryptocurrencies", "ETFs"],
          "max_leverage": 500,
          "pips": 2.2
        }
      }
    }
  ]
}
```

### Success Criteria for MVP Completion
All of these must be achieved before proceeding to Phase 1:

- ✅ **All unit tests pass** - fetcher and transformer work independently
- ✅ **Integration test passes** - end-to-end workflow completes successfully
- ✅ **Manual testing works** - can run `node src/main.js` and generate output
- ✅ **Generated JS modules are valid** - proper ES6 export format with metadata
- ✅ **Code follows best practices** - pure functions, modularity, KISS principle
- ✅ **No premature optimizations** - simple, readable implementation

### Validation Commands
Run these to validate MVP completion:
```bash
# All tests must pass
npm test

# Manual execution must work
node src/main.js

# Output file must exist and be valid
ls output/
cat output/account-specifications.js

# Generated module must be importable
node -e "const mod = require('./output/account-specifications.js'); console.log(mod.metadata);"
```

## Development Guidelines

### Core Principles (Reference: best-practices.md)
1. **Keep It Simple (KISS)** - Start with simplest solution that works
2. **Modular Design** - Pure functions, single responsibility
3. **Don't Pre-optimize** - Prove concept first, optimize later
4. **Test-Driven Development** - Red-Green-Refactor cycle

### What NOT to Build (MVP Phase)
- ❌ GitHub Actions workflows
- ❌ Cloudflare CDN integration
- ❌ Multiple endpoint support
- ❌ Complex error handling/retry logic
- ❌ Performance optimizations
- ❌ Monitoring or logging beyond console output
- ❌ Configuration validation
- ❌ TypeScript or build processes

### When You're Done with MVP
1. **Validate all success criteria** are met
2. **Request approval** to proceed to Phase 1
3. **Do not start Phase 1** without explicit confirmation

## Complete Implementation Reference

For detailed code examples and step-by-step TDD implementation, see:
- `docs/implementation-guide.md` - Complete MVP implementation with test examples
- All function signatures, test structures, and file contents are provided

## Version History

### Version 1.0 (2025-01-09)
- **Phase**: MVP
- **Focus**: Local proof of concept with TDD approach
- **Constraints**: Single endpoint, no automation, JavaScript only
- **Success Criteria**: Unit tests pass, integration test passes, manual execution works

---

**Remember: The goal is to deliver working software quickly and iterate based on real feedback. Start simple, prove it works, then evolve based on actual needs.**
