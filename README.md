# new-year-countdown

I saw this: https://github.com/coord-e/new-year-countdown/tree/master and i loved the idea. That repository has gone the way of the dodo, and is not supported. I figured I'd mess with this a bit. So, i spent a little bit of time and threw this together. 

A festive New Year countdown website: a moonlit snowy night with natural falling snow, a cosy yeti and his friends (a bear cub, a penguin, a bunny, a snowman and an owl) you can click, and a fireworks finale with a party when the clock hits zero.

## Features

- ⏰ Live countdown to a target date (defaults to the next January 1st at your local midnight)
- 🎨 Font and color rotation for the countdown display
- ❄️ Natural snow on a canvas: soft flakes in depth layers, swaying, gusts of wind, a few crystals (amount and speed are configurable)
- 🦣 A yeti in a beanie and scarf who wanders, looks around, waves and puffs his breath in the cold
- 🐻‍❄️🐧🐰⛄🦉 His friends: a bear cub who follows him, a penguin who waddles and belly-slides, a bunny who hops, a snowman who comes alive at midnight, and an owl who flies from tree to tree. They chat on their own (sometimes about how long is left, and sometimes with a knock-knock joke passed between them), the penguin and bunny occasionally wander off-screen and come back, and you can click any of them!
- 🎆 At zero: canvas fireworks, and everyone gathers, puts on a party hat and jumps for joy
- 🌙 A moon that waxes as New Year approaches and is full at midnight
- 🏔️ Snowy mountains and ground, pine trees with twinkling lights, twinkling stars and shooting stars
- 🔊 Spoken announcements (Web Speech API) at 1 hour, 20 minutes, 30 seconds, and the final 10 seconds, plus optional final-countdown music (see below)
- ⚙️ Settings page (`/settings`), saved in your browser's `localStorage`

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Requires Node.js and npm.

### Seeing the midnight celebration without waiting for midnight

Open the site, then in the browser console set the target to ~10 seconds from now:

```js
localStorage.setItem('countdown-config', JSON.stringify({ targetDate: new Date(Date.now() + 10000).toISOString() }));
location.reload();
```

Clear it afterwards with `localStorage.removeItem('countdown-config')`. You can also pick a date and time on the `/settings` page.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Static export to `out/` (also copies `.htaccess`) |
| `npm test` | Jest test suite |
| `npm run lint` | ESLint (Next.js rules) |
| `npm run test:watch` / `test:coverage` | Watch mode / coverage report |
| `npm run deploy` | Build and generate an `rsync` command (see Deployment) |
| `npm run build:cli` / `start:cli` | Build and run the legacy terminal version (`dist/cli/`) |

## Configuration

Settings are edited on the `/settings` page and stored in `localStorage` under `countdown-config`. Defaults live in `src/lib/config.js`. You can change:

- **Countdown:** the target date and time (with quick picks for the next hour, tomorrow midnight and the next New Year) and the message shown at midnight
- **The numbers:** the font and colour, or tick "change every few seconds" and choose which fonts and colours to cycle through
- **Snow:** on or off, how much (light, normal, heavy) and how fast (slow, normal, fast)

The target date is only remembered if you pick something other than the next New Year, so by default the site rolls over to the following year by itself. The terminal version has its own config in `src/cli/config.js` and is not affected by this page.

- Target date and time (your local time)
- Celebration message
- Font selection and rotation
- Countdown color and rotation
- Amount of snow and its speed (the symbol and colour options only apply to the terminal version)

## Final-countdown music (optional)

