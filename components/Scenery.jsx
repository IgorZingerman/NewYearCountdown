'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Scenery() {
  const skyRef = useRef(null);
  const mountainsRef = useRef(null);
  const starsRef = useRef(null);

  useEffect(() => {
    // Animate stars twinkling
    if (starsRef.current) {
      const stars = starsRef.current.querySelectorAll('.star');
      stars.forEach((star, index) => {
        gsap.to(star, {
          opacity: Math.random() * 0.5 + 0.3,
          duration: Math.random() * 2 + 1,
          repeat: -1,
          yoyo: true,
          delay: index * 0.2,
        });
      });
    }

    // Subtle parallax effect on mountains
    if (mountainsRef.current) {
      gsap.to(mountainsRef.current, {
        y: -10,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }, []);

  // Generate random star positions
  const generateStars = (count) => {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 50,
        size: Math.random() * 2 + 1,
      });
    }
    return stars;
  };

  const stars = generateStars(50);

  return (
    <div className="scenery-container">
      {/* Sky gradient */}
      <div
        ref={skyRef}
        className="sky"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '60%',
          background: 'linear-gradient(to bottom, #0a1628 0%, #1a2a3a 50%, #2a3a4a 100%)',
          zIndex: 0,
        }}
      />

      {/* Stars */}
      <div
        ref={starsRef}
        className="stars"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '60%',
          zIndex: 1,
        }}
      >
        {stars.map((star, index) => (
          <div
            key={index}
            className="star"
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* Mountain silhouette */}
      <div
        ref={mountainsRef}
        className="mountains"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '50%',
          background: `
            linear-gradient(to top, #1a1a2e 0%, #2a2a3e 30%, #1a1a2e 60%, #0a0a1e 100%)
          `,
          clipPath: 'polygon(0% 100%, 10% 80%, 20% 85%, 30% 70%, 40% 75%, 50% 60%, 60% 65%, 70% 55%, 80% 60%, 90% 50%, 100% 55%, 100% 100%)',
          zIndex: 2,
        }}
      />

      {/* Additional mountain layer for depth */}
      <div
        className="mountains-back"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '40%',
          background: `
            linear-gradient(to top, #0a0a1e 0%, #1a1a2e 50%, #0a0a1e 100%)
          `,
          clipPath: 'polygon(0% 100%, 15% 90%, 25% 85%, 35% 80%, 45% 75%, 55% 70%, 65% 75%, 75% 70%, 85% 65%, 100% 70%, 100% 100%)',
          zIndex: 1,
          opacity: 0.7,
        }}
      />
    </div>
  );
}
