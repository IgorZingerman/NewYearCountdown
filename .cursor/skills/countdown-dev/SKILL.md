---
name: countdown-dev
description: Develop, test and visually verify changes to the New Year countdown site (Next.js static export with canvas snow and fireworks, an SVG yeti and friends, and a moonlit scene). Use when changing the countdown, characters, snow, moon, fireworks, scenery, settings page or config, when running or debugging the app, or before opening a PR for this repo.
---

# New Year Countdown: dev and verify

Read `AGENTS.md` first for conventions, the working agreement and known issues. This skill is the step-by-step procedure.

## Change workflow

```
- [ ] 1. Make the change (follow the Conventions in AGENTS.md)
- [ ] 2. npm run lint && npm test
- [ ] 3. Verify in the browser (below)
- [ ] 4. npm run build (must succeed; static export)
- [ ] 5. Commit on a branch, open a PR into main (main is protected). CI re-runs lint, tests and build on the PR; merging deploys
```

Tests and the build do not exercise the visuals, so step 3 is required for any UI change.

## Verify in the browser

1. Start the server in the background: `npm run dev` (port 3000).
2. Open `http://localhost:3000`, take a screenshot, and check the browser console for errors and warnings (there should be none).
3. For a normal countdown the page should show: the time, "Until <date>", soft falling snow, the moon (a crescent when New Year is far off), snowy mountains and ground with pine trees, the yeti walking with the cub behind him, the penguin, bunny and snowman, and the owl on a tree. Left alone for a minute they should also speak unprompted (about "N days to go" now and then), the owl should fly between the unlit trees, and the penguin or bunny may walk off one edge and come back. Click characters (`element.click()` on each `[style*="will-change"]`): each shows a speech bubble. (The bubble lasts about 2 seconds, so the screenshot tool can miss it. Force it visible with a style override to look at it.)
4. **Midnight celebration:** set the target about 10 seconds ahead, then wait about 12 seconds:

   ```js
   localStorage.setItem('countdown-config', JSON.stringify({ targetDate: new Date(Date.now() + 10000).toISOString() }));
   location.reload();
   ```

   Expect: the celebration message, snow stopped, fireworks bursting, a full moon, and all the characters gathered on the ground with party hats, jumping (the snowman alive, the owl flapping). Re-check the console.
5. Clean up: `localStorage.removeItem('countdown-config')`, and stop the dev server you started.

To see the default date, clear the saved config first (step 5) and reload: it should read "Until January 1, <next year>".

## Common tasks

**Add a setting**: add it to `DEFAULT_CONFIG` in `src/lib/config.js`, validate it in `validateConfig`, expose it in `SettingsForm.jsx`, then pass it to the component from `src/app/page.js`. Add a test that imports the real function.

**Add or change a character**: read the Characters section of `AGENTS.md`. Put movement and maths in `src/lib/` and test it; keep the art and the per-frame posing in the character file. To inspect the art up close, freeze the animation (`window.requestAnimationFrame = () => 0`) and magnify one character with a CSS transform on `<main>`.

**Add an animated component**: make it a client component, put cleanup in the effect return (kill GSAP tweens, cancel `requestAnimationFrame`, clear timeouts, remove listeners), and pick a z-index from the layering order in `AGENTS.md`. Respect `prefers-reduced-motion` for anything intense.

**Add or change audio**: audio files live in `public/music/` and are gitignored (copyrighted, public repo). Never commit them. Go through `playAudioFile` in `src/lib/audio.js`, which skips the HTML the host returns for missing files.

**Change anything date-related**: store ISO strings that represent a local date/time and read them back with local getters, never `getUTC*`. Test the edge `Dec 31 23:59:59 -> Jan 1 00:00:00`, as in `src/__tests__/defaultTargetDate.test.js`.

## Don't

- Don't merge to `main`, trigger the deploy workflow, or change GitHub settings unless the user asks. A merge to `main` deploys to production automatically; see the Deployment section of `AGENTS.md`.
- Don't commit `.env`, `audit.log`, hostnames, or credentials. The repo is public.
- Don't add server-only features (API routes, middleware, server actions). The host is plain Apache serving a static export.
