# GitHub Actions Workflows

This directory contains automated workflows for deploying the portfolio website.

## Workflows

### 1. `deploy-main.yml` - Production Deployment
- **Triggers:** Pushes to `main` branch
- **Purpose:** Deploys the production site to `https://kvnloo.github.io/portfolio/`
- **Behavior:** Overwrites the root directory of the gh-pages branch

### 2. `preview-deploy.yml` - Branch Preview Deployment
- **Triggers:** Pushes to `claude/**` branches
- **Purpose:** Creates preview deployments for feature branches
- **Behavior:** Deploys to `https://kvnloo.github.io/portfolio/preview/{branch-name}/`
- **Features:**
  - Each branch gets its own preview URL
  - Previews don't affect production site
  - Multiple previews can coexist
  - Preview index page at `https://kvnloo.github.io/portfolio/preview/`

## How It Works

### Production Deployment
1. Push to `main` branch
2. Workflow copies site files to build directory
3. Deploys to root of gh-pages branch
4. Site is live at `https://kvnloo.github.io/portfolio/`

### Preview Deployment
1. Push to any `claude/*` branch (e.g., `claude/update-portfolio-links-011CV2Fdk98m2YtGjKrcberF`)
2. Workflow extracts and sanitizes branch name
3. Copies site files to `preview/{branch-name}/` directory
4. Deploys to gh-pages branch (keeping other files)
5. Preview is live at `https://kvnloo.github.io/portfolio/preview/{branch-name}/`

## Usage

### Testing Changes Before Production
1. Create/push to a `claude/*` branch
2. Wait for preview workflow to complete (~1-2 minutes)
3. Visit the preview URL in the workflow output
4. Review changes
5. Merge to `main` when satisfied

### Viewing All Previews
Visit `https://kvnloo.github.io/portfolio/preview/` to see a list of all available previews.

## Setup Requirements

### GitHub Pages Configuration
1. Go to repository Settings → Pages
2. Set Source to "Deploy from a branch"
3. Select branch: `gh-pages`
4. Select folder: `/ (root)`
5. Save

### Permissions
The workflows require these permissions (already configured in workflow files):
- `contents: write` - To push to gh-pages branch
- `pages: write` - To deploy to GitHub Pages
- `id-token: write` - For GitHub Pages deployment

## Troubleshooting

### Preview not deploying?
- Check that branch name starts with `claude/`
- Verify workflow ran successfully in Actions tab
- Wait 1-2 minutes after workflow completes for GitHub Pages to update

### Production site not updating?
- Ensure you pushed to `main` branch
- Check deploy-main.yml workflow status
- Verify gh-pages branch was updated

### 404 errors on preview?
- Ensure .nojekyll file exists in repository root
- Check that all necessary files were copied in workflow
- Verify relative paths in HTML are correct

## Maintenance

### Cleaning Up Old Previews
Previews accumulate in the gh-pages branch. To remove old ones:

```bash
# Clone the gh-pages branch
git clone -b gh-pages https://github.com/kvnloo/portfolio.git portfolio-gh-pages
cd portfolio-gh-pages

# Remove specific preview
rm -rf preview/old-branch-name

# Commit and push
git add -A
git commit -m "Clean up old preview"
git push
```

Or do it via GitHub web interface by browsing the gh-pages branch.
