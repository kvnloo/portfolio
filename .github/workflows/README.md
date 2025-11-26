# Deployment Workflows

## Current Setup

### deploy-unified.yml (NEW - Recommended)
- Builds both main and dev branches in a single job
- Main branch → root of gh-pages
- Dev branch → dev/ subdirectory
- Prevents overwriting between deployments
- Matches the working pattern from the ACE repository

### Legacy Workflows (Can be removed after unified workflow is verified)
- deploy-main.yml - Old production deployment
- deploy-dev.yml - Old dev deployment

## Migration Plan

1. Test deploy-unified.yml by pushing to main or dev
2. Verify both https://kvnloo.github.io/portfolio/ and https://kvnloo.github.io/portfolio/dev/ work
3. Remove deploy-main.yml and deploy-dev.yml after verification
