# GitHub Pages Deployment Fix

## Problem
Multiple workflows were deploying simultaneously and overwriting each other:
- `deploy-main.yml` and `deploy-dev.yml` both used peaceiris action
- `deploy-unified.yml` had a bug where the second checkout overwrote the first build
- Result: neither main nor dev URLs worked

## Solution
1. **Disabled old workflows** - renamed to `.disabled`
2. **Fixed unified workflow** - use isolated checkout paths:
   - Checkout main to `temp/main/`
   - Checkout dev to `temp/dev/`
   - Build both to `deploy/` and `deploy/dev/` without conflicts

## Expected Result
- Main: https://kvnloo.github.io/portfolio/
- Dev: https://kvnloo.github.io/portfolio/dev/

## Key Change
```yaml
# Before (WRONG):
- Checkout main (overwrites workspace)
- Build to deploy/
- Checkout dev (destroys deploy/)
- Build to deploy/dev/ (too late)

# After (CORRECT):
- Checkout main to temp/main/
- Checkout dev to temp/dev/
- Build both from isolated directories
```

That's it. One workflow, isolated checkouts, no conflicts.
