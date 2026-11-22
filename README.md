# new-year-countdown

I saw this: https://github.com/coord-e/new-year-countdown/tree/master and i loved the idea. That repository has gone the way of the dodo, and is not supported. I figured I'd mess with this a bit. So, i spent a little bit of time and threw this together. 

A festive New Year countdown website with falling snow, a cute waddling yeti, a mountain scene with twinkling stars, and a fireworks finale (with a very excited yeti) when the clock hits zero.

## Features

- ⏰ Live countdown to a target date (defaults to the next January 1st at your local midnight)
- 🎨 Font and color rotation for the countdown display
- ❄️ Falling snowflakes (GSAP), configurable count, speed, symbols and colors
- 🦣 A yeti that waddles across the screen
- 🎆 At zero: canvas fireworks, and the yeti runs to the center, throws his arms up and jumps
- 🏔️ Mountain scenery with twinkling stars
- 🔊 Spoken announcements (Web Speech API) at 1 hour, 20 minutes, 30 seconds, and the final 10 seconds
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
| `npm run test:watch` / `test:coverage` | Watch mode / coverage report |
| `npm run deploy` | Build and generate an `rsync` command (see Deployment) |

## Configuration

Settings are edited on the `/settings` page and stored in `localStorage` under `countdown-config`. Defaults live in `src/lib/config.js`.

- Target date and time (your local time)
- Celebration message
- Font selection and rotation
- Countdown color and rotation
- Snowflake count, speed, symbols and colors

## Deployment

The site is a **static export** (`output: 'export'` in `next.config.js`), so it runs on any plain Apache host. No Node.js is needed on the server (it runs fine on a PHP-only Apache host).

```bash
cp .env.example .env     # fill in DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH (gitignored)
npm run deploy           # builds, verifies out/, and generates an rsync command
```

The script does **not** upload anything by itself. It prints the `rsync` command (and copies it to your clipboard on macOS) for you to run and enter your password.

> ⚠️ The generated command uses `rsync --delete`: anything in the remote folder that is not in `out/` will be removed. Make sure the remote path only contains this site (or do a dry run first with `rsync -n`).

The `.htaccess` in the repo root handles HTTPS redirect and routing, and needs `mod_rewrite`. Details are in [scripts/README.md](scripts/README.md).

## Project structure

- `src/app/` - Next.js App Router: `page.js` (countdown), `settings/` (settings page), `layout.js`, `icon.svg` (favicon)
- `src/components/` - `CountdownDisplay`, `Snowflakes`, `Yeti`, `Fireworks`, `Scenery`, `SettingsForm`
- `src/hooks/` - `useConfig`, `useCountdown`, `useAudio`
- `src/lib/` - `config.js` (defaults and validation), `audio.js` (announcements)
- `src/cli/` - the original terminal (Ink) version, kept for reference
- `src/__tests__/` - Jest tests
- `scripts/` - deploy script
- `.cursor/skills/`, `AGENTS.md`, `CLAUDE.md` - guidance for AI coding agents

## Testing

```bash
npm test
```

Many of the existing tests re-implement the logic they check instead of importing it. `src/__tests__/defaultTargetDate.test.js` imports the real code and is a good model for new tests.

## Known issues

- **Music:** the final-countdown audio tries to load `/music/TheFinalCountdown.mp3`, but there is no `public/` folder, so no audio file is served. The repo's `music/` folder is empty. Add the file under `public/music/` to enable it.
- **Legacy CLI:** `npm run build:cli` writes to `dist/`, but `npm run start:cli` runs `dist/cli/index.js`, so it doesn't start. The CLI config also still has an old target date.
- **Lint:** `npm run lint` doesn't work with Next.js 16 (`next lint` was removed). The deploy script treats this as a warning and continues.
- **Config defaults:** `validateConfig` in `src/lib/config.js` shallow-copies the defaults and then edits nested objects, so shared defaults can get modified.
- **Old saved dates:** a date saved from `/settings` stays in that browser's `localStorage` even after a new default ships, so it can keep showing an old, expired date until it's changed or cleared.

## License

MIT
