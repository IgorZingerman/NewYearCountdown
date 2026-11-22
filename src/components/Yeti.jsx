'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function Yeti({ celebrating = false }) {
  const yetiRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const [position, setPosition] = useState(-100); // Start off-screen left

  useEffect(() => {
    if (!yetiRef.current) return;

    const yeti = yetiRef.current;

    // Midnight! Stop walking and celebrate instead.
    if (celebrating) {
      const leftArm = leftArmRef.current;
      const rightArm = rightArmRef.current;
      // The yeti's `left` is -100px, so its on-screen x is (gsap x - 100).
      // Center it horizontally on the screen.
      const centerX = window.innerWidth / 2 - 40 + 100;

      gsap.set(yeti, { transformOrigin: '50% 100%' });

      const party = gsap.timeline();

      // Run to the middle of the screen with little bounces
      party.to(yeti, { x: centerX, duration: 1.5, ease: 'power2.inOut' }, 0);
      party.to(
        yeti,
        { y: -8, rotation: 3, duration: 0.15, yoyo: true, repeat: 9, ease: 'sine.inOut' },
        0
      );

      party.addLabel('cheer', 1.5);

      // Both arms up, then wave them
      party.to(
        leftArm,
        { rotation: 150, svgOrigin: '18 42', duration: 0.4, ease: 'back.out(2)' },
        'cheer'
      );
      party.to(
        rightArm,
        { rotation: -150, svgOrigin: '62 42', duration: 0.4, ease: 'back.out(2)' },
        'cheer'
      );
      party.to(
        leftArm,
        { rotation: 125, svgOrigin: '18 42', duration: 0.22, yoyo: true, repeat: -1, ease: 'sine.inOut' },
        'cheer+=0.4'
      );
      party.to(
        rightArm,
        { rotation: -125, svgOrigin: '62 42', duration: 0.22, yoyo: true, repeat: -1, ease: 'sine.inOut' },
        'cheer+=0.4'
      );

      // Jump for joy with squash & stretch
      const jumps = gsap.timeline({ repeat: -1 });
      jumps
        .to(yeti, { scaleX: 1.1, scaleY: 0.88, duration: 0.12, ease: 'power1.out' }) // crouch
        .to(yeti, { y: -60, scaleX: 0.94, scaleY: 1.1, rotation: 5, duration: 0.4, ease: 'power2.out' })
        .to(yeti, { y: 0, scaleX: 1, scaleY: 1, rotation: -5, duration: 0.4, ease: 'power2.in' })
        .to(yeti, { scaleX: 1.12, scaleY: 0.86, rotation: 0, duration: 0.1, ease: 'power1.out' }) // land
        .to(yeti, { scaleX: 1, scaleY: 1, duration: 0.12, ease: 'power1.in' });
      party.add(jumps, 'cheer');

      return () => {
        party.kill();
        jumps.kill();
        gsap.killTweensOf([yeti, leftArm, rightArm]);
        gsap.set(yeti, { y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
        gsap.set([leftArm, rightArm], { rotation: 0 });
      };
    }

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
  }, [celebrating]);

  return (
    <div
      ref={yetiRef}
      className="yeti"
      style={{
        position: 'absolute',
        bottom: '8%',
        left: `${position}px`,
        width: '80px',
        height: '120px',
        zIndex: 6, // above the fireworks canvas (5)
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
        
        {/* Arms - more rounded (grouped so they can be raised when celebrating) */}
        <g ref={leftArmRef}>
          <ellipse cx="18" cy="62" rx="9" ry="28" fill="#f8f8f8" />
          <ellipse cx="18" cy="62" rx="7" ry="26" fill="#ffffff" />
          {/* Hand */}
          <circle cx="18" cy="88" r="6" fill="#ffffff" />
        </g>
        <g ref={rightArmRef}>
          <ellipse cx="62" cy="62" rx="9" ry="28" fill="#f8f8f8" />
          <ellipse cx="62" cy="62" rx="7" ry="26" fill="#ffffff" />
          {/* Hand */}
          <circle cx="62" cy="88" r="6" fill="#ffffff" />
        </g>
        
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
