'use client';

import Actor from './Actor';
import { GOLD, INK, OUTLINE, PINK, RED, Shadow, line } from './art';
import { createBlinker, tf } from '../../lib/pose';
import { ground } from '../../lib/world';

/**
 * A snowman who stands still all night... until midnight, when he comes alive,
 * bounces and waves his twig arms. Click him and he tips his hat.
 */

const VIEW_BOX = '0 0 100 140';
const TWIG = '#6b4a32';
const COAL = INK;

function Art() {
  return (
    <>
      <Shadow cx={50} cy={136} rx={34} ry={4} />
      <g data-part="root">
        <defs>
          <radialGradient id="snowman-ball" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.7" stopColor="#eef5ff" />
            <stop offset="1" stopColor="#c4d8f0" />
          </radialGradient>
        </defs>

        {/* Twig arms (behind the body at the shoulders) */}
        <g data-part="armL">
          <path d="M33,70 L9,57 M17,61 L11,48 M21,63 L7,65" fill="none" stroke={TWIG} strokeWidth="3.2" strokeLinecap="round" />
        </g>
        <g data-part="armR">
          <path d="M67,70 L91,57 M83,61 L89,48 M79,63 L93,65" fill="none" stroke={TWIG} strokeWidth="3.2" strokeLinecap="round" />
        </g>

        {/* Three snowballs */}
        <circle cx="50" cy="108" r="27" fill="url(#snowman-ball)" {...line} />
        <circle cx="50" cy="72" r="21" fill="url(#snowman-ball)" {...line} />
        <circle cx="50" cy="38" r="16.5" fill="url(#snowman-ball)" {...line} />

        <circle cx="50" cy="64" r="2.6" fill={COAL} />
        <circle cx="50" cy="74" r="2.6" fill={COAL} />
        <circle cx="50" cy="98" r="2.8" fill={COAL} />

        {/* Face */}
        <g data-part="face">
          <g data-part="eyes">
            <circle cx="43" cy="35" r="2.5" fill={COAL} />
            <circle cx="57" cy="35" r="2.5" fill={COAL} />
          </g>
          <ellipse cx="38" cy="42" rx="3.4" ry="2.2" fill={PINK} opacity="0.55" />
          <ellipse cx="62" cy="42" rx="3.4" ry="2.2" fill={PINK} opacity="0.55" />
          <g data-part="nose">
            <polygon points="48,39 71,42.5 48,46" fill="#ff8a2a" stroke="#c85a10" strokeWidth="1.4" strokeLinejoin="round" />
          </g>
          <g fill={COAL}>
            <circle cx="40.5" cy="47.5" r="1.4" />
            <circle cx="44" cy="50" r="1.4" />
            <circle cx="49" cy="51" r="1.4" />
            <circle cx="54" cy="51" r="1.4" />
            <circle cx="59" cy="50" r="1.4" />
            <circle cx="62.5" cy="47.5" r="1.4" />
          </g>
        </g>

        {/* Scarf */}
        <path d="M33,52 Q50,62 67,52 L68,60 Q50,70 32,60 Z" fill={RED} {...line} strokeWidth="1.8" />
        <path d="M42,57 L41,66 M52,59 L51.5,68 M61,57.5 L61.5,65" stroke="#ffffff" strokeWidth="2.6" fill="none" />
        <g data-part="scarfTail">
          <path d="M58,58 L71,62 L73,86 L62,84 Z" fill={RED} {...line} strokeWidth="1.8" />
          <path d="M60.5,74 L72.2,77.5 L72.6,81.5 L61.5,79 Z" fill="#ffffff" />
          <path d="M62,85 v3.5 M66,86 v3.5 M70,86.5 v3.5" {...line} strokeWidth="1.5" fill="none" />
        </g>

        {/* Top hat */}
        <g data-part="hat">
          <rect x="37" y="2" width="26" height="20" rx="2.5" fill="#232a3d" {...line} />
          <rect x="37" y="14" width="26" height="6" fill={RED} />
          <rect x="47" y="13.5" width="6" height="7" fill={GOLD} stroke={OUTLINE} strokeWidth="1" />
          <ellipse cx="50" cy="22" rx="23" ry="4.6" fill="#232a3d" {...line} />
        </g>
      </g>
    </>
  );
}

const LINES = ['Hello!', "I'm not melting!", 'Hug me?', 'Nice hat, right?', 'Brrr... perfect!'];

function createSnowman({ parts, api }) {
  const rand = Math.random;
  const blink = createBlinker(rand, [1.5, 3.5]);
  let hatT = 0;
  let wasCelebrating = false;

  const set = (name, value) => parts[name]?.setAttribute('transform', value);

  return {
    onClick() {
      api.say(LINES[Math.floor(rand() * LINES.length)]);
      hatT = 1.5;
    },

    tick(dt, t, env) {
      const alive = env.celebrating;
      if (alive !== wasCelebrating) {
        wasCelebrating = alive;
        api.jumpLoop(alive, { height: 0.12 });
      }

      // Statue-still, but his scarf stirs in the breeze and his arms drift a little.
      const breeze = Math.sin(t * 1.1) * 3;
      set('scarfTail', tf({ rot: (alive ? 16 + Math.sin(t * 10) * 10 : 5 + breeze), px: 60, py: 58 }));

      let armL = 2 + Math.sin(t * 0.9) * 2;
      let armR = -2 - Math.sin(t * 0.9 + 1) * 2;
      if (alive) {
        armL = 125 + Math.sin(t * 12) * 22;
        armR = -125 - Math.sin(t * 12 + 1) * 22;
      }
      set('armL', tf({ rot: armL, px: 33, py: 70 }));
      set('armR', tf({ rot: armR, px: 67, py: 70 }));

      // Tips his hat when clicked
      hatT = Math.max(0, hatT - dt);
      const tip = hatT > 0 ? Math.sin(Math.min(1, (1.5 - hatT) / 1.5) * Math.PI) : 0;
      set('hat', tf({ x: tip * 3, y: -tip * 7, rot: -tip * 24, px: 63, py: 22 }));

      // Eyes only blink (and the nose wiggles) once he's alive.
      const closed = alive ? blink.step(dt) : 0;
      set('eyes', tf({ px: 50, py: 35, sy: 1 - closed * 0.92 }));
      set('nose', tf({ px: 48, py: 42, rot: alive ? Math.sin(t * 14) * 6 : tip * 8 }));
      set('face', tf({ x: alive ? Math.sin(t * 3) * 1.2 : 0 }));

      return { ...ground(0.6), x: env.W * 0.2, dir: 1 };
    },
  };
}

export default function Snowman({ world, celebrating }) {
  return (
    <Actor
      viewBox={VIEW_BOX}
      width="min(10vh, 14vw)"
      behavior={createSnowman}
      world={world}
      celebrating={celebrating}
    >
      <Art />
    </Actor>
  );
}
