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

    // Create cute waddling animation
    const walkTimeline = gsap.timeline({ repeat: -1 });
    
    // Waddling motion - side to side sway with bounce (5% more waddle)
    walkTimeline
      .to(yeti, {
        y: -6.3,
        x: 3.15,
        rotation: 3.15,
        duration: 0.3,
        ease: 'power1.inOut',
      })
      .to(yeti, {
        y: 0,
        x: 0,
        rotation: 0,
        duration: 0.3,
        ease: 'power1.inOut',
      })
      .to(yeti, {
        y: -6.3,
        x: -3.15,
        rotation: -3.15,
        duration: 0.3,
        ease: 'power1.inOut',
      })
      .to(yeti, {
        y: 0,
        x: 0,
        rotation: 0,
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
        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
      }}
    >
      {/* Cute Yeti SVG */}
      <svg
        width="80"
        height="120"
        viewBox="0 0 80 120"
        style={{ display: 'block' }}
      >
        {/* Body - chubbier and rounder */}
        <ellipse cx="40" cy="75" rx="28" ry="38" fill="#f8f8f8" />
        <ellipse cx="40" cy="75" rx="26" ry="36" fill="#ffffff" />
        
        {/* Belly */}
        <ellipse cx="40" cy="78" rx="18" ry="22" fill="#f0f0f0" />
        
        {/* Head - bigger and rounder */}
        <circle cx="40" cy="28" r="22" fill="#ffffff" />
        <circle cx="40" cy="28" r="20" fill="#f8f8f8" />
        
        {/* Rosy cheeks */}
        <ellipse cx="28" cy="32" rx="5" ry="4" fill="#ffb3ba" opacity="0.6" />
        <ellipse cx="52" cy="32" rx="5" ry="4" fill="#ffb3ba" opacity="0.6" />
        
        {/* Eyes - bigger and cuter with highlights */}
        <ellipse cx="33" cy="26" rx="5" ry="6" fill="#000" />
        <ellipse cx="47" cy="26" rx="5" ry="6" fill="#000" />
        {/* Eye highlights */}
        <ellipse cx="34" cy="24" rx="2" ry="2.5" fill="#ffffff" />
        <ellipse cx="48" cy="24" rx="2" ry="2.5" fill="#ffffff" />
        
        {/* Friendly smile */}
        <path
          d="M 30 36 Q 40 42 50 36"
          stroke="#000"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Arms - more rounded */}
        <ellipse cx="18" cy="62" rx="9" ry="28" fill="#f8f8f8" />
        <ellipse cx="18" cy="62" rx="7" ry="26" fill="#ffffff" />
        <ellipse cx="62" cy="62" rx="9" ry="28" fill="#f8f8f8" />
        <ellipse cx="62" cy="62" rx="7" ry="26" fill="#ffffff" />
        
        {/* Hands */}
        <circle cx="18" cy="88" r="6" fill="#ffffff" />
        <circle cx="62" cy="88" r="6" fill="#ffffff" />
        
        {/* Legs - chubbier */}
        <ellipse cx="28" cy="105" rx="11" ry="22" fill="#f8f8f8" />
        <ellipse cx="28" cy="105" rx="9" ry="20" fill="#ffffff" />
        <ellipse cx="52" cy="105" rx="11" ry="22" fill="#f8f8f8" />
        <ellipse cx="52" cy="105" rx="9" ry="20" fill="#ffffff" />
        
        {/* Feet */}
        <ellipse cx="28" cy="118" rx="10" ry="4" fill="#e0e0e0" />
        <ellipse cx="52" cy="118" rx="10" ry="4" fill="#e0e0e0" />
      </svg>
    </div>
  );
}
