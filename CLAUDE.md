# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server with HMR
bun run build    # TypeScript check + Vite production build
bun run lint     # Run ESLint
bun run preview  # Preview production build locally
bun run typecheck # TypeScript check without building
bun run format  # Format code with Prettier
```

## Architecture

React 19 + TypeScript SPA built with Vite. The app is a cheat toolkit for RPG Maker MV/MZ games.

**Entry flow:** `index.html` → `src/main.tsx` → `src/App.tsx`

- `src/components/` — UI components
- `src/hooks/` — custom React hooks
- `src/index.css` — global styles, imports Tailwind CSS 4 via `@import`

**Path alias:** `@/` resolves to `./src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

React Router 8 is installed but not yet integrated. When wiring up routing, use the new `createBrowserRouter` / `RouterProvider` API (not the legacy `<BrowserRouter>` component).

## Key Config

- **Tailwind CSS 4** — uses the Vite plugin (`@tailwindcss/vite`), not the PostCSS plugin. Do not add a `tailwind.config.ts`.
- **TypeScript** — strict mode with `noUnusedLocals` and `noUnusedParameters` enforced. Fix type errors before building.
- **Prettier** — single quotes, 2-space indent, Tailwind class sorting via `prettier-plugin-tailwindcss`.
- No test framework is configured.
