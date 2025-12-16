# new-year-countdown

I saw this: https://github.com/coord-e/new-year-countdown/tree/master and i loved the idea. That repository has gone the way of the dodo, and is not supported. I figured I'd mess with this a bit. So, i spent a little bit of time and threw this together. 

A festive New Year countdown application with GSAP animations, Yeti character, scenic background, and customizable settings.

## Features

- ⏰ Real-time countdown timer with customizable target date
- 🎨 Font rotation with multiple ASCII art font styles
- 🌈 Color rotation for countdown display
- ❄️ Animated snowflakes with GSAP particle system
- 🦣 Yeti character walking animation
- 🏔️ Scenic mountain background with twinkling stars
- 🔊 Audio announcements using Web Speech API
- ⚙️ Settings page for configuration

## Installation

```bash
npm install
```

## Running the Next.js Web Application

```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Running the CLI Version (Legacy)

The original CLI version is still available:

```bash
# Build CLI version
npm run build:cli

# Run CLI version
npm run start:cli
```

## Configuration

Settings can be configured via:
1. **Web UI**: Navigate to `/settings` page in the web application
2. **localStorage**: Settings are automatically saved to browser localStorage

Configuration options include:
- Target date/time
- Font selection and rotation
- Color selection and rotation
- Snowflake settings (count, speed, colors)

## Project Structure

- `src/app/` - Next.js app directory (pages and layout)
- `src/components/` - React components (CountdownDisplay, Snowflakes, Yeti, Scenery, SettingsForm)
- `src/hooks/` - Custom React hooks (useCountdown, useConfig, useAudio)
- `src/lib/` - Utility libraries (config, audio)
- `src/cli/` - CLI application code (original terminal-based version)
- `src/__tests__/` - Test suite
- `src/public/` - Static assets (images, sprite sheets)

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```
