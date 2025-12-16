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

    // Create snowflake elements with more natural properties
    for (let i = 0; i < Math.min(count, 200); i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.textContent = options[Math.floor(Math.random() * options.length)];
      
      const startX = Math.random() * windowWidth;
      const startY = -20 - Math.random() * 200; // Start at varying heights
      
      // More natural speed variation (smaller flakes fall slower)
      const size = Math.random() * 0.6 + 0.4; // 0.4 to 1.0
      const baseSpeed = speed * (0.7 + size * 0.6); // Larger = faster, but more variation
      const fallSpeed = baseSpeed + (Math.random() * speed * 0.3);
      
      // Natural wind/drift effect (varies per snowflake)
      const windStrength = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75
      const windVariation = Math.random() * 0.3 + 0.1; // How much wind varies
      
      // Opacity based on size (smaller = more transparent)
      const opacity = 0.4 + (size * 0.4); // 0.4 to 0.8
      
      snowflake.style.position = 'absolute';
      snowflake.style.left = `${startX}px`;
      snowflake.style.top = `${startY}px`;
      snowflake.style.fontSize = `${size * 1.5}em`;
      snowflake.style.color = color;
      snowflake.style.opacity = opacity;
      snowflake.style.pointerEvents = 'none';
      snowflake.style.userSelect = 'none';
      snowflake.style.zIndex = '10';
      snowflake.style.transformOrigin = 'center center';
      
      container.appendChild(snowflake);
      snowflakes.push({ 
        element: snowflake, 
        windStrength, 
        windVariation,
        fallSpeed,
        size,
        startX 
      });
    }

    snowflakesRef.current = snowflakes;

    // Animate each snowflake with more natural physics
    snowflakes.forEach((snowflake, index) => {
      const { element, windStrength, windVariation, fallSpeed, size, startX } = snowflake;
      
      // Create a timeline for more complex animation
      const timeline = gsap.timeline({ repeat: -1 });
      
      // Falling animation with natural easing (simulates gravity/air resistance)
      // Using "power1.out" for natural deceleration, or "sine.inOut" for gentle sway
      const fallDuration = fallSpeed / 1000;
      
      // Horizontal drift with wind variation (sine wave pattern)
      const driftDistance = windStrength * (windowWidth * 0.3); // Max 30% of screen width
      
      // Falling with natural physics
      timeline.to(element, {
        y: windowHeight + 100,
        x: `+=${driftDistance}`,
        duration: fallDuration,
        ease: 'power1.out', // Natural deceleration
        onComplete: () => {
          // Reset position when off-screen
          const newX = Math.random() * windowWidth;
          gsap.set(element, {
            x: newX,
            y: -20 - Math.random() * 100,
          });
        },
      });
      
      // Add rotation/tumbling effect (more rotation for larger flakes)
      gsap.to(element, {
        rotation: 360 * (Math.random() > 0.5 ? 1 : -1), // Random direction
        duration: fallDuration * (0.8 + Math.random() * 0.4), // Vary rotation speed
        ease: 'none',
        repeat: -1,
      });
      
      // Add subtle horizontal sway (wind effect) - sine wave pattern
      const swayAmount = windVariation * 30; // Max 30px sway
      gsap.to(element, {
        x: `+=${swayAmount}`,
        duration: 2 + Math.random() * 2, // 2-4 seconds per sway cycle
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      
      // Add subtle scale pulsing (like twinkling)
      gsap.to(element, {
        scale: 0.9 + Math.random() * 0.2, // 0.9 to 1.1
        duration: 1.5 + Math.random() * 1, // 1.5-2.5 seconds
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      
      // Store animation references
      snowflake.timeline = timeline;
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
          ease: 'sine.inOut', // Smooth color transitions
        });
      });

      colorTimelineRef.current = colorTimeline;
    }

    // Handle window resize
    const handleResize = () => {
      snowflakes.forEach(snowflake => {
        if (snowflake.timeline) {
          snowflake.timeline.kill();
        }
        // Recreate animations with new dimensions
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        const { element, windStrength, fallSpeed } = snowflake;
        
        const newTimeline = gsap.timeline({ repeat: -1 });
        newTimeline.to(element, {
          y: newHeight + 100,
          x: `+=${windStrength * (newWidth * 0.3)}`,
          duration: fallSpeed / 1000,
          ease: 'power1.out',
          onComplete: () => {
            gsap.set(element, {
              x: Math.random() * newWidth,
              y: -20,
            });
          },
        });
        snowflake.timeline = newTimeline;
      });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      snowflakes.forEach(snowflake => {
        if (snowflake.timeline) {
          snowflake.timeline.kill();
        }
        // Kill all GSAP animations on this element
        gsap.killTweensOf(snowflake.element);
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
