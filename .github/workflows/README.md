# Deployment Workflows

## Current setup

### `deploy-unified.yml` (active)
- Builds **main** and **dev** in one job with isolated checkouts (`temp/main`, `temp/dev`)
- **main** → site root (`https://kvnloo.github.io/portfolio/`)
- **dev** → `dev/` subdirectory (`https://kvnloo.github.io/portfolio/dev/`)
- Writes `.nojekyll` and publishes via GitHub Pages (`actions/upload-pages-artifact` + `deploy-pages`)

See also: [`docs/DEPLOYMENT_FIX.md`](../../docs/DEPLOYMENT_FIX.md) for the multi-workflow overwrite fix history.

Legacy `deploy-main.yml` / `deploy-dev.yml` were retired in favor of the unified workflow.
