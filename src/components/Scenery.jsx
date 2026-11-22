'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * The night-time winter backdrop, back to front:
 *   sky -> stars -> moon -> (shooting stars) -> far mountains -> near mountains
 *   -> snowy ground -> pine trees (some with twinkling lights)
 *
 * Layout contract used by the characters and the snow:
 *   - the snowy ground fills the bottom ~26% of the screen (see HORIZON in
 *     src/lib/snow.js), so characters walk with their feet at ~4-14% from the
 *     bottom.
 *   - z-index: sky/mountains/ground 0-3, trees 4 (everything else sits above).
 */

function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 55,
      size: Math.random() * 2 + 0.8,
    });
  }
  return stars;
}

const LIGHT_COLORS = ['#ff5a5a', '#ffd24a', '#5ad2ff', '#8dff6a', '#ff8de6'];

// Trees along the horizon: x position (% of width), height (vh), lit or not.
const TREES = [
  { x: 4, h: 25, lit: true },
  { x: 13, h: 16 },
  { x: 21, h: 12 },
  { x: 33, h: 10 },
  { x: 63, h: 11 },
  { x: 74, h: 15 },
  { x: 85, h: 24, lit: true },
  { x: 94, h: 17 },
];

// Three stacked tiers of a pine: [apexY, baseY, halfWidth] in a 60x100 box.
const TIERS = [
  [4, 38, 22],
  [24, 62, 26],
  [44, 86, 30],
];

function Pine({ lit, seed }) {
  return (
    <svg viewBox="0 0 60 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <rect x="26" y="84" width="8" height="16" fill="#3b2a26" />
      {TIERS.map(([apex, base, half], i) => {
        const capBase = apex + (base - apex) * 0.42;
        const capHalf = half * 0.42;
        return (
          <g key={i}>
            <polygon
              points={`30,${apex} ${30 - half},${base} ${30 + half},${base}`}
              fill={i % 2 ? '#183d3a' : '#1b4540'}
            />
            {/* Snow resting on the tier's upper slopes, with a ragged hem. */}
            <polygon
              points={`30,${apex} ${30 - capHalf},${capBase} ${30 - capHalf * 0.5},${capBase - 2} ${30},${capBase + 1.5} ${30 + capHalf * 0.5},${capBase - 2} ${30 + capHalf},${capBase}`}
              fill="#e8f1fb"
            />
          </g>
        );
      })}
      {lit &&
        TIERS.flatMap(([apex, base, half], i) =>
          [0.55, 0.8].map((frac, j) => {
            const y = apex + (base - apex) * frac;
            const w = half * frac;
            const dir = (i + j) % 2 ? 1 : -1;
            const k = (seed + i * 2 + j) % LIGHT_COLORS.length;
            return (
              <circle
                key={`${i}-${j}`}
                className="tree-light"
                cx={30 + dir * w * 0.55}
                cy={y}
                r="1.7"
                fill={LIGHT_COLORS[k]}
                style={{ filter: `drop-shadow(0 0 2px ${LIGHT_COLORS[k]})` }}
              />
            );
          })
        )}
      {lit && <polygon points="30,-4 31.6,0 36,0.4 32.6,3 33.6,7.4 30,5 26.4,7.4 27.4,3 24,0.4 28.4,0" fill="#ffe27a" style={{ filter: 'drop-shadow(0 0 3px #ffd24a)' }} />}
    </svg>
  );
}

