'use client';

import Actor from './Actor';
import { FUR_SHADE, GOLD, INK, OUTLINE, PINK, PartyHat, Shadow, line } from './art';
import { createBlinker, tf } from '../../lib/pose';
import { createMover, createWanderer, moveToward, stepWander } from '../../lib/wander';
import { ground } from '../../lib/world';

/**
 * A penguin that waddles around, and sometimes flops onto its tummy and
 * slides across the snow, kicking up a spray. Click it for a honk.
 */

const VIEW_BOX = '0 0 80 110';
const NAVY = '#26304e';
const BEAK = '#f6a623';

function Art({ celebrating }) {
  return (
    <>
      <Shadow cx={40} cy={106} rx={24} ry={3.6} />

      {/* Snow kicked up behind a belly slide (outside the body, so it doesn't tilt with it) */}
      <circle data-part="spray0" cx="20" cy="100" r="4" fill="#fff" opacity="0" />
      <circle data-part="spray1" cx="8" cy="96" r="3" fill="#fff" opacity="0" />
      <circle data-part="spray2" cx="-3" cy="101" r="3.5" fill="#fff" opacity="0" />

      <g data-part="root">
        <g data-part="feetL">
          <ellipse cx="29" cy="101" rx="9.5" ry="4.2" fill={BEAK} {...line} strokeWidth="1.8" />
        </g>
        <g data-part="feetR">
          <ellipse cx="51" cy="101" rx="9.5" ry="4.2" fill={BEAK} {...line} strokeWidth="1.8" />
        </g>

        <g data-part="flipL">
          <ellipse cx="11" cy="66" rx="6.5" ry="19" transform="rotate(12 11 66)" fill={NAVY} {...line} />
        </g>
        <g data-part="flipR">
          <ellipse cx="69" cy="66" rx="6.5" ry="19" transform="rotate(-12 69 66)" fill={NAVY} {...line} />
        </g>

        <ellipse cx="40" cy="64" rx="26" ry="38" fill={NAVY} {...line} />
        <ellipse cx="40" cy="70" rx="17" ry="30" fill="#ffffff" />
        <ellipse cx="50" cy="73" rx="7" ry="24" fill={FUR_SHADE} opacity="0.5" />

        <g data-part="head">
          <ellipse cx="40" cy="30" rx="21" ry="18" fill={NAVY} {...line} />
          <ellipse cx="32" cy="31" rx="9.5" ry="10" fill="#ffffff" />
          <ellipse cx="48" cy="31" rx="9.5" ry="10" fill="#ffffff" />
          <g data-part="eyes">
            <circle cx="33" cy="30" r="3.4" fill={INK} />
            <circle cx="47" cy="30" r="3.4" fill={INK} />
            <circle cx="34.1" cy="28.8" r="1.1" fill="#fff" />
            <circle cx="48.1" cy="28.8" r="1.1" fill="#fff" />
          </g>
          <ellipse cx="27" cy="37" rx="3" ry="2" fill={PINK} opacity="0.6" />
          <ellipse cx="53" cy="37" rx="3" ry="2" fill={PINK} opacity="0.6" />
          <polygon points="34,34 46,34 40,43" fill={BEAK} stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
          {celebrating && <PartyHat x={40} y={13} rot={-8} size={0.95} />}
        </g>

        {/* Green scarf */}
        <rect x="22" y="44" width="36" height="8" rx="4" fill="#3fae7a" {...line} strokeWidth="1.8" />
        <rect x="31" y="44.5" width="4" height="7" fill={GOLD} />
        <rect x="46" y="44.5" width="4" height="7" fill={GOLD} />
        <path d="M48,50 L58,53 L55,66 L46,64 Z" fill="#3fae7a" {...line} strokeWidth="1.8" />
      </g>
    </>
  );
}

const LINES = ['Honk!', 'Honk honk!', 'Slide time!', 'Brrr!', 'Noot noot!'];

