#!/usr/bin/env node
import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, render } from "ink";
import BigText from "ink-big-text";
import Spinner from "ink-spinner";
import Gradient from "ink-gradient";
import { exec, spawn } from "child_process";
import config from "./config.js";

// Custom hook to get terminal dimensions and update on resize
const useTerminalDimensions = () => {
  const [dimensions, setDimensions] = useState([
    process.stdout.columns || 80,
    process.stdout.rows || 24,
  ]);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions([
        process.stdout.columns || 80,
        process.stdout.rows || 24,
      ]);
    };

    // Update dimensions on resize
    process.stdout.on('resize', updateDimensions);
    
    // Initial update
    updateDimensions();

    return () => {
      process.stdout.removeListener('resize', updateDimensions);
    };
  }, []);

  return dimensions;
};


// Valid font options
const VALID_FONTS = ["block", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome", "huge"];

let NEWYEAR;
let COUNTDOWN_FONT = "huge"; // Default font
let ROTATE_FONTS = false;
let ROTATE_FREQUENCY = 10; // Default rotation frequency in seconds
let FONT_ROTATION_OPTIONS = [];
let COUNTDOWN_COLOR = null; // Default color (null means use time-based logic)
let ROTATE_COLORS = false;
let COLOR_ROTATION_FREQUENCY = 5; // Default color rotation frequency in seconds
let COLOR_ROTATION_OPTIONS = [];
let ENABLE_SNOWFLAKES = false;
let SNOWFLAKE_COUNT = 50;
let SNOWFLAKE_OPTIONS = ["❄", "❅", "❆", "✻", "✼", "✽", "✾", "✿", "❀", "❁"];
let SNOWFLAKE_SPEED = 100; // Milliseconds between moves (faster for smooth falling)
let SNOWFLAKE_COLOR = null; // Default color (null means white/default)
let SNOWFLAKE_ROTATE_COLORS = false;
let SNOWFLAKE_COLOR_ROTATION_FREQUENCY = 3; // Default color rotation frequency in seconds
let SNOWFLAKE_COLOR_ROTATION_OPTIONS = [];

try {
  if (!config.targetDate) {
    throw new Error("targetDate is required in config.json");
  }
  
  NEWYEAR = new Date(config.targetDate);
  
  if (isNaN(NEWYEAR.getTime())) {
    throw new Error(`Invalid date format in config.json: ${config.targetDate}`);
  }
  
  // Load font settings from config.font object
  if (config.font) {
    // Load font name
    if (config.font.name) {
      if (VALID_FONTS.includes(config.font.name)) {
        COUNTDOWN_FONT = config.font.name;
        console.error(`[INFO] Loaded font from config: ${COUNTDOWN_FONT}`);
      } else {
        console.error(`[WARN] Invalid font "${config.font.name}" in config.json. Using default: huge`);
        console.error(`[INFO] Valid fonts are: ${VALID_FONTS.join(", ")}`);
      }
    }
    
    // Load font rotation settings
    if (config.font.rotate === true) {
      ROTATE_FONTS = true;
      
      // Load rotation frequency (in seconds)
      if (config.font.frequency !== undefined) {
        const frequency = Number(config.font.frequency);
        if (frequency > 0 && !isNaN(frequency)) {
          ROTATE_FREQUENCY = frequency;
          console.error(`[INFO] Font rotation frequency set to ${ROTATE_FREQUENCY} seconds`);
        } else {
          console.error(`[WARN] Invalid font.frequency value "${config.font.frequency}". Using default: 10 seconds`);
        }
      }
      
      if (config.font.rotationOptions && Array.isArray(config.font.rotationOptions) && config.font.rotationOptions.length > 0) {
        // Validate fonts in rotation options
        const validRotationFonts = config.font.rotationOptions.filter(font => VALID_FONTS.includes(font));
        if (validRotationFonts.length > 0) {
          FONT_ROTATION_OPTIONS = validRotationFonts;
          console.error(`[INFO] Font rotation enabled with ${FONT_ROTATION_OPTIONS.length} fonts: ${FONT_ROTATION_OPTIONS.join(", ")}`);
        } else {
          console.error(`[WARN] No valid fonts in font.rotationOptions. Disabling font rotation.`);
          ROTATE_FONTS = false;
        }
      } else {
        console.error(`[WARN] font.rotationOptions is missing or empty. Disabling font rotation.`);
        ROTATE_FONTS = false;
      }
    }
  }
  
  // Load color settings from config.color object
  if (config.color) {
    // Load static color value
    if (config.color.value && typeof config.color.value === "string") {
      COUNTDOWN_COLOR = config.color.value;
      console.error(`[INFO] Countdown color set to: ${COUNTDOWN_COLOR}`);
    }
    
    // Load color rotation settings
    if (config.color.rotate === true) {
      ROTATE_COLORS = true;
      
      // Load color rotation frequency (in seconds)
      if (config.color.frequency !== undefined) {
        const frequency = Number(config.color.frequency);
        if (frequency > 0 && !isNaN(frequency)) {
          COLOR_ROTATION_FREQUENCY = frequency;
          console.error(`[INFO] Color rotation frequency set to ${COLOR_ROTATION_FREQUENCY} seconds`);
        } else {
          console.error(`[WARN] Invalid color.frequency value "${config.color.frequency}". Using default: 5 seconds`);
        }
      }
      
      if (config.color.rotationOptions && Array.isArray(config.color.rotationOptions) && config.color.rotationOptions.length > 0) {
        // Validate colors (basic check - ink supports many color names)
        const validColors = config.color.rotationOptions.filter(color => typeof color === "string" && color.length > 0);
        if (validColors.length > 0) {
          COLOR_ROTATION_OPTIONS = validColors;
          console.error(`[INFO] Color rotation enabled with ${COLOR_ROTATION_OPTIONS.length} colors: ${COLOR_ROTATION_OPTIONS.join(", ")}`);
        } else {
          console.error(`[WARN] No valid colors in color.rotationOptions. Disabling color rotation.`);
          ROTATE_COLORS = false;
        }
      } else {
        console.error(`[WARN] color.rotationOptions is missing or empty. Disabling color rotation.`);
        ROTATE_COLORS = false;
      }
    }
  }
  
  // Load snowflakes settings from config.snowflakes object
  if (config.snowflakes) {
    if (config.snowflakes.enabled === true) {
      ENABLE_SNOWFLAKES = true;
      
      // Load snowflake count
      if (config.snowflakes.count !== undefined) {
        const count = Number(config.snowflakes.count);
        if (count > 0 && !isNaN(count) && count <= 200) {
          SNOWFLAKE_COUNT = Math.floor(count);
          console.error(`[INFO] Snowflake count set to ${SNOWFLAKE_COUNT}`);
        } else {
          console.error(`[WARN] Invalid snowflakes.count value "${config.snowflakes.count}". Using default: 50 (max 200)`);
        }
      }
      
      // Load snowflake options
      if (config.snowflakes.options && Array.isArray(config.snowflakes.options) && config.snowflakes.options.length > 0) {
        SNOWFLAKE_OPTIONS = config.snowflakes.options.filter(char => typeof char === "string" && char.length > 0);
        if (SNOWFLAKE_OPTIONS.length > 0) {
          console.error(`[INFO] Snowflakes enabled with ${SNOWFLAKE_OPTIONS.length} snowflake options: ${SNOWFLAKE_OPTIONS.join(", ")}`);
        } else {
          console.error(`[WARN] No valid characters in snowflakes.options. Disabling snowflakes.`);
          ENABLE_SNOWFLAKES = false;
        }
      } else {
        console.error(`[WARN] snowflakes.options is missing or empty. Disabling snowflakes.`);
        ENABLE_SNOWFLAKES = false;
      }
      
      // Load snowflake speed
      if (config.snowflakes.speed !== undefined) {
        const speed = Number(config.snowflakes.speed);
        if (speed > 0 && !isNaN(speed)) {
          SNOWFLAKE_SPEED = speed;
          console.error(`[INFO] Snowflake speed set to ${SNOWFLAKE_SPEED}ms`);
        } else {
          console.error(`[WARN] Invalid snowflakes.speed value "${config.snowflakes.speed}". Using default: 100ms`);
        }
      }
      
      // Load snowflake color settings
      if (config.snowflakes.color) {
        // Load static color value
        if (config.snowflakes.color.value && typeof config.snowflakes.color.value === "string") {
          SNOWFLAKE_COLOR = config.snowflakes.color.value;
          console.error(`[INFO] Snowflake color set to: ${SNOWFLAKE_COLOR}`);
        }
        
        // Load color rotation settings
        if (config.snowflakes.color.rotate === true) {
          SNOWFLAKE_ROTATE_COLORS = true;
          
          // Load color rotation frequency (in seconds)
          if (config.snowflakes.color.frequency !== undefined) {
            const frequency = Number(config.snowflakes.color.frequency);
            if (frequency > 0 && !isNaN(frequency)) {
              SNOWFLAKE_COLOR_ROTATION_FREQUENCY = frequency;
              console.error(`[INFO] Snowflake color rotation frequency set to ${SNOWFLAKE_COLOR_ROTATION_FREQUENCY} seconds`);
            } else {
              console.error(`[WARN] Invalid snowflakes.color.frequency value "${config.snowflakes.color.frequency}". Using default: 3 seconds`);
            }
          }
          
          if (config.snowflakes.color.rotationOptions && Array.isArray(config.snowflakes.color.rotationOptions) && config.snowflakes.color.rotationOptions.length > 0) {
            // Validate colors
            const validColors = config.snowflakes.color.rotationOptions.filter(color => typeof color === "string" && color.length > 0);
            if (validColors.length > 0) {
              SNOWFLAKE_COLOR_ROTATION_OPTIONS = validColors;
              console.error(`[INFO] Snowflake color rotation enabled with ${SNOWFLAKE_COLOR_ROTATION_OPTIONS.length} colors: ${SNOWFLAKE_COLOR_ROTATION_OPTIONS.join(", ")}`);
            } else {
              console.error(`[WARN] No valid colors in snowflakes.color.rotationOptions. Disabling color rotation.`);
              SNOWFLAKE_ROTATE_COLORS = false;
            }
          } else {
            console.error(`[WARN] snowflakes.color.rotationOptions is missing or empty. Disabling color rotation.`);
            SNOWFLAKE_ROTATE_COLORS = false;
          }
        }
      }
    } else {
      console.error(`[INFO] Snowflakes disabled in config`);
    }
  }
  
  console.error(`[INFO] Loaded target date from config: ${NEWYEAR.toISOString()}`);
} catch (error) {
  console.error(`[ERROR] Failed to load config.json: ${error.message}`);
  console.error(`[INFO] Falling back to default date: January 1, 2025`);
  // Fallback to default date
  NEWYEAR = new Date(2025, 0, 1, 0, 0, 0, 0);
}

// Prevent screen saver from launching (macOS only)
let caffeinateProcess = null;
if (process.platform === 'darwin') {
  try {
    // Start caffeinate to prevent display sleep and system sleep
    // -d: Prevent display from sleeping
    // -i: Prevent system from idle sleeping
    caffeinateProcess = spawn('caffeinate', ['-d', '-i'], {
      detached: false,
      stdio: 'ignore'
    });
    
    caffeinateProcess.on('error', (error) => {
      console.error(`[WARN] Failed to start caffeinate: ${error.message}`);
      console.error(`[INFO] Screen saver prevention disabled. The screen may sleep during countdown.`);
    });
    
    console.error(`[INFO] Screen saver prevention enabled (caffeinate started)`);
    
    // Cleanup function to kill caffeinate when app exits
    const cleanup = () => {
      if (caffeinateProcess && !caffeinateProcess.killed) {
        caffeinateProcess.kill();
        console.error(`[INFO] Screen saver prevention disabled (caffeinate stopped)`);
      }
    };
    
    // Register cleanup handlers for various exit scenarios
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      cleanup();
      throw error;
    });
  } catch (error) {
    console.error(`[WARN] Failed to initialize screen saver prevention: ${error.message}`);
  }
}

