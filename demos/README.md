# Kevin's Ramen & Boba — Portfolio Demos

Interactive shop-themed portfolio experiences.

| Demo | Stack | Local | Pages (prod) |
|------|--------|-------|----------------|
| [room](./room/) | Vite · React · R3F | `cd room && npm i && npm run dev` | `/portfolio/demos/room/` |
| [spline](./spline/) | Vite · React · Spline | `cd spline && npm i && npm run dev` | `/portfolio/demos/spline/` |

Shared menu data: [`shared/projects.json`](./shared/projects.json).

**Brand:** Kevin's Ramen & Boba  
**Format inspired by** interactive shop portfolios such as [jesse-zhou.com](https://jesse-zhou.com).

## Production build

```bash
cd demos/room && npm ci && npm run build
cd ../spline && npm ci && npm run build
```

Vite `base` is set for GitHub Pages under `/portfolio/demos/<name>/`.
