# Git Scope

> A polished, dark-first GitHub profile & repository explorer — search developers, dissect their repositories, visualise language distribution, and compare two accounts head-to-head.

<p>
  <img alt="Angular" src="https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Signals" src="https://img.shields.io/badge/State-Signals-c8ff5b?logoColor=white" />
  <img alt="RxJS" src="https://img.shields.io/badge/RxJS-7-B7178C?logo=reactivex&logoColor=white" />
  <img alt="SCSS" src="https://img.shields.io/badge/SCSS-design%20system-CC6699?logo=sass&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen" />
</p>

Git Scope is a frontend-only single-page application built on the public
[GitHub REST API](https://docs.github.com/en/rest). No backend, no API keys —
it runs entirely in the browser and degrades gracefully when GitHub's
unauthenticated rate limit is reached.

---

## Features

- **User search** — debounced queries against GitHub's `/search/users` endpoint, rendered as you type.
- **Rich profile view** — avatar, bio, followers/following, company, location, website, join date and aggregate stats (repos, stars, forks, gists).
- **Repository explorer** — client-side search/filter, sort by stars / recent push / forks / name, language badges, topics, "hide forks" toggle and progressive pagination.
- **Language distribution chart** — an animated, interactive SVG donut that aggregates every non-forked repository's primary language across a profile, with a hover-linked legend.
- **Head-to-head compare** — put two developers side by side (followers, repo count, total stars, total forks and top-5 languages) with animated bars and an overall verdict.
- **Recent activity feed** — a humanised timeline of a user's public events (pushes, PRs, issues, stars, forks, releases…).
- **Recent searches** — persisted to `localStorage`, one click to revisit.
- **Robust states everywhere** — every async path has loading **skeletons**, **empty** states and **specific error handling**, including friendly HTTP **403 (rate limit)** and **404 (not found)** messages.
- **Light + dark themes** — dark-first developer-tool aesthetic with a terminal-lime accent, persisted theme preference and system-preference detection.
- **Accessible & responsive** — semantic HTML, ARIA, keyboard navigation, visible focus states, reduced-motion support and a fully responsive layout.
- **Installable PWA & mobile-first** — add to your home screen, works offline, with a native-feeling bottom tab bar on phones (see below).

---

## Mobile / PWA

Git Scope is an **installable Progressive Web App** and is optimised to feel like
a first-class mobile app while keeping the full desktop experience.

- **Add to Home Screen** — install it from your browser (Chrome/Edge: _Install app_;
  iOS Safari: _Share → Add to Home Screen_) to launch it full-screen in
  `standalone` display mode with its own icon and splash colours.
- **Offline app-shell** — an [Angular service worker](https://angular.dev/ecosystem/service-workers)
  (`@angular/service-worker`, configured in `ngsw-config.json`) prefetches the
  app shell and caches fonts, so the UI loads instantly on repeat visits and
  survives flaky connections. Recent GitHub API responses are cached with a
  freshness strategy.
- **Mobile navigation** — on small screens the top nav collapses into a
  fixed **bottom tab bar** (Explore · Compare · theme toggle) with large touch
  targets; the desktop top nav is untouched at wider breakpoints.
- **Touch-friendly** — interactive controls are held to a **44×44px** minimum on
  small screens (the `--tap-target` token), taps get instant active-state
  feedback (`touch-action: manipulation`, no grey flash), momentum scrolling is
  enabled, and inputs are forced to ≥16px so iOS never zooms on focus.
- **Safe-area aware** — layout honours `env(safe-area-inset-*)` so content clears
  notches and the home indicator (`viewport-fit=cover`).
- **Reflows on small screens** — the language donut, comparison bars/tables and
  repository/user grids all collapse to single-column layouts from **320px** up,
  with **no horizontal overflow**.
- **Theme-aware chrome** — the browser `theme-color` tracks the active light/dark
  theme in real time.
- **Pull-to-refresh** — on the profile view, pull down at the top (touch devices)
  to re-fetch the developer's repositories and activity.

---

## Getting Started

### Prerequisites

- **Node.js** `^20.19` / `^22.12` / `>=24`
- **npm** `>=8`

### Install

```bash
npm install
```

### Develop

```bash
npm start
# → http://localhost:4200
```

### Test

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Unit tests cover the GitHub error interceptor (rate limit, 404, 422, offline),
the username route guard (GitHub's naming rules) and the paginated repository
fetch. The same command runs in CI (`.github/workflows/ci.yml`).

### Production build

```bash
npm run build
# output → dist/git-scope
```

---

## Project Structure

```
src/
├─ app/
│  ├─ core/                     # app-wide singletons — no UI
│  │  ├─ guards/                # functional route guards (valid-username)
│  │  ├─ interceptors/          # HTTP → friendly ApiError translation
│  │  ├─ models/                # typed GitHub API models + ApiError
│  │  └─ services/              # GithubApi, Theme, RecentSearches, colours
│  ├─ shared/                   # reusable, presentational building blocks
│  │  ├─ pipes/                 # relativeTime, compactNumber
│  │  └─ ui/                    # icon, spinner, skeleton, states, cards, donut
│  ├─ features/                 # lazy-loaded feature routes
│  │  ├─ search/                # landing + user search
│  │  ├─ profile/               # profile, repos, languages, activity
│  │  └─ compare/               # two-developer comparison
│  ├─ app.ts / app.html         # shell: nav, theme toggle, footer
│  ├─ app.config.ts             # providers: router, http, interceptors
│  └─ app.routes.ts             # lazy routes + guard
├─ styles/
│  └─ _tokens.scss              # design tokens (colour / space / type / motion)
└─ styles.scss                  # reset, base, backdrop, a11y utilities
```

---

## What This Demonstrates

A focused showcase of modern Angular and frontend craft:

- **Latest Angular (v20)** — 100% **standalone** components (no NgModules), **lazy-loaded** feature routes and `loadComponent`.
- **Signals-first state** — `signal`, `computed` and `effect` drive all view state; RxJS is used only where it genuinely shines (debounced search streams, parallel `forkJoin` requests).
- **New control flow** — `@if` / `@for` / `@switch` throughout, with `track` on every loop.
- **Typed reactive forms**, **functional route guards**, **functional HTTP interceptors** and **`inject()`-based DI**.
- **`OnPush`** change detection on every component and **`withComponentInputBinding()`** to bind route params straight to component inputs.
- **TypeScript strict mode** with `noImplicitAny`, `noPropertyAccessFromIndexSignature` and friends — **zero `any`**.
- **A real design system** — CSS custom-property tokens, a deliberate type scale and spacing rhythm, light/dark theming and reduced-motion-aware micro-interactions.
- **Resilient async UX** — loading skeletons, empty states and specific, user-friendly error handling for rate limits and missing users.

---

## License

MIT — free to use as a portfolio reference.
