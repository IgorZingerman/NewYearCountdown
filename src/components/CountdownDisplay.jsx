'use client';

import { useState, useEffect } from 'react';

const COLOR_MAP = {
  cyan: '#00ffff',
  magenta: '#ff00ff',
  yellow: '#ffff00',
  blue: '#0080ff',
  green: '#00ff00',
  red: '#ff0000',
  white: '#ffffff',
  gray: '#808080',
};

export default function CountdownDisplay({
  hours,
  minutes,
  seconds,
  isExpired,
  targetDate,
  celebrationMessage = "🎉 Happy New Year! 🎉",
  rotateFonts = false,
  fontRotationOptions = [],
  defaultFont = 'huge',
  rotateFrequency = 10,
  color = null,
  rotateColors = false,
  colorRotationOptions = [],
  colorRotationFrequency = 5,
  isGreen = true,
}) {
  const [currentFont, setCurrentFont] = useState(defaultFont);
  const [fontIndex, setFontIndex] = useState(0);
  const [currentColor, setCurrentColor] = useState(null);
  const [colorIndex, setColorIndex] = useState(0);

  // Font rotation logic
  useEffect(() => {
    if (rotateFonts && fontRotationOptions && fontRotationOptions.length > 0) {
      setCurrentFont(fontRotationOptions[0]);
      setFontIndex(0);

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
      setCurrentFont(defaultFont);
    }
  }, [rotateFonts, fontRotationOptions, defaultFont, rotateFrequency]);

  // Color rotation logic
  useEffect(() => {
    if (rotateColors && colorRotationOptions && colorRotationOptions.length > 0) {
      setCurrentColor(colorRotationOptions[0]);
      setColorIndex(0);

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
      setCurrentColor(color);
    } else {
      setCurrentColor(null);
    }
  }, [rotateColors, colorRotationOptions, color, colorRotationFrequency]);

  // Determine display color
  let displayColor;
  if (currentColor !== null) {
    displayColor = COLOR_MAP[currentColor] || currentColor;
  } else {
    displayColor = isGreen ? COLOR_MAP.green : COLOR_MAP.red;
  }

  if (isExpired) {
    return (
      <div className="countdown-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '4rem', color: displayColor, marginBottom: '1rem' }}>
          {celebrationMessage}
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#cccccc' }}>
          Welcome to {new Date(targetDate).getFullYear()}!
        </p>
      </div>
    );
  }

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Font style mapping - using CSS for different visual styles
  const getFontStyle = (fontName) => {
    const styles = {
      huge: { fontSize: 'clamp(4rem, 15vw, 10rem)', fontWeight: '900', letterSpacing: '0.1em' },
      slick: { fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: '300', letterSpacing: '0.2em' },
      tiny: { fontSize: 'clamp(2rem, 8vw, 5rem)', fontWeight: '400', letterSpacing: '0.05em' },
      grid: { fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: '700', letterSpacing: '0.15em', fontFamily: 'monospace' },
      block: { fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: '900', letterSpacing: '0.1em' },
      simple: { fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: '400', letterSpacing: '0.1em' },
      '3d': { fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: '900', letterSpacing: '0.1em', textShadow: '3px 3px 0px rgba(0,0,0,0.5)' },
    };
    return styles[fontName] || styles.huge;
  };

  return (
    <div className="countdown-container" style={{ textAlign: 'center', padding: '2rem', zIndex: 20, position: 'relative' }}>
      <div
        className="countdown-text"
        style={{
          ...getFontStyle(currentFont),
          color: displayColor,
          fontFamily: 'monospace',
          textShadow: '0 0 20px rgba(0,255,255,0.3)',
          transition: 'color 0.5s ease',
        }}
      >
        {timeString}
      </div>
      <div style={{ marginTop: '2rem', fontSize: '1.2rem', color: '#cccccc' }}>
        Until {(() => {
          const date = new Date(targetDate);
          // Use UTC date components to avoid timezone conversion issues
          // This ensures the date displayed matches what the user selected
          const year = date.getUTCFullYear();
          const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
          const day = date.getUTCDate();
          return `${month} ${day}, ${year}`;
        })()}
      </div>
    </div>
  );
}