At 6 minutes to go the site tries to play `/music/TheFinalCountdown.mp3`. The track is not in the repo (it's copyrighted and this repo is public), so to enable it, drop your own file at `public/music/TheFinalCountdown.mp3`. Files in `public/music/` are gitignored, but `npm run build` still copies them into `out/` so they get deployed. If the file is missing the site just logs a warning and carries on. Browsers may block audio and speech until the page has had a click or key press.

## Deployment

The site is a **static export** (`output: 'export'` in `next.config.js`), so it runs on any plain Apache host. No Node.js is needed on the server (it runs fine on a PHP-only Apache host).

### Automatic (GitHub Actions)

`.github/workflows/deploy.yml` runs on every pull request and on every push to `main`:

1. **build** (all PRs and `main`): `npm ci`, lint, tests, `npm run build`, then packages `out/`. No secrets are used.
2. **deploy** (only `main`, i.e. after a merge): downloads the exact package that was just built and uploads it with `rsync` over SSH, then checks that the live site is serving the new build's JavaScript (and that `/settings` loads). The check retries for a few minutes, every request has a time limit, and a failure shows curl's error. Because it runs after the upload, a red check can mean the site is fine but didn't answer the runner in time: look at the live site, then re-run the job.

Safety rails: the SSH host key is pinned; `rsync --delete` runs with `--max-delete=50`, so a deploy that would remove more than 50 files aborts; a dry run prints what would change before the real upload; `.well-known/`, `cgi-bin/`, `stats/`, `logs/`, `.dh-diag` on the server is never touched (the old empty `favicon.ico`/`favicon.gif` are removed, the site's `icon.svg` replaces them); the folder must already exist; the job only runs on `main`, uses the `production` environment, and never runs for pull requests. Actions are pinned to full commit SHAs and the workflow has read-only repo permissions.

**One-time setup.** The repo is public, so the host details and the key are secrets of the GitHub environment `production` (Settings → Environments), not files in the repo:

| Secret | What it is |
| --- | --- |
| `DEPLOY_HOST` | SSH host of the web server |
| `DEPLOY_USER` | SSH user that owns the site folder |
| `DEPLOY_PATH` | the site folder, relative to the SSH login folder (must already exist), e.g. `countdown.potatolabs.com` |
| `DEPLOY_URL` | public site URL, `https://...` (used for the post-deploy check) |
| `DEPLOY_SSH_KEY` | private half of a **dedicated** deploy key (not your personal key) |
| `DEPLOY_KNOWN_HOSTS` | the server's host key line, e.g. from `ssh-keyscan -t ed25519 <host>` (verify the fingerprint) |

Generate the key with `ssh-keygen -t ed25519 -N "" -C countdown-deploy -f ~/.ssh/countdown_deploy`, add the `.pub` half to the server user's `~/.ssh/authorized_keys`, and store the private half with `gh secret set DEPLOY_SSH_KEY --env production < ~/.ssh/countdown_deploy`. If a secret is missing the deploy job fails with a message naming it. To redeploy without a code change, run the workflow manually from the Actions tab on `main`.

### Manual fallback

```bash
cp .env.example .env     # fill in DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH (gitignored)
npm run deploy           # builds, verifies out/, and prints a dry-run and an upload rsync command
```

The script does **not** upload anything by itself. It prints the `rsync` command (and copies it to your clipboard on macOS) for you to run and enter your password.

> ⚠️ That generated command uses `rsync --delete` without the protections above: anything in the remote folder that is not in `out/` will be removed (including server-managed folders such as `.well-known/`). Do a dry run first with `rsync -n`.

The `.htaccess` in the repo root handles HTTPS redirect, routing and security headers (HSTS, a Content Security Policy, frame and content-type protection), and needs `mod_rewrite` and `mod_headers`. Details are in [scripts/README.md](scripts/README.md).

## Project structure

- `src/app/` - Next.js App Router: `page.js` (countdown), `settings/` (settings page), `layout.js`, `icon.svg` (favicon)
- `src/components/` - `CountdownDisplay`, `Snowflakes`, `Fireworks`, `Scenery`, `Moon`, `SettingsForm`
- `src/components/characters/` - the yeti and his friends (`Actor` is the shared shell, one file per character)
- `src/hooks/` - `useConfig`, `useCountdown`, `useAudio`
- `src/lib/` - `config.js` (defaults and validation), `audio.js` (announcements), and the tested logic for snow, moon, and character movement (`snow.js`, `moon.js`, `world.js`, `wander.js`, `pose.js`, `scene.js`)
- `src/cli/` - the original terminal (Ink) version, kept for reference (`npm run build:cli && npm run start:cli`)
- `public/` - static files copied as-is into the export (e.g. `public/music/`)
- `src/__tests__/` - Jest tests
- `scripts/` - manual deploy script
- `.github/workflows/` - CI and automatic deploy
- `.cursor/skills/`, `AGENTS.md`, `CLAUDE.md` - guidance for AI coding agents

## Testing

```bash
npm test
```

Many of the older tests re-implement the logic they check instead of importing it. `config.test.js`, `defaultTargetDate.test.js` and `audioFile.test.js` import the real code and are a good model for new tests.

## Known issues

- **Old saved dates:** a date saved before the settings cleanup stays in that browser's `localStorage` even after a new default ships, so it can keep showing an old, expired date. Pressing Reset to Defaults on `/settings` clears it. New saves only keep a date you changed yourself.
- **Unknown URLs return 200:** the `.htaccess` fallback serves the homepage for any unknown path, so there are no real 404s.
- **Hours, not days:** the countdown shows total hours (e.g. `963:55:41`).
- **Older tests:** many re-implement logic instead of testing the real code.

## License

MIT