function createPenguin({ parts, api, reduced }) {
  const rand = Math.random;
  const m = createMover(window.innerWidth * (0.55 + rand() * 0.3), 0.3);
  const wander = createWanderer(rand);
  const blink = createBlinker(rand);

  let phase = 0;
  let lie = 0; // 0 = standing, 1 = flat on its belly
  let sliding = false;
  let prevMode = 'idle';
  let flapT = 0;
  let wasCelebrating = false;

  const set = (name, value) => parts[name]?.setAttribute('transform', value);

  return {
    onClick() {
      api.say(LINES[Math.floor(rand() * LINES.length)]);
      api.hop({ height: 0.16 });
      flapT = 1.4;
    },

    tick(dt, t, env) {
      const u = env.u;
      if (env.celebrating !== wasCelebrating) {
        wasCelebrating = env.celebrating;
        api.jumpLoop(env.celebrating, { height: 0.15 });
      }

      let moving;
      if (env.celebrating) {
        sliding = false;
        m.depth += (0.8 - m.depth) * Math.min(1, dt * 2);
        moving = !moveToward(m, env.W * 0.6, dt, { maxSpeed: 260 * u, accel: 800 * u, slowRadius: 160 * u });
      } else {
        // Decide at the start of each trip whether to slide (long trips only).
        if (prevMode === 'idle' && wander.mode === 'walk') {
          sliding = !reduced && wander.tripLen > env.W * 0.25 && rand() < 0.45;
        }
        prevMode = wander.mode;
        moving = stepWander(wander, m, dt, {
          minX: env.W * 0.08,
          maxX: env.W * 0.92,
          maxSpeed: (sliding ? 190 : reduced ? 28 : 52) * u,
          accel: (sliding ? 360 : 300) * u,
          rand,
          idleRange: [1.5, 4],
          slowRadius: (sliding ? 260 : 80) * u,
        });
        if (wander.mode === 'idle') sliding = false;
      }
      const place = { ...ground(m.depth), x: m.x, dir: m.dir };

      // Lie down to slide and stand back up afterwards
      lie += ((sliding && moving ? 1 : 0) - lie) * Math.min(1, dt * 6);

      const stride = Math.max(20, env.h * place.scale * 0.5);
      phase += (Math.abs(m.vx) * dt) / stride;
      const sp = Math.min(1, Math.abs(m.vx) / (52 * u));
      const walk = sp * (1 - lie);
      const s = Math.sin(phase * Math.PI * 2);

      // Waddle: rock side to side, feet lift in turn, flippers swing
      set(
        'root',
        tf({ y: -Math.abs(s) * 1.2 * walk, rot: s * 9 * walk + lie * 88, px: 40 + 18 * lie, py: 102 })
      );
      set('feetL', tf({ y: -Math.max(0, s) * 4 * walk, px: 29, py: 101 }));
      set('feetR', tf({ y: -Math.max(0, -s) * 4 * walk, px: 51, py: 101 }));

      flapT = Math.max(0, flapT - dt);
      let flap = s * 14 * walk;
      if (env.celebrating || flapT > 0) flap = 28 + Math.sin(t * 24) * 22;
      if (lie > 0.5) flap = -35 * lie; // swept back while sliding
      set('flipL', tf({ rot: flap, px: 15, py: 50 }));
      set('flipR', tf({ rot: -flap, px: 65, py: 50 }));

      set('head', tf({ rot: Math.sin(t * 0.8) * 3 * (1 - walk), px: 40, py: 42 }));
      set('eyes', tf({ px: 40, py: 30, sy: 1 - blink.step(dt) * 0.92 }));

      // Snow spray while sliding
      const spray = lie * Math.min(1, Math.abs(m.vx) / (150 * u));
      for (let i = 0; i < 3; i++) {
        const el = parts[`spray${i}`];
        if (!el) continue;
        const wobble = Math.sin(t * 9 + i * 2);
        el.setAttribute('opacity', String(Math.max(0, spray * (0.75 - i * 0.15))));
        el.setAttribute('cy', String(100 - i * 2 - Math.abs(wobble) * 6));
        el.setAttribute('r', String(3 + i + wobble * 0.8));
      }

      return place;
    },
  };
}

export default function Penguin({ world, celebrating }) {
  return (
    <Actor
      viewBox={VIEW_BOX}
      width="min(6.6vh, 10vw)"
      behavior={createPenguin}
      world={world}
      celebrating={celebrating}
    >
      <Art celebrating={celebrating} />
    </Actor>
  );
}
