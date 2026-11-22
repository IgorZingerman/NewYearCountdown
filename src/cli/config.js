// Next January 1st at midnight in local time (always next year's, since this year's has started).
// Kept local to the CLI: the CLI is built on its own into dist/cli and can't import from src/lib.
export function getNextNewYear(now = new Date()) {
  return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0).toISOString();
}

export default {
  "targetDate": getNextNewYear(),
  "description": "New Year countdown configuration",
  "celebrationMessage": "🎉 Happy New Year! 🎉",
  
  "font": {
    "rotate": false,
    "name": "huge",
    "frequency": 5,
    "rotationOptions": ["huge", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome"],
    "availableOptions": [
      "block",
      "slick",
      "tiny",
      "grid",
      "pallet",
      "shade",
      "simple",
      "simpleBlock",
      "3d",
      "simple3d",
      "chrome",
      "huge"
    ]
  },
  
  "color": {
    "rotate": true,
    "value": "cyan",
    "frequency": 50,
    "rotationOptions": ["cyan", "magenta", "yellow", "blue", "green"]
  },
  
  "snowflakes": {
    "enabled": true,
    "count": 40,
    "speed": 4500,
    "options": ["❄", "❅", "❆", "✻", "✼", "✽", "✾", "✿", "❀", "❁"],
    "color": {
      "rotate": true,
      "value": "white",
      "frequency": 3,
      "rotationOptions": ["cyan", "blue", "white", "gray"]
    }
  }
}
