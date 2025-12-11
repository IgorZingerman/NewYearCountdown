'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Snowflakes({
  enabled = true,
  count = 40,
  speed = 350,
  options = ["❄", "❅", "❆", "✻", "✼", "✽", "✾", "✿", "❀", "❁"],
  color = "white",
  rotateColors = false,
  colorRotationOptions = ["cyan", "blue", "white", "gray"],
  colorRotationFrequency = 3,
}) {
  const containerRef = useRef(null);
  const snowflakesRef = useRef([]);
  const colorTimelineRef = useRef(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const snowflakes = [];

    // Create snowflake elements
    for (let i = 0; i < Math.min(count, 200); i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.textContent = options[Math.floor(Math.random() * options.length)];
      
      const startX = Math.random() * windowWidth;
      const startY = -20 - Math.random() * 100;
      const fallSpeed = speed + (Math.random() * speed * 0.5); // Vary speed
      const drift = (Math.random() - 0.5) * 2; // Horizontal drift
      const size = Math.random() * 0.5 + 0.5; // Size variation
      
      snowflake.style.position = 'absolute';
      snowflake.style.left = `${startX}px`;
      snowflake.style.top = `${startY}px`;
      snowflake.style.fontSize = `${size * 1.5}em`;
      snowflake.style.color = color;
      snowflake.style.opacity = Math.random() * 0.5 + 0.5;
      snowflake.style.pointerEvents = 'none';
      snowflake.style.userSelect = 'none';
      snowflake.style.zIndex = '10';
      
      container.appendChild(snowflake);
      snowflakes.push({ element: snowflake, drift, fallSpeed });
    }

    snowflakesRef.current = snowflakes;

    // Animate each snowflake falling
    snowflakes.forEach((snowflake, index) => {
      const { element, drift, fallSpeed } = snowflake;
      
      // Create falling animation with drift
      const fallAnimation = gsap.to(element, {
        y: windowHeight + 100,
        x: `+=${drift * 200}`,
        duration: fallSpeed / 1000,
        ease: 'none',
        repeat: -1,
        onRepeat: () => {
          // Reset position when off-screen
          gsap.set(element, {
            x: Math.random() * windowWidth,
            y: -20,
          });
        },
      });

      // Store animation reference
      snowflake.animation = fallAnimation;
    });

    // Color rotation animation
    if (rotateColors && colorRotationOptions.length > 0) {
      const colorMap = {
        cyan: '#00ffff',
        magenta: '#ff00ff',
        yellow: '#ffff00',
        blue: '#0080ff',
        green: '#00ff00',
        red: '#ff0000',
        white: '#ffffff',
        gray: '#808080',
      };

      const colorTimeline = gsap.timeline({ repeat: -1 });
      colorRotationOptions.forEach((colorOption, index) => {
        colorTimeline.to(snowflakes.map(s => s.element), {
          color: colorMap[colorOption] || colorOption,
          duration: colorRotationFrequency / colorRotationOptions.length,
          ease: 'none',
        });
      });

      colorTimelineRef.current = colorTimeline;
    }

    // Cleanup
    return () => {
      snowflakes.forEach(snowflake => {
        if (snowflake.animation) {
          snowflake.animation.kill();
        }
      });
      if (colorTimelineRef.current) {
        colorTimelineRef.current.kill();
      }
      snowflakes.forEach(snowflake => {
        if (snowflake.element.parentNode) {
          snowflake.element.parentNode.removeChild(snowflake.element);
        }
      });
    };
  }, [enabled, count, speed, options, color, rotateColors, colorRotationOptions, colorRotationFrequency]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="snowflakes-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
