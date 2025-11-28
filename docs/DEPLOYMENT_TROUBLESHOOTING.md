# Deployment Troubleshooting Report

**Date:** 2025-11-27
**Issue:** Multi-branch GitHub Pages deployment not working
**Affected URLs:**
- Main: https://kvnloo.github.io/portfolio/ ❌ (broken)
- Dev: https://kvnloo.github.io/portfolio/dev/ ❌ (broken)

## Root Cause Analysis

### Problem 1: Multiple Conflicting Workflows

Four deployment workflows exist and compete:
1. `deploy-unified.yml` - New unified approach (GitHub Actions native)
2. `deploy-main.yml` - Old main deployment (peaceiris action)
3. `deploy-dev.yml` - Old dev deployment (peaceiris action)
4. `preview-deploy.yml` - Preview deployments

**Conflict:** Mixed deployment methods:
- Unified workflow uses `actions/deploy-pages@v4` (GitHub Pages native)
- Old workflows use `peaceiris/actions-gh-pages@v3` (third-party action)

These are **incompatible** - they write to gh-pages branch differently.

### Problem 2: Race Condition

When merging dev → main:
1. `deploy-unified.yml` triggers on main push
2. `deploy-main.yml` triggers on main push
3. `deploy-dev.yml` triggered earlier on dev push
4. All three compete to write to gh-pages
5. Last one to finish overwrites others' changes

### Problem 3: Missing Dev Directory

Inspection of gh-pages branch shows:
```bash
$ ls -la
# dev/ directory MISSING ❌
```

The unified workflow builds dev content to `deploy/dev/` locally but:
- Upload happens before dev checkout completes properly
- Directory structure not preserved in artifact

## Research Findings

Based on research of GitHub Pages best practices:

### Key Limitation
**GitHub Pages = ONE publishing source per repository**
- Cannot have main on one URL and dev on another independently
- Must use directory-based approach: `/` for main, `/dev/` for dev

### Recommended Solution
Use **GitHub Actions native deployment** with proper directory structure:

```
gh-pages branch:
├── index.html          # Main branch content (root)
├── assets/
├── ai-engineering/
├── dev/                # Dev branch content (subdirectory)
│   ├── index.html
│   ├── assets/
│   └── ...
└── .nojekyll
```

## Fix Plan

### Step 1: Disable Old Workflows ✅
Remove or disable these workflows:
- `.github/workflows/deploy-main.yml`
- `.github/workflows/deploy-dev.yml`

Keep only:
- `.github/workflows/deploy-unified.yml`
- `.github/workflows/preview-deploy.yml`

### Step 2: Fix Unified Workflow ⏳
Issues in current `deploy-unified.yml`:

**Problem A: Checkout Order**
```yaml
# Current (WRONG):
- Checkout main
- Build main to deploy/
- Checkout dev (overwrites workspace!)
- Build dev to deploy/dev/
```

**Fix:**
```yaml
# Correct approach:
- Checkout main to temp/main/
- Checkout dev to temp/dev/
- Build main content to deploy/
- Build dev content to deploy/dev/
```

**Problem B: Single Upload**
Currently uploads before dev build completes.

**Fix:** Upload artifact AFTER both builds complete.

### Step 3: Verify Structure
After deployment, verify gh-pages has:
```
/              → Main content
/dev/          → Dev content
/.nojekyll     → Prevents Jekyll processing
```

### Step 4: Test URLs
Verify both URLs work:
- https://kvnloo.github.io/portfolio/ (main)
- https://kvnloo.github.io/portfolio/dev/ (dev)

## Technical Details

### GitHub Pages Publishing Source
Current setting: **GitHub Actions** (correct)
- Location: Settings → Pages → Source: "GitHub Actions"

### Artifact Structure
The `actions/upload-pages-artifact@v3` action expects:
```
artifact/
├── index.html          # Must exist at root
├── dev/
│   └── index.html      # Must exist in dev/
└── .nojekyll
```

### Concurrency Control
Current setting in unified workflow:
```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

This is correct - prevents parallel deployments from conflicting.

## References

- [GitHub Pages Multi-Branch Research](../research/github-pages-multibranch.md)
- [Deploy Unified Workflow](.github/workflows/deploy-unified.yml)
- [GitHub Pages Best Practices](https://docs.github.com/en/pages)

## Next Steps

1. ✅ Disable old workflows
2. ⏳ Fix unified workflow checkout logic
3. ⏳ Test deployment
4. ⏳ Verify both URLs accessible
5. ⏳ Document final architecture
