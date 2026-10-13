# Sherin Nishara — Portfolio

Live: **https://sherin-nishara.github.io/Portfolio/**

Personal portfolio built with SvelteKit. Single-page site with a dino-game loading screen, live coding-stats scoreboard, resume terminal, projects carousel, and contact links.

## Features

- Loading screen with score board (`LC / CF / CC / GH`) + animated dino scene
- Live stats via SvelteKit API routes (gracefully fall back to `.....` on static hosts):
  - `GET /api/leetcode` — ranking, solved, contest (GraphQL)
  - `GET /api/codeforces` — rating, rank, contests
  - `GET /api/codechef` — rating, solved (scrape, 6h cache)
  - `GET /api/github` — repos, stars, searchable commits
- Resume terminal (`cat resume.pdf`, `whoami`, `help`, `clear`)
- Projects carousel driven by `src/lib/projects.json` — add projects there, no page code to touch
- Tailwind CSS v4 + shadcn-svelte + Phosphor icons + JetBrains Mono

## Tech

Svelte 5 (runes), SvelteKit 3, Vite 8, TypeScript, Tailwind CSS, `adapter-static` for GitHub Pages.

## Getting started

```sh
npm install
npm run dev -- --open
```

## Build

```sh
# local (no base path)
npm run build
npm run preview

# GitHub Pages (repo name as base path)
BASE_PATH='/Portfolio' npm run build
```

## Project structure

```
src/
  routes/
    +page.svelte        # portfolio UI (loading + main)
    +layout.svelte/ts   # layout + prerender = true
    api/
      leetcode/+server.ts
      codeforces/+server.ts
      codechef/+server.ts
      github/+server.ts
  lib/
    projects.json       # edit your projects here
    components/
static/
  demo.gif              # project demo preview
  dino/                 # loading-game sprite
  resume.pdf            # add yours here (linked by terminal)
  robots.txt
  .nojekyll
.github/workflows/
  deploy.yml            # build + deploy to Pages on push to main
```

## Customize

- Projects: edit `src/lib/projects.json` (`name, desc, href, cta, live?, demo?`). `demo: "/demo.gif"` resolves with base path automatically.
- Resume: drop your file at `static/resume.pdf`.
- Links: edit `links` in `src/routes/+page.svelte`.
- Handles/usernames: see `USER`/`HANDLE`/`USERNAME` consts in `src/routes/api/*/+server.ts`.

## Deploy (GitHub Pages)

Repo is configured for Pages with `adapter-static`:

- `vite.config.ts` — `adapter-static` with `fallback: 404.html`, `paths.base = BASE_PATH`
- `.github/workflows/deploy.yml` — Node 24, `npm install`, `BASE_PATH='/Portfolio' npm run build`, upload `build/`, `deploy-pages`
- `Settings > Pages > Source: GitHub Actions`

URL: `https://<user>.github.io/<repo>/`

> Note: Pages is static-only, so `/api/*` returns 404 there and stats stay `.....`. For live stats, deploy the same code to Vercel/Netlify (server adapter) instead.

## API response shapes

- `/api/leetcode` → `{ username, ranking, solved: { total, easy, medium, hard }, contest, updatedAt }`
- `/api/codeforces` → `{ handle, rating, maxRating, rank, contests, updatedAt }`
- `/api/codechef` → `{ username, rating, solved, provisional, updatedAt }`
- `/api/github` → `{ username, publicRepos, followers, totalStars, commits, updatedAt }`

All cache 1h (CodeChef 6h) and serve stale cache on upstream failure.
