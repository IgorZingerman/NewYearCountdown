'use client';

import { useEffect, useState } from 'react';
import {
  moonGeometry,
  moonIllumination,
  moonPhase,
  moonPhaseForCountdown,
  moonPhaseName,
} from '../lib/moon';

/**
 * The moon. Its phase follows the countdown: a crescent when New Year is far
 * away, getting fuller every day and full at midnight (falls back to the real
 * current phase if there is no valid target date).
 * The dark part is a faint earthshine disc, the lit part is a clipped shape
 * whose edge (the terminator) follows the phase, and craters only appear on
 * the lit side.
 */

const CRATERS = [
  { x: -0.38, y: -0.3, r: 0.2 },
  { x: 0.2, y: -0.42, r: 0.12 },
  { x: 0.42, y: 0.08, r: 0.22 },
  { x: -0.12, y: 0.22, r: 0.16 },
  { x: -0.5, y: 0.38, r: 0.1 },
  { x: 0.1, y: 0.6, r: 0.09 },
];

function currentPhase(targetDate) {
  return moonPhaseForCountdown(targetDate) ?? moonPhase();
}

export default function Moon({ targetDate, size = 'clamp(56px, 7vw, 104px)', left = '11%', top = '9%' }) {
  const [phase, setPhase] = useState(() => currentPhase(targetDate));

  // The phase moves slowly, so refreshing once a minute is plenty.
  useEffect(() => {
    setPhase(currentPhase(targetDate));
    const id = window.setInterval(() => setPhase(currentPhase(targetDate)), 60000);
    return () => window.clearInterval(id);
  }, [targetDate]);

  const { waxing, u } = moonGeometry(phase);
  const lit = moonIllumination(phase);

  // The lit part: outer limb on the lit side, then the terminator back.
  const outerSweep = waxing ? 1 : 0;
  const termSweep = u > 0 ? 0 : 1;
  const litPath = `M0,-1 A1,1 0 0 ${outerSweep} 0,1 A${Math.abs(u)},1 0 0 ${termSweep} 0,-1 Z`;

  return (
    <div
      className="moon"
      role="img"
      aria-label={`${moonPhaseName(phase)} (${Math.round(lit * 100)}% lit)`}
      title={moonPhaseName(phase)}
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        zIndex: 1,
        filter: `drop-shadow(0 0 ${Math.round(10 + 28 * lit)}px rgba(255,250,220,${(0.15 + 0.3 * lit).toFixed(2)}))`,
      }}
    >
      <svg viewBox="-1 -1 2 2" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <clipPath id="moon-lit">
            <path d={litPath} />
          </clipPath>
          <radialGradient id="moon-face" cx="-0.3" cy="-0.35" r="1.1">
            <stop offset="0" stopColor="#fffdf2" />
            <stop offset="0.7" stopColor="#f3efd8" />
            <stop offset="1" stopColor="#e2dcc0" />
          </radialGradient>
        </defs>

        {/* Dark side, with faint earthshine */}
        <circle r="1" fill="#16203a" />
        <circle r="0.995" fill="none" stroke="rgba(160,180,230,0.12)" strokeWidth="0.01" />

        {/* Lit side */}
        <g clipPath="url(#moon-lit)">
          <circle r="1" fill="url(#moon-face)" />
          {CRATERS.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r={c.r} fill="rgba(150,160,180,0.3)" />
              <circle cx={c.x + c.r * 0.12} cy={c.y + c.r * 0.12} r={c.r * 0.7} fill="rgba(255,255,255,0.12)" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
