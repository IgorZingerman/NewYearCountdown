// Default configuration
const DEFAULT_CONFIG = {
  targetDate: "2026-01-01T00:00:00.000Z",
  description: "New Year countdown configuration",
  
  font: {
    rotate: false,
    name: "huge",
    frequency: 5,
    rotationOptions: ["huge", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome"],
    availableOptions: [
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
  
  color: {
    rotate: true,
    value: "cyan",
    frequency: 50,
    rotationOptions: ["cyan", "magenta", "yellow", "blue", "green"]
  },
  
  snowflakes: {
    enabled: true,
    count: 40,
    speed: 350,
    options: ["❄", "❅", "❆", "✻", "✼", "✽", "✾", "✿", "❀", "❁"],
    color: {
      rotate: true,
      value: "white",
      frequency: 3,
      rotationOptions: ["cyan", "blue", "white", "gray"]
    }
  }
};

// Valid font options
const VALID_FONTS = ["block", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome", "huge"];

/**
 * Load configuration from localStorage or return defaults
 */
export function loadConfig() {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem('countdown-config');
    if (stored) {
      const config = JSON.parse(stored);
      return validateConfig(config);
    }
  } catch (error) {
    console.error('Failed to load config from localStorage:', error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const validated = validateConfig(config);
    localStorage.setItem('countdown-config', JSON.stringify(validated));
  } catch (error) {
    console.error('Failed to save config to localStorage:', error);
    throw error;
  }
}

/**
 * Validate and sanitize configuration
 */
export function validateConfig(config) {
  const validated = { ...DEFAULT_CONFIG };

  // Validate targetDate
  if (config.targetDate) {
    const date = new Date(config.targetDate);
    if (!isNaN(date.getTime())) {
      validated.targetDate = config.targetDate;
    }
  }

  // Validate font settings
  if (config.font) {
    if (config.font.name && VALID_FONTS.includes(config.font.name)) {
      validated.font.name = config.font.name;
    }
    
    if (config.font.rotate === true) {
      validated.font.rotate = true;
      
      if (config.font.frequency !== undefined) {
        const frequency = Number(config.font.frequency);
        if (frequency > 0 && !isNaN(frequency)) {
          validated.font.frequency = frequency;
        }
      }
      
      if (config.font.rotationOptions && Array.isArray(config.font.rotationOptions)) {
        const validFonts = config.font.rotationOptions.filter(font => VALID_FONTS.includes(font));
        if (validFonts.length > 0) {
          validated.font.rotationOptions = validFonts;
        }
      }
    }
  }

  // Validate color settings
  if (config.color) {
    if (config.color.value && typeof config.color.value === "string") {
      validated.color.value = config.color.value;
    }
    
    if (config.color.rotate === true) {
      validated.color.rotate = true;
      
      if (config.color.frequency !== undefined) {
        const frequency = Number(config.color.frequency);
        if (frequency > 0 && !isNaN(frequency)) {
          validated.color.frequency = frequency;
        }
      }
      
      if (config.color.rotationOptions && Array.isArray(config.color.rotationOptions)) {
        const validColors = config.color.rotationOptions.filter(color => typeof color === "string" && color.length > 0);
        if (validColors.length > 0) {
          validated.color.rotationOptions = validColors;
        }
      }
    }
  }

  // Validate snowflake settings
  if (config.snowflakes) {
    if (config.snowflakes.enabled === true) {
      validated.snowflakes.enabled = true;
      
      if (config.snowflakes.count !== undefined) {
        const count = Number(config.snowflakes.count);
        if (count > 0 && !isNaN(count) && count <= 200) {
          validated.snowflakes.count = Math.min(count, 200);
        }
      }
      
      if (config.snowflakes.speed !== undefined) {
        const speed = Number(config.snowflakes.speed);
        if (speed > 0 && !isNaN(speed)) {
          validated.snowflakes.speed = speed;
        }
      }
      
      if (config.snowflakes.options && Array.isArray(config.snowflakes.options)) {
        const validOptions = config.snowflakes.options.filter(opt => typeof opt === "string" && opt.length > 0);
        if (validOptions.length > 0) {
          validated.snowflakes.options = validOptions;
        }
      }
      
      if (config.snowflakes.color) {
        if (config.snowflakes.color.value && typeof config.snowflakes.color.value === "string") {
          validated.snowflakes.color.value = config.snowflakes.color.value;
        }
        
        if (config.snowflakes.color.rotate === true) {
          validated.snowflakes.color.rotate = true;
          
          if (config.snowflakes.color.frequency !== undefined) {
            const frequency = Number(config.snowflakes.color.frequency);
            if (frequency > 0 && !isNaN(frequency)) {
              validated.snowflakes.color.frequency = frequency;
            }
          }
          
          if (config.snowflakes.color.rotationOptions && Array.isArray(config.snowflakes.color.rotationOptions)) {
            const validColors = config.snowflakes.color.rotationOptions.filter(color => typeof color === "string" && color.length > 0);
            if (validColors.length > 0) {
              validated.snowflakes.color.rotationOptions = validColors;
            }
          }
        }
      }
    } else {
      validated.snowflakes.enabled = false;
    }
  }

  return validated;
}

export { DEFAULT_CONFIG, VALID_FONTS };
