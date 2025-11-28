# Deployment Fix Plan

## Executive Summary

**Problem:** Multiple conflicting workflows causing deployment failures.
**Solution:** Use single unified workflow with proper directory-based multi-branch deployment.
**Expected Result:**
- Main: https://kvnloo.github.io/portfolio/ ✅
- Dev: https://kvnloo.github.io/portfolio/dev/ ✅

---

## Implementation Steps

### Phase 1: Clean Up Conflicting Workflows ✅

**Completed:**
- ✅ Disabled `deploy-main.yml` (renamed to `.disabled`)
- ✅ Disabled `deploy-dev.yml` (renamed to `.disabled`)

**Why:** These workflows use incompatible deployment method (peaceiris action vs GitHub native).

### Phase 2: Fix Unified Workflow

**Current Issue in `deploy-unified.yml`:**

```yaml
# PROBLEM: Second checkout overwrites first build
- Checkout main (to workspace root)
- Build main → deploy/
- Checkout dev (OVERWRITES workspace!)  # ❌ This destroys deploy/
- Build dev → deploy/dev/
```

**Solution: Use Separate Paths**

```yaml
# CORRECT: Isolate checkouts
- name: Checkout main
  uses: actions/checkout@v4
  with:
    ref: main
    path: temp/main

- name: Build main
  run: |
    mkdir -p deploy
    # Copy from temp/main to deploy/
    cp temp/main/index.html deploy/
    for dir in ai-engineering mobile-development frontend-development devops-systems assets; do
      [ -d "temp/main/$dir" ] && cp -r "temp/main/$dir" deploy/
    done
    touch deploy/.nojekyll

- name: Checkout dev
  uses: actions/checkout@v4
  with:
    ref: dev
    path: temp/dev

- name: Build dev
  run: |
    mkdir -p deploy/dev
    # Copy from temp/dev to deploy/dev/
    cp temp/dev/index.html deploy/dev/
    for dir in ai-engineering mobile-development frontend-development devops-systems assets; do
      [ -d "temp/dev/$dir" ] && cp -r "temp/dev/$dir" deploy/dev/
    done

- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: 'deploy'

- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4
```

### Phase 3: Expected Directory Structure

After successful deployment, `gh-pages` branch should contain:

```
gh-pages/
├── index.html                           # Main branch root
├── assets/                              # Main assets
│   └── profile-pic.jpg
├── ai-engineering/                      # Main content
│   ├── flowstate-bci.md
│   ├── monument.md
│   └── ...
├── mobile-development/                  # Main content
├── frontend-development/                # Main content
├── devops-systems/                      # Main content
├── dev/                                 # Dev branch subdirectory ⭐
│   ├── index.html                       # Dev root
│   ├── assets/                          # Dev assets
│   ├── ai-engineering/                  # Dev content
│   ├── mobile-development/              # Dev content
│   ├── frontend-development/            # Dev content
│   └── devops-systems/                  # Dev content
├── .nojekyll                            # Prevent Jekyll processing
└── README.md
```

### Phase 4: Verification Steps

**After deployment:**

1. **Check gh-pages branch structure:**
   ```bash
   git checkout gh-pages
   ls -la
   ls -la dev/
   ```

2. **Test URLs:**
   - Open https://kvnloo.github.io/portfolio/
   - Open https://kvnloo.github.io/portfolio/dev/
   - Verify all links work
   - Check asset loading (images, CSS)

3. **Verify workflow logs:**
   ```bash
   gh run list --workflow="Deploy Portfolio (Unified)"
   gh run view <run-id> --log
   ```

4. **Check for errors:**
   - No 404 errors
   - No broken asset links
   - Dev directory exists and is accessible

---

## Deployment Architecture

### Single Workflow Strategy

**`deploy-unified.yml` handles BOTH branches:**

```yaml
on:
  push:
    branches: [main, dev]  # Triggers on either branch

jobs:
  build-and-deploy:
    steps:
      1. Checkout main (to isolated path)
      2. Build main content → deploy/
      3. Checkout dev (to different isolated path)
      4. Build dev content → deploy/dev/
      5. Upload complete deploy/ directory as artifact
      6. Deploy entire artifact to gh-pages
```

**Key Benefits:**
- ✅ Single source of truth
- ✅ No race conditions
- ✅ Atomic deployments (both branches together)
- ✅ Consistent deployment method

### URL Mapping

```
Repository: kvnloo/portfolio
GitHub Pages: https://kvnloo.github.io/portfolio/

URL Structure:
├── /                    → main branch (deploy/)
│   ├── index.html
│   ├── assets/
│   └── ...
└── /dev/                → dev branch (deploy/dev/)
    ├── index.html
    ├── assets/
    └── ...
```

### Branch-to-URL Mapping

| Branch | Build Output | URL |
|--------|-------------|-----|
| `main` | `deploy/` | https://kvnloo.github.io/portfolio/ |
| `dev` | `deploy/dev/` | https://kvnloo.github.io/portfolio/dev/ |

---

## Rollback Plan

If new unified workflow fails:

1. **Re-enable old workflows:**
   ```bash
   mv .github/workflows/deploy-main.yml.disabled .github/workflows/deploy-main.yml
   mv .github/workflows/deploy-dev.yml.disabled .github/workflows/deploy-dev.yml
   ```

2. **Disable unified workflow:**
   ```bash
   mv .github/workflows/deploy-unified.yml .github/workflows/deploy-unified.yml.disabled
   ```

3. **Manual trigger old workflow:**
   ```bash
   gh workflow run "Deploy Production Site"
   ```

---

## Testing Checklist

Before declaring success:

- [ ] Unified workflow runs without errors
- [ ] gh-pages branch has `dev/` directory
- [ ] Main URL loads: https://kvnloo.github.io/portfolio/
- [ ] Dev URL loads: https://kvnloo.github.io/portfolio/dev/
- [ ] All assets load on both URLs
- [ ] Navigation works on both sites
- [ ] No console errors in browser
- [ ] Links between projects work
- [ ] Mobile responsive on both
- [ ] SEO metadata correct on both

---

## Success Criteria

**Deployment is considered successful when:**

1. ✅ Single workflow (`deploy-unified.yml`) handles both branches
2. ✅ No conflicting workflows enabled
3. ✅ gh-pages branch has proper directory structure
4. ✅ Main URL accessible and functional
5. ✅ Dev URL accessible and functional
6. ✅ Both sites load all assets correctly
7. ✅ No 404 errors or broken links
8. ✅ Workflow logs show successful deployment

---

## Next Actions

1. **Implement workflow fix** (create corrected deploy-unified.yml)
2. **Commit changes** to fix/unified-deployment-workflow branch
3. **Test deployment** by triggering workflow
4. **Verify URLs** after deployment completes
5. **Merge to main** after verification
6. **Document architecture** for future reference

---

## References

- [Troubleshooting Report](DEPLOYMENT_TROUBLESHOOTING.md)
- [GitHub Pages Multi-Branch Research](../research/github-pages-multibranch.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