console.clear();
console.log("");
console.log("");
console.log("");
console.log("");

const LABEL_SEPARATOR = " ".repeat(14);
const UNTIL_PADDING = " ".repeat(20);
const { Component } = React;

// Falling snowflakes - renders snowflakes that fall from top to bottom
const FallingSnowflakes = ({ enabled, count, characters, terminalWidth, terminalHeight, speed, color, rotateColors, colorRotationOptions, colorRotationFrequency }) => {
  const [currentColor, setCurrentColor] = useState(null);
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    if (rotateColors && colorRotationOptions && colorRotationOptions.length > 0) {
      // Set initial color
      setCurrentColor(colorRotationOptions[0]);
      setColorIndex(0);

      // Rotate colors at configured frequency (convert seconds to milliseconds)
      const intervalMs = (colorRotationFrequency || 3) * 1000;
      const interval = setInterval(() => {
        setColorIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % colorRotationOptions.length;
          setCurrentColor(colorRotationOptions[nextIndex]);
          return nextIndex;
        });
      }, intervalMs);

      return () => clearInterval(interval);
    } else if (color) {
      // Use static color
      setCurrentColor(color);
    } else {
      // Use default (white/null)
      setCurrentColor(null);
    }
  }, [rotateColors, colorRotationOptions, color, colorRotationFrequency]);

  // Determine the color to use
  const displayColor = currentColor !== null ? currentColor : null;
  const [snowflakePositions, setSnowflakePositions] = useState(() => {
    return Array.from({ length: Math.min(count, 200) }).map(() => ({
      x: Math.floor(Math.random() * terminalWidth),
      y: Math.floor(Math.random() * terminalHeight), // Start at random heights
      fallSpeed: 0.1 + Math.random() * 0.3, // Slower fall speed for gentler movement
      drift: (Math.random() - 0.5) * 0.1, // Reduced drift for smoother movement
    }));
  });

  useEffect(() => {
    if (!enabled || count <= 0 || !characters || characters.length === 0) {
      return;
    }

    // Use faster update interval for smoother animation
    // Cap at 50ms for smooth updates, but adjust fall speed to maintain visual speed
    const updateInterval = Math.min(speed, 50);
    const speedMultiplier = speed / updateInterval; // Adjust fall speed to maintain same visual speed
    
    const interval = setInterval(() => {
      setSnowflakePositions((prev) => {
        return prev.map((pos) => {
          // Multiply fall speed by speedMultiplier to maintain visual speed with faster updates
          let newY = pos.y + (pos.fallSpeed * speedMultiplier);
          let newX = pos.x + (pos.drift * speedMultiplier);

          // When snowflake reaches bottom, reset to top at random x position
          if (newY >= terminalHeight) {
            newY = -1; // Start just above screen
            newX = Math.floor(Math.random() * terminalWidth);
          }

          // Wrap around horizontally (snowflakes drift across screen)
          if (newX < 0) {
            newX = terminalWidth - 1;
          } else if (newX >= terminalWidth) {
            newX = 0;
          }

          return { ...pos, x: newX, y: newY };
        });
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enabled, count, characters, terminalWidth, terminalHeight, speed]);

  if (!enabled || count <= 0 || !characters || characters.length === 0) {
    return null;
  }

  // Optimize grid creation with useMemo to avoid recreating on every render
  const grid = useMemo(() => {
    const gridArray = Array(terminalHeight).fill(null).map(() => 
      Array(terminalWidth).fill(" ")
    );

    // Place snowflakes in the grid
    snowflakePositions.forEach((pos, index) => {
      const char = characters[index % characters.length];
      const y = Math.floor(pos.y);
      const x = Math.floor(pos.x);
      
      // Only render if snowflake is visible on screen
      if (y >= 0 && y < terminalHeight && x >= 0 && x < terminalWidth) {
        gridArray[y][x] = char;
      }
    });

    return gridArray;
  }, [snowflakePositions, terminalWidth, terminalHeight, characters]);

  // Render the grid as text lines with color
  return (
    <Box flexDirection="column" position="absolute" width={terminalWidth} height={terminalHeight}>
      {grid.map((row, y) => (
        <Text key={y} color={displayColor}>{row.join("")}</Text>
      ))}
    </Box>
  );
};

const Happy = ({ terminalWidth }) => {
  const options = [
    "cristal",
    "teen",
    "mind",
    "morning",
    "vice",
    "passion",
    "fruit",
    "instagram",
    "atlas",
    "retro",
    "summer",
    "pastel",
    "rainbow",
  ];
  const [gradient, setGradient] = useState(options[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGradient(options[Math.floor(Math.random() * options.length)]);
    }, 100);
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount
  
  return (
    <Box flexDirection="column" alignItems="center" width={terminalWidth}>
      <Box width={terminalWidth} alignItems="center">
        <Gradient name={gradient}>
          <BigText text="HAPPY" align="center" />
          <BigText text="NEW YEAR" align="center" />
        </Gradient>
      </Box>
      <Text bold> 🎉 Have a good holiday! 🎉</Text>
    </Box>
  );
};

function startAppleMusic() {
  // I will have to share the Playlist ( Apple ) that we made for 2024. We may update it for the next year.
  const command = `osascript -e 'tell application "Music" to play playlist "NY 2024"'`;
  exec(command, function callback(error, stdout, stderr) {});
}

// Content component for countdown display
const CountdownContent = ({ 
  terminalWidth, 
  is_green, 
  hour, 
  minute, 
  second, 
  rotateFonts, 
  fontRotationOptions, 
  defaultFont, 
  rotateFrequency,
  color,
  rotateColors,
  colorRotationOptions,
  colorRotationFrequency
}) => {
  const [currentFont, setCurrentFont] = useState(defaultFont);
  const [fontIndex, setFontIndex] = useState(0);
  const [currentColor, setCurrentColor] = useState(null);
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    if (rotateFonts && fontRotationOptions && fontRotationOptions.length > 0) {
      // Set initial font
      setCurrentFont(fontRotationOptions[0]);
      setFontIndex(0);

      // Rotate fonts at configured frequency (convert seconds to milliseconds)
      const intervalMs = (rotateFrequency || 10) * 1000;
      const interval = setInterval(() => {
        setFontIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % fontRotationOptions.length;
          setCurrentFont(fontRotationOptions[nextIndex]);
          return nextIndex;
        });
      }, intervalMs);

      return () => clearInterval(interval);
    } else {
      // Use static font
      setCurrentFont(defaultFont);
    }
  }, [rotateFonts, fontRotationOptions, defaultFont, rotateFrequency]);

  useEffect(() => {
    if (rotateColors && colorRotationOptions && colorRotationOptions.length > 0) {
      // Set initial color
      setCurrentColor(colorRotationOptions[0]);
      setColorIndex(0);

      // Rotate colors at configured frequency (convert seconds to milliseconds)
      const intervalMs = (colorRotationFrequency || 5) * 1000;
      const interval = setInterval(() => {
        setColorIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % colorRotationOptions.length;
          setCurrentColor(colorRotationOptions[nextIndex]);
          return nextIndex;
        });
      }, intervalMs);

      return () => clearInterval(interval);
    } else if (color) {
      // Use static color
      setCurrentColor(color);
    } else {
      // Use default time-based color logic
      setCurrentColor(null);
    }
  }, [rotateColors, colorRotationOptions, color, colorRotationFrequency]);

  // Determine the color to use
  let displayColor;
  if (currentColor !== null) {
    displayColor = currentColor;
  } else {
    // Fall back to time-based logic (green/red)
    displayColor = is_green ? "green" : "red";
  }

  return (
    <Box flexDirection="column" alignItems="center" width={terminalWidth}>
      <Box width={terminalWidth} alignItems="center">
        <Text color={displayColor}>
          <BigText
            align="center"
            font={currentFont}
            text={`${hour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")}:${second.toString().padStart(2, "0")}`}
          />
        </Text>
      </Box>
      <Box marginTop={3} alignItems="center">
        <Text>
          <Spinner type="clock" /> Until{" "}
          <Text bold>{NEWYEAR.toDateString()}</Text>
        </Text>
      </Box>
    </Box>
  );
};