export default function Scenery() {
  const rootRef = useRef(null);
  const shootingRef = useRef(null);

  // Random star positions, generated once. (Generating them during render
  // would reshuffle every star each time the page re-renders, every second.)
  const [stars] = useState(() => generateStars(70));

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let timer = 0;

    const ctx = gsap.context(() => {
      // Twinkling stars
      gsap.utils.toArray('.star').forEach((star, index) => {
        gsap.to(star, {
          opacity: Math.random() * 0.5 + 0.2,
          duration: Math.random() * 2 + 1,
          repeat: -1,
          yoyo: true,
          delay: index * 0.1,
        });
      });

      // Twinkling tree lights
      gsap.utils.toArray('.tree-light').forEach((light) => {
        gsap.fromTo(
          light,
          { opacity: 0.25 },
          {
            opacity: 1,
            duration: 0.6 + Math.random() * 1.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 2,
          }
        );
      });

      // An occasional shooting star
      const shoot = () => {
        const el = shootingRef.current;
        if (!el) return;
        gsap.set(el, {
          left: `${35 + Math.random() * 55}%`,
          top: `${4 + Math.random() * 26}%`,
          x: 0,
          y: 0,
          opacity: 0,
        });
        gsap
          .timeline({ onComplete: schedule })
          .to(el, { opacity: 1, duration: 0.12 })
          .to(el, { x: -320, y: 128, duration: 0.9, ease: 'power1.in' }, 0)
          .to(el, { opacity: 0, duration: 0.35 }, 0.6);
      };
      const schedule = () => {
        timer = window.setTimeout(shoot, 9000 + Math.random() * 16000);
      };
      if (!reduced) timer = window.setTimeout(shoot, 4000 + Math.random() * 5000);
    }, rootRef);

    return () => {
      window.clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  const fill = (id, stops) => (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </linearGradient>
  );

  const layer = { position: 'absolute', left: 0, width: '100%' };

  return (
    <div ref={rootRef} className="scenery-container" aria-hidden="true">
      {/* Sky */}
      <div
        className="sky"
        style={{
          ...layer,
          top: 0,
          height: '100%',
          background:
            'linear-gradient(to bottom, #060c1d 0%, #0e1b38 35%, #223a64 68%, #3a5686 88%, #4b6a9a 100%)',
          zIndex: 0,
        }}
      />

      {/* Stars */}
      <div style={{ ...layer, top: 0, height: '100%', zIndex: 1 }}>
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

      {/* Moon */}
      <div
        className="moon"
        style={{
          position: 'absolute',
          left: '11%',
          top: '9%',
          width: 'clamp(56px, 7vw, 104px)',
          height: 'clamp(56px, 7vw, 104px)',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 34% 30%, rgba(150,160,180,0.35) 0 9%, transparent 10%),
            radial-gradient(circle at 62% 58%, rgba(150,160,180,0.3) 0 13%, transparent 14%),
            radial-gradient(circle at 44% 74%, rgba(150,160,180,0.28) 0 7%, transparent 8%),
            radial-gradient(circle at 38% 34%, #fffdf2 0%, #f3efd8 70%, #e2dcc0 100%)
          `,
          boxShadow: '0 0 30px 8px rgba(255,250,220,0.35), 0 0 120px 40px rgba(180,200,255,0.18)',
          zIndex: 1,
        }}
      />

      {/* Shooting star (positioned and animated from the effect above) */}
      <div
        ref={shootingRef}
        style={{
          position: 'absolute',
          width: 120,
          height: 2,
          opacity: 0,
          borderRadius: 2,
          background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0))',
          transform: 'rotate(-22deg)',
          zIndex: 1,
        }}
      />

      {/* Mountains and ground share one gradient palette */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {fill('mtn-far', [
            [0, '#dce8f6'],
            [0.2, '#a9bddb'],
            [0.45, '#586f9b'],
            [1, '#33466e'],
          ])}
          {fill('mtn-near', [
            [0, '#cfe0f2'],
            [0.18, '#8da6c9'],
            [0.5, '#44597f'],
            [1, '#2b3c60'],
          ])}
          {fill('ground', [
            [0, '#d3e2f3'],
            [0.3, '#9db5d6'],
            [1, '#566f9a'],
          ])}
          {fill('ground-shade', [
            [0, '#b5c9e4'],
            [1, '#4c6590'],
          ])}
        </defs>
      </svg>

      {/* Far mountains */}
      <svg
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        style={{ ...layer, bottom: '20%', height: '30%', zIndex: 1 }}
      >
        <path
          d="M0,100 L0,64 L70,40 L130,58 L230,18 L320,52 L410,32 L500,62 L600,24 L700,52 L790,30 L880,58 L1000,34 L1000,100 Z"
          fill="url(#mtn-far)"
        />
      </svg>

      {/* Near mountains */}
      <svg
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        style={{ ...layer, bottom: '19%', height: '22%', zIndex: 2 }}
      >
        <path
          d="M0,100 L0,52 L110,34 L200,60 L310,28 L420,62 L520,42 L640,66 L740,34 L850,60 L930,40 L1000,58 L1000,100 Z"
          fill="url(#mtn-near)"
        />
      </svg>

      {/* Snowy ground: a lit back drift and a darker front drift */}
      <svg
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        style={{ ...layer, bottom: 0, height: '27%', zIndex: 3 }}
      >
        <path
          d="M0,26 C120,8 260,32 400,20 C540,8 680,34 820,18 C900,10 960,20 1000,16 L1000,100 L0,100 Z"
          fill="url(#ground)"
        />
        <path
          d="M0,62 C150,44 300,70 480,56 C660,42 820,68 1000,52 L1000,100 L0,100 Z"
          fill="url(#ground-shade)"
          opacity="0.55"
        />
      </svg>

      {/* Pine trees standing on the back edge of the ground */}
      {TREES.map((tree, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${tree.x}%`,
            bottom: `${19.5 - (i % 3) * 0.8}%`,
            height: `${tree.h}vh`,
            width: `${tree.h * 0.6}vh`,
            transform: 'translateX(-50%)',
            zIndex: 4,
          }}
        >
          <Pine lit={tree.lit} seed={i} />
        </div>
      ))}
    </div>
  );
}
