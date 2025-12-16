'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function Yeti() {
  const yetiRef = useRef(null);
  const [position, setPosition] = useState(-100); // Start off-screen left

  useEffect(() => {
    if (!yetiRef.current) return;

    const yeti = yetiRef.current;
    const windowWidth = window.innerWidth;

    // Create walking animation timeline
    const walkTimeline = gsap.timeline({ repeat: -1 });
    
    // Simple walking animation using CSS transforms
    // In a real implementation, you'd swap sprite frames here
    walkTimeline.to(yeti, {
      transform: 'translateY(-5px)',
      duration: 0.3,
      ease: 'power1.inOut',
    }).to(yeti, {
      transform: 'translateY(0px)',
      duration: 0.3,
      ease: 'power1.inOut',
    });

    // Horizontal movement - walk across screen
    const moveTimeline = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        // Reset position when off-screen right
        setPosition(-100);
      },
    });

    moveTimeline.to(yeti, {
      x: windowWidth + 100,
      duration: 20, // Time to cross screen
      ease: 'none',
    });

    return () => {
      walkTimeline.kill();
      moveTimeline.kill();
    };
  }, []);

  return (
    <div
      ref={yetiRef}
      className="yeti"
      style={{
        position: 'absolute',
        bottom: '20%',
        left: `${position}px`,
        width: '80px',
        height: '120px',
        zIndex: 3,
        transform: 'scaleX(-1)', // Face right
      }}
    >
      {/* Yeti SVG representation - replace with sprite sheet in production */}
      <svg
        width="80"
        height="120"
        viewBox="0 0 80 120"
        style={{ display: 'block' }}
      >
        {/* Body */}
        <ellipse cx="40" cy="70" rx="25" ry="35" fill="#f0f0f0" />
        {/* Head */}
        <circle cx="40" cy="30" r="20" fill="#f0f0f0" />
        {/* Eyes */}
        <circle cx="35" cy="28" r="3" fill="#000" />
        <circle cx="45" cy="28" r="3" fill="#000" />
        {/* Arms */}
        <ellipse cx="20" cy="60" rx="8" ry="25" fill="#f0f0f0" />
        <ellipse cx="60" cy="60" rx="8" ry="25" fill="#f0f0f0" />
        {/* Legs */}
        <ellipse cx="30" cy="100" rx="10" ry="20" fill="#f0f0f0" />
        <ellipse cx="50" cy="100" rx="10" ry="20" fill="#f0f0f0" />
      </svg>
    </div>
  );
}