let said = {};
let finalCountDown = false;
let oneHourNotice = false;
let thirtyMinuteNotice = false;
function sayWords(hours, minutes, seconds) {
  if (oneHourNotice == false && hours == 1 && minutes == 0 && seconds == 0) {
    oneHourNotice = true;
    const command = `say One Hours to New Year Count Down Begins.!`;
    exec(command, function callback(error, stdout, stderr) {});
  }

  if (
    thirtyMinuteNotice === false &&
    hours == 0 &&
    minutes == 20 &&
    seconds == 0
  ) {
    thirtyMinuteNotice = true;
    const command = `say 20 minutes to New Year Count Down Begins.!`;
    exec(command, function callback(error, stdout, stderr) {});
  }

  if (finalCountDown == false && hours == 0 && minutes == 6 && seconds == 0) {
    finalCountDown = true;
    // play the final countdown
    // The file is _not_ in the repo. You'll need to add your own.
    const fileToPlay = '"./music/TheFinalCountdown.mp3"';
    const command = `afplay ${fileToPlay}`;
    exec(command, function callback(error, stdout, stderr) {});
  }

  const time = `${hours}:${minutes}:${seconds}`;

  if (!said[time] && hours == 0 && minutes == 0 && seconds == 30) {
    said[time] = time;
    const command = `say ${seconds} seconds to New Year Count Down Begins!`;
    exec(command, function callback(error, stdout, stderr) {});
  }

  if (
    !said[time] &&
    hours == 0 &&
    minutes == 0 &&
    seconds <= 10 &&
    seconds != 0
  ) {
    said[time] = time;
    const command = `say ${seconds}`;
    exec(command, function callback(error, stdout, stderr) {});
  }

  if (!said[time] && hours == 0 && minutes == 0 && seconds == 0) {
    said[time] = time;
    const happyNewYear = "Happy New Year!";
    const command = `say ${happyNewYear}`;
    exec(command, function callback(error, stdout, stderr) {});

    setTimeout(startAppleMusic, 1000);
  }
}

