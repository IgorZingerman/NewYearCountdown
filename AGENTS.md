# AGENTS.md

Guidance for AI coding agents working in this repo. Human-facing docs are in [README.md](README.md).

## What this is

A New Year countdown website: Next.js 16 (App Router, React 18, JavaScript, no TypeScript), GSAP and `<canvas>` for animation (the snow and the fireworks are canvases; the characters are SVG). It is built as a **static export** and served by plain Apache (PHP-only shared hosting). A legacy Ink terminal version lives in `src/cli/`.

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Jest (ESM, runs with --experimental-vm-modules)
npm run lint         # ESLint (flat config, eslint-config-next)
npm run build        # static export to out/ (copies .htaccess)
```

Run `npm run lint`, `npm test` and `npm run build` before proposing a PR. The legacy terminal version runs with `npm run build:cli && npm run start:cli` (output in `dist/cli/`).

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
| `src/app/page.js` | Home page: composes scenery, characters, snow, fireworks, countdown, settings link |
| `src/app/settings/page.js` | Settings page (renders `SettingsForm`) |
| `src/app/icon.svg` | Favicon (Next file convention) |
| `src/components/` | `CountdownDisplay`, `Snowflakes` (canvas snow), `Fireworks`, `Scenery`, `Moon`, `SettingsForm` |
| `src/components/characters/` | The yeti and his friends: `Actor` (shared shell), one file per character, `Characters` (puts them on screen), `art.jsx` (shared look) |
| `src/hooks/` | `useConfig` (load/save config), `useCountdown`, `useAudio` |
| `src/lib/config.js` | `DEFAULT_CONFIG`, `getNextNewYear()`, `validateConfig`, load/save |
| `src/lib/audio.js` | Web Speech announcements and the final-countdown music |
| `src/lib/snow.js`, `moon.js`, `world.js`, `wander.js`, `pose.js`, `scene.js` | Pure logic (no DOM, unit tested): snow flakes and wind; moon phase; character lanes; walking and following; posing helpers; shared scenery layout |
| `public/` | Static files copied as-is into the export. `public/music/` holds the (gitignored) audio |
| `eslint.config.mjs` | ESLint flat config; documents why `react-hooks/set-state-in-effect` is off |
| `src/__tests__/` | Jest tests |
| `scripts/deploy.sh` | Manual fallback: build + generates an `rsync` command (does not upload) |
| `.github/workflows/deploy.yml` | CI on PRs; automatic deploy to the host after a merge to `main` |
| `.htaccess` | HTTPS redirect, SPA fallback, caching (copied into `out/` by the build) |

All animated components are client components (`'use client'`) and must clean up in the effect return (kill GSAP tweens, cancel `requestAnimationFrame`, clear timers, remove listeners). Follow the existing cleanup patterns in `Snowflakes.jsx` and `Fireworks.jsx`.

### Layering (z-index)

Scenery `0-3` < pine trees `4` < Fireworks `5` < Characters `6-9` (by lane, see below) < Snowflakes `10` < countdown `20` < settings link `30`. Keep new elements consistent with this.

### Midnight celebration

`useCountdown` sets `isExpired`. `page.js` then stops the snow, mounts `<Fireworks />` and passes `celebrating` to `<Characters />`. Each character reads `celebrating` and reacts in its own `tick`: the wanderers run to their own spot and jump with party hats, the snowman comes alive, the owl flaps. The moon is full at midnight (see below).

### Characters

Every character is an `Actor` (`src/components/characters/Actor.jsx`) plus two things the character file supplies:

- **Art:** an SVG with parts marked `data-part="name"` (limbs, eyes, head...).
- **Behaviour:** a factory `({ parts, world, api, reduced }) => ({ tick(dt, t, env), onClick })`. `tick` runs every frame, poses the parts (with `tf()` from `lib/pose.js`) and returns where to put the character: `{ x, bottomVh, scale, z, dir }`.

`Actor` owns the placement, facing, the single animation loop, speech bubbles (`api.say`), hops and spins (`api.hop`) and the celebration jumping (`api.jumpLoop`). Characters stand on the snowy ground in **lanes**: `ground(depth)` in `lib/world.js` gives the height, size and z-index (back lane = higher, smaller, behind). Movement is pixel based and uses `u = innerHeight / 900` so it scales with the screen. The shared `world` object lets characters react to each other (the cub follows `world.yeti`). The owl and the snowman are static: the owl perches on a tree tip using the layout in `lib/scene.js`, shared with `Scenery.jsx`. To add a character: copy a similar one, add it to `Characters.jsx`, and add logic to the tested `lib/` files rather than inlining it.

### Snow and moon

The snow is one canvas (`Snowflakes.jsx` + `lib/snow.js`): soft white flakes in depth layers with sway, wind gusts and fading at the ground. Of the snow settings only `enabled`, `count` (a density) and `speed` (bigger = slower) apply; the glyph and colour settings are used only by the terminal version. The moon (`Moon.jsx` + `lib/moon.js`) follows the countdown: a crescent when New Year is far off, waxing at the real speed of the moon, and full at midnight.

## Conventions that matter

- **Dates:** `targetDate` is stored as an ISO (UTC) string that represents a **local** date/time. Read it back with **local** getters (`getFullYear`, `getMonth`, `getDate`, `getHours`), never `getUTC*`. The default is `getNextNewYear()` (next Jan 1, local midnight).
- **Apache routing:** `next.config.js` sets `trailingSlash: true` so each page is `route/index.html`; without it `/settings` showed a raw directory listing on the host (Next's default `settings.html` is not found for `/settings`). `.htaccess` also returns 403 for folders without an `index.html` so file listings never appear. Test routing changes against a real Apache (for example the `httpd:2.4` Docker image with `AllowOverride All` and `Options Indexes`, using a copy of `.htaccess` without the HTTPS redirect), not just `next dev`.
- **Static export constraints** (`output: 'export'` in `next.config.js`): no API routes, no server actions, no middleware, no runtime `next/image` optimization (`images.unoptimized` is set), no server-only code. Anything that needs a server will not work on the host. New pages become `route/index.html`; the `.htaccess` fallback serves the homepage for unknown paths.
- **Static assets:** put them in `public/` (served from `/`). `public/music/*` is gitignored on purpose: the final-countdown track is copyrighted and the repo is public. Never commit audio files; the build still copies local ones into `out/`.
- **Stable random values:** do not call `Math.random()` during render for visuals (the page re-renders every second and everything would reshuffle). Generate once, e.g. `useState(() => ...)` as `Scenery.jsx` does. (Character art is rendered once and then posed by `tick` straight on the SVG attributes, not through React state.)
- **Legacy CLI (`src/cli/`):** built separately with Babel into `dist/cli/`, so it can't import from `src/lib` (it has its own `getNextNewYear` in `src/cli/config.js`).
- **Config:** add new settings to `DEFAULT_CONFIG`, then `validateConfig`, then `SettingsForm`, then the consumer. Do not mutate `DEFAULT_CONFIG` (see Known issues).
- **Tests:** Jest runs native ESM (`"type": "module"`, no transform). Prefer tests that import the real module (see `defaultTargetDate.test.js`) over ones that re-implement logic.

## Verifying UI changes

Tests do not cover the visuals. After UI changes, run `npm run dev` and look at the page in a browser, and check the console for errors. To see the midnight celebration, set the target 10 seconds ahead in the browser console and reload:

```js
localStorage.setItem('countdown-config', JSON.stringify({ targetDate: new Date(Date.now() + 10000).toISOString() }));
location.reload();
```

Run `localStorage.removeItem('countdown-config')` when done. Stop any dev server you start.

## Deployment

Deploys are automatic: `.github/workflows/deploy.yml` builds on every PR and, after a merge to `main`, uploads `out/` over SSH to the web host (see README → Deployment). Host, user, path, URL, SSH key and pinned host key are secrets of the GitHub environment `production`.

- **Do not trigger a deploy (no manual workflow runs, no manual `rsync`) unless the user asks.** Merging to `main` is what deploys, so treat a merge as a production release.
- Never print, log, commit or paste the secrets or the private key (`~/.ssh/countdown_deploy`, outside the repo). Do not put host details in files, commits or PR text. If you must reference them, use the secret names.
- When changing the workflow, keep: actions pinned to full SHAs, `permissions: contents: read`, deploy only on `main`, pinned host key, the dry run, `--max-delete`, and the server-managed excludes. Test rsync flag changes against a local folder first. macOS ships `openrsync`, which lacks some flags (for example `--chmod`) that the Linux runner has.
- `npm run deploy` (`scripts/deploy.sh`) is a manual fallback that only prints an `rsync --delete` command without those protections. Never run the real upload yourself without explicit approval, and do a dry run (`rsync -n`) first.

## Known issues

- `validateConfig` does `{ ...DEFAULT_CONFIG }` (shallow) and then mutates nested objects, so the shared defaults can change.
- A date saved from `/settings` stays in that browser's `localStorage` after a new default ships.
- Unknown URLs return HTTP 200 with the homepage (the SPA fallback), not a real 404. A missing audio file on the host therefore comes back as HTML, which `playAudioFile` detects and skips.
- The countdown shows total hours (e.g. `963:55:41`), not days.
- Many older tests re-implement logic rather than testing the real code.
- `react-hooks/set-state-in-effect` is turned off in `eslint.config.mjs` on purpose (localStorage and first-tick reads must happen in effects to avoid hydration mismatches).
