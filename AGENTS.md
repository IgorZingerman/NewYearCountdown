# AGENTS.md

Guidance for AI coding agents working in this repo. Human-facing docs are in [README.md](README.md).

## What this is

A New Year countdown website: Next.js 16 (App Router, React 18, JavaScript, no TypeScript), GSAP for animation, a `<canvas>` for fireworks. It is built as a **static export** and served by plain Apache (PHP-only shared hosting). A legacy Ink terminal version lives in `src/cli/`.

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Jest (ESM, runs with --experimental-vm-modules)
npm run build        # static export to out/ (copies .htaccess)
```

Run `npm test` and `npm run build` before proposing a PR. Do not rely on `npm run lint` (broken with Next 16) or `npm run start:cli` (see Known issues).

## Working agreement

- **Do not make assumptions.** If something is ambiguous or has real consequences, ask the user first. Work through decisions together.
- **Never deploy, push to `main`, force-push, or change GitHub settings without being asked.** `main` is protected: changes go through a pull request.
- **Never commit** `.env`, `audit.log`, or any credentials. `.env` and `*.log` are gitignored; keep it that way. Only `.env.example` (placeholders) is tracked.
- **Do not put hostnames, SSH users, remote paths, or the live site's server details in files, commits or PR text.** The repo is public.
- **Commit identity:** this repo is set to the user's GitHub noreply email. Do not change `git config user.email`, and do not use other emails.
- Keep commits small and the PR description factual: what changed, how it was verified, what is not covered.

## Architecture

| Path | Purpose |
| --- | --- |
| `src/app/page.js` | Home page: composes scenery, yeti, snow, fireworks, countdown, settings link |
| `src/app/settings/page.js` | Settings page (renders `SettingsForm`) |
| `src/app/icon.svg` | Favicon (Next file convention) |
| `src/components/` | `CountdownDisplay`, `Snowflakes`, `Yeti`, `Fireworks`, `Scenery`, `SettingsForm` |
| `src/hooks/` | `useConfig` (load/save config), `useCountdown`, `useAudio` |
| `src/lib/config.js` | `DEFAULT_CONFIG`, `getNextNewYear()`, `validateConfig`, load/save |
| `src/lib/audio.js` | Web Speech announcements |
| `src/__tests__/` | Jest tests |
| `scripts/deploy.sh` | Build + generates an `rsync` command (does not upload) |
| `.htaccess` | HTTPS redirect, SPA fallback, caching (copied into `out/` by the build) |

All animated components are client components (`'use client'`) and must clean up in the effect return (kill GSAP tweens, cancel `requestAnimationFrame`, clear timers, remove listeners). Follow the existing cleanup patterns in `Snowflakes.jsx` and `Fireworks.jsx`.

### Layering (z-index)

Scenery `0-2` < Fireworks `5` < Yeti `6` < Snowflakes `10` < countdown `20` < settings link `30`. Keep new elements consistent with this.

### Midnight celebration

`useCountdown` sets `isExpired`. `page.js` then stops the snow, mounts `<Fireworks />` and passes `celebrating` to `<Yeti />`. The yeti's walk and celebration both live in one effect keyed on `celebrating`.

## Conventions that matter

- **Dates:** `targetDate` is stored as an ISO (UTC) string that represents a **local** date/time. Read it back with **local** getters (`getFullYear`, `getMonth`, `getDate`, `getHours`), never `getUTC*`. The default is `getNextNewYear()` (next Jan 1, local midnight).
- **Static export constraints** (`output: 'export'` in `next.config.js`): no API routes, no server actions, no middleware, no runtime `next/image` optimization (`images.unoptimized` is set), no server-only code. Anything that needs a server will not work on the host. New pages become `route.html` and `route/`; the `.htaccess` fallback serves `index.html` for unknown paths.
- **Static assets:** there is no `public/` folder. Next serves static files from `public/` at the repo root; add it if you need real assets.
- **Config:** add new settings to `DEFAULT_CONFIG`, then `validateConfig`, then `SettingsForm`, then the consumer. Do not mutate `DEFAULT_CONFIG` (see Known issues).
- **Tests:** Jest runs native ESM (`"type": "module"`, no transform). Prefer tests that import the real module (see `defaultTargetDate.test.js`) over ones that re-implement logic.

## Verifying UI changes

Tests do not cover the visuals. After UI changes, run `npm run dev` and look at the page in a browser, and check the console for errors. To see the midnight celebration, set the target 10 seconds ahead in the browser console and reload:

```js
localStorage.setItem('countdown-config', JSON.stringify({ targetDate: new Date(Date.now() + 10000).toISOString() }));
location.reload();
```

Run `localStorage.removeItem('countdown-config')` when done. Stop any dev server you start.

## Deployment (only when the user asks)

`npm run deploy` builds and prints an `rsync -avz --delete` command; the user runs it and types their password. `--delete` removes remote files not in `out/`, so confirm the remote folder contents and do a dry run (`rsync -n`) first. Never run the real upload yourself without explicit approval.

## Known issues

- `npm run build:cli` writes to `dist/`, but `npm run start:cli` runs `dist/cli/index.js`, so it fails. `src/cli/config.js` and `src/cli/index.js` still contain old dates.
- `npm run lint` fails (`next lint` was removed in Next 16).
- `validateConfig` does `{ ...DEFAULT_CONFIG }` (shallow) and then mutates nested objects, so the shared defaults can change.
- The final-countdown audio loads `/music/TheFinalCountdown.mp3`, but no such file is served (no `public/`, and `music/` is empty). On the host, a missing file returns the homepage HTML (SPA fallback).
- Unknown URLs return HTTP 200 with the homepage (the SPA fallback), not a real 404.
- The countdown shows total hours (e.g. `963:55:41`), not days.
- Many older tests re-implement logic rather than testing the real code.