// Wrapper component to get terminal dimensions
const FullScreenWrapper = ({ children, enableSnowflakes, snowflakeCount, snowflakeOptions, snowflakeSpeed, snowflakeColor, snowflakeRotateColors, snowflakeColorRotationOptions, snowflakeColorRotationFrequency }) => {
  const [columns, rows] = useTerminalDimensions();
  
  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      position="relative"
    >
      {enableSnowflakes && (
        <FallingSnowflakes
          enabled={enableSnowflakes}
          count={snowflakeCount}
          characters={snowflakeOptions}
          terminalWidth={columns}
          terminalHeight={rows}
          speed={snowflakeSpeed}
          color={snowflakeColor}
          rotateColors={snowflakeRotateColors}
          colorRotationOptions={snowflakeColorRotationOptions}
          colorRotationFrequency={snowflakeColorRotationFrequency}
        />
      )}
      {React.cloneElement(children, { terminalWidth: columns })}
    </Box>
  );
};

class Countdown extends Component {
  constructor() {
    super();

    this.state = {
      time: new Date(),
    };
  }

  render() {
    try {
      const epoch_diff = (NEWYEAR - this.state.time) / 1000;
      const hour = Math.floor(epoch_diff / 60 / 60);
      const minute = Math.floor((epoch_diff / 60) % 60);
      const second = Math.floor(epoch_diff % 60);

      const is_green = minute != 0 || hour != 0;

      if (epoch_diff <= 0) {
        clearInterval(this.timer);
        return (
          <FullScreenWrapper
            enableSnowflakes={ENABLE_SNOWFLAKES}
            snowflakeCount={SNOWFLAKE_COUNT}
            snowflakeOptions={SNOWFLAKE_OPTIONS}
            snowflakeSpeed={SNOWFLAKE_SPEED}
            snowflakeColor={SNOWFLAKE_COLOR}
            snowflakeRotateColors={SNOWFLAKE_ROTATE_COLORS}
            snowflakeColorRotationOptions={SNOWFLAKE_COLOR_ROTATION_OPTIONS}
            snowflakeColorRotationFrequency={SNOWFLAKE_COLOR_ROTATION_FREQUENCY}
          >
            <Happy />
          </FullScreenWrapper>
        );
      }

      sayWords(hour.toString(), minute.toString(), second.toString());
      return (
        <FullScreenWrapper
          enableSnowflakes={ENABLE_SNOWFLAKES}
          snowflakeCount={SNOWFLAKE_COUNT}
          snowflakeOptions={SNOWFLAKE_OPTIONS}
          snowflakeSpeed={SNOWFLAKE_SPEED}
          snowflakeColor={SNOWFLAKE_COLOR}
          snowflakeRotateColors={SNOWFLAKE_ROTATE_COLORS}
          snowflakeColorRotationOptions={SNOWFLAKE_COLOR_ROTATION_OPTIONS}
          snowflakeColorRotationFrequency={SNOWFLAKE_COLOR_ROTATION_FREQUENCY}
        >
          <CountdownContent 
            is_green={is_green}
            hour={hour}
            minute={minute}
            second={second}
            rotateFonts={ROTATE_FONTS}
            fontRotationOptions={FONT_ROTATION_OPTIONS}
            defaultFont={COUNTDOWN_FONT}
            rotateFrequency={ROTATE_FREQUENCY}
            color={COUNTDOWN_COLOR}
            rotateColors={ROTATE_COLORS}
            colorRotationOptions={COLOR_ROTATION_OPTIONS}
            colorRotationFrequency={COLOR_ROTATION_FREQUENCY}
          />
        </FullScreenWrapper>
      );
    } catch (error) {
      console.error("[ERROR] Render error:", error);
      return (
        <FullScreenWrapper>
          <Box>
            <Text color="red">Error rendering: {error.message}</Text>
          </Box>
        </FullScreenWrapper>
      );
    }
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({
        time: new Date(),
      });
    }, 1000); // Update every second to reduce blinking
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }
}

try {
  render(<Countdown />);
} catch (error) {
  console.error("[ERROR] Failed to render:", error);
  console.error("[ERROR] Stack:", error.stack);
  process.exit(1);
}
