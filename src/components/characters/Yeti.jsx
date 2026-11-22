'use client';

import Actor from './Actor';
import { FUR, FUR_SHADE, GOLD, INK, PINK, RED, Shadow, line } from './art';
import { createBlinker, createInterval, tf } from '../../lib/pose';
import { createMover, createWanderer, moveToward, stepWander } from '../../lib/wander';
import { ground } from '../../lib/world';

/**
 * The yeti: cosy beanie and scarf, shaggy fur, big feet. He wanders the
 * ground, stops to look around or wave, puffs breath in the cold, and reacts
 * when clicked. The other characters watch him (the cub follows him).
 */

const VIEW_BOX = '0 0 100 140';

function Art() {
  return (
    <>
      <Shadow cx={50} cy={137} rx={30} ry={4} />
      <g data-part="root">
        <defs>
          <clipPath id="yeti-body">
            <ellipse cx="50" cy="88" rx="33" ry="36" />
          </clipPath>
        </defs>

        {/* Legs and big feet */}
        <g data-part="legL">
          <ellipse cx="40" cy="120" rx="10.5" ry="13" fill={FUR} {...line} />
          <ellipse cx="38" cy="131.5" rx="14" ry="6" fill={FUR} {...line} />
          <path d="M29.5,131 v3.2 M35.5,133 v3 M41.5,133 v3" {...line} strokeWidth="1.5" fill="none" />
        </g>
        <g data-part="legR">
          <ellipse cx="60" cy="120" rx="10.5" ry="13" fill={FUR} {...line} />
          <ellipse cx="62" cy="131.5" rx="14" ry="6" fill={FUR} {...line} />
          <path d="M70.5,131 v3.2 M64.5,133 v3 M58.5,133 v3" {...line} strokeWidth="1.5" fill="none" />
        </g>

        {/* Fur tufts poking out of the sides */}
        <g fill={FUR} {...line}>
          <polygon points="18,76 9,81 18,86" />
          <polygon points="18,93 8,99 18,103" />
          <polygon points="82,76 91,81 82,86" />
          <polygon points="82,93 92,99 82,103" />
        </g>

        {/* Body with a lighter belly and shaded right side */}
        <ellipse cx="50" cy="88" rx="33" ry="36" fill={FUR} {...line} />
        <g clipPath="url(#yeti-body)">
          <ellipse cx="76" cy="92" rx="11" ry="34" fill={FUR_SHADE} opacity="0.7" />
          <ellipse cx="50" cy="98" rx="21" ry="24" fill="#ffffff" />
        </g>
        <path
          d="M42,90 l3,4 l3,-4 M53,95 l3,4 l3,-4 M45,104 l3,4 l3,-4 M56,108 l3,4 l3,-4"
          fill="none"
          stroke={FUR_SHADE}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Arms */}
        <g data-part="armL">
          <ellipse cx="17" cy="90" rx="9.5" ry="21" transform="rotate(8 17 90)" fill={FUR} {...line} />
          <circle cx="14" cy="110" r="8.5" fill={FUR} {...line} />
          <path d="M9,115 v3 M14,117 v3 M19,115 v3" {...line} strokeWidth="1.4" fill="none" />
        </g>
        <g data-part="armR">
          <ellipse cx="83" cy="90" rx="9.5" ry="21" transform="rotate(-8 83 90)" fill={FUR} {...line} />
          <circle cx="86" cy="110" r="8.5" fill={FUR} {...line} />
          <path d="M81,115 v3 M86,117 v3 M91,115 v3" {...line} strokeWidth="1.4" fill="none" />
        </g>

        {/* Scarf tail (it trails behind when he walks) */}
        <g data-part="scarfTail">
          <path d="M27,70 L42,73 L40,101 L25,99 Z" fill={RED} {...line} />
          <path d="M26,90 L40.6,92.5 L40.3,97 L25.5,94.6 Z" fill={GOLD} />
          <path d="M26,99.5 v4 M30,100 v4 M34,100.5 v4 M38,101 v4" {...line} strokeWidth="1.6" fill="none" />
        </g>

        {/* Head */}
        <g data-part="head">
          <polygon points="26,33 14,35 21,40 11,45 22,49 26,51" fill={FUR} {...line} />
          <polygon points="74,33 86,35 79,40 89,45 78,49 74,51" fill={FUR} {...line} />
          <ellipse cx="50" cy="42" rx="28" ry="25" fill={FUR} {...line} />
          <ellipse cx="50" cy="48" rx="19.5" ry="15.5" fill="#dbe9fb" stroke="#b6cdea" strokeWidth="1.2" />

          <g data-part="face">
            <g data-part="eyes">
              <ellipse cx="43" cy="46" rx="3.4" ry="4.2" fill={INK} />
              <ellipse cx="57" cy="46" rx="3.4" ry="4.2" fill={INK} />
              <circle cx="44.2" cy="44.4" r="1.3" fill="#fff" />
              <circle cx="58.2" cy="44.4" r="1.3" fill="#fff" />
            </g>
            <ellipse cx="36" cy="53" rx="4.5" ry="2.8" fill={PINK} opacity="0.55" />
            <ellipse cx="64" cy="53" rx="4.5" ry="2.8" fill={PINK} opacity="0.55" />
            <ellipse cx="50" cy="51.5" rx="3.4" ry="2.4" fill="#7f95b8" />
            <path data-part="mouthSmile" d="M44,56 Q50,62 56,56" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            <g data-part="mouthOpen" visibility="hidden">
              <path d="M44,56 Q50,58 56,56 Q54,66 50,66 Q46,66 44,56 Z" fill="#7a2f3f" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
              <ellipse cx="50" cy="63" rx="3" ry="2" fill={PINK} />
            </g>
          </g>

          {/* Beanie with a bobbing pompom */}
          <path d="M23,34 Q23,9 50,9 Q77,9 77,34 Z" fill={RED} {...line} />
          <path d="M34,13 Q36,24 33,34 M50,9 V34 M66,13 Q64,24 67,34" fill="none" stroke="#b32f2c" strokeWidth="1.5" />
          <rect x="21" y="30" width="58" height="11" rx="5.5" fill="#f4f1e8" {...line} />
          <path d="M30,31.5 v8 M38,31.5 v8 M46,31.5 v8 M54,31.5 v8 M62,31.5 v8 M70,31.5 v8" stroke="#d8d2c0" strokeWidth="1.4" />
          <g data-part="pom">
            <circle cx="50" cy="8" r="7" fill="#ffffff" {...line} />
          </g>
        </g>

        {/* Scarf around the neck */}
        <rect x="25" y="63" width="50" height="13" rx="6.5" fill={RED} {...line} />
        <rect x="35" y="63.5" width="5" height="12" fill={GOLD} />
        <rect x="60" y="63.5" width="5" height="12" fill={GOLD} />
        <path d="M25,69.5 Q50,73 75,69.5" fill="none" stroke="#b32f2c" strokeWidth="1.2" />

        {/* A puff of breath in the cold air */}
        <circle data-part="puff" cx="56" cy="58" r="3" fill="#ffffff" opacity="0" />
      </g>
    </>
  );
}

const LINES = ['Happy New Year!', 'Brrr, so cold!', 'Hi there!', 'Snow day!', 'Ready for midnight?', 'Look, snow!'];

function createYeti({ parts, world, api, reduced }) {
  const rand = Math.random;
  const m = createMover(window.innerWidth * (0.3 + rand() * 0.4), 0.55);
  const wander = createWanderer(rand);
  const blink = createBlinker(rand);
  const breath = createInterval([3, 6], rand);
  const idleAct = createInterval([3, 7], rand);

  let phase = 0;
  let waveT = 0; // seconds of waving left
  let look = { t: 0, dur: 0 }; // looking around
  let puffT = -1;
  let wasCelebrating = false;
  let moving = false;
  let speedRatio = 0;

  const set = (name, value) => parts[name]?.setAttribute('transform', value);

  return {
    onClick() {
      api.say(LINES[Math.floor(rand() * LINES.length)]);
      api.hop({ height: 0.14, spin: 0 });
      waveT = 2;
    },

    tick(dt, t, env) {
      const u = env.u;
      const maxSpeed = (reduced ? 50 : 95) * u;
      const accel = 420 * u;

      if (env.celebrating !== wasCelebrating) {
        wasCelebrating = env.celebrating;
        api.jumpLoop(env.celebrating, { height: 0.17 });
      }

      // Where to go
      if (env.celebrating) {
        m.depth += (0.7 - m.depth) * Math.min(1, dt * 2);
        moving = !moveToward(m, env.W * 0.5, dt, { maxSpeed: 320 * u, accel: 900 * u, slowRadius: 180 * u });
      } else {
        moving = stepWander(wander, m, dt, {
          minX: env.W * 0.1,
          maxX: env.W * 0.9,
          maxSpeed,
          accel,
          rand,
          idleRange: [1.5, 4.5],
          slowRadius: 130 * u,
        });
      }
      const place = { ...ground(m.depth), x: m.x, dir: m.dir };

      // Share where he is, so the others can follow him.
      Object.assign(world.yeti, { x: m.x, dir: m.dir, depth: m.depth, moving });

      // Feet keep pace with the ground: one full step cycle per `stride` px.
      const stride = Math.max(20, env.h * place.scale * 0.62);
      phase += (Math.abs(m.vx) * dt) / stride;
      speedRatio = Math.min(1, Math.abs(m.vx) / (maxSpeed || 1));
      const sp = speedRatio;
      const s = Math.sin(phase * Math.PI * 2);

      // Idle moments: look around or wave.
      if (!moving && !env.celebrating && idleAct.step(dt) && look.t <= 0 && waveT <= 0) {
        if (rand() < 0.65) look = { t: 2.6, dur: 2.6 };
        else waveT = 1.8;
      }
      if (moving || env.celebrating) look.t = 0;
      look.t = Math.max(0, look.t - dt);
      waveT = Math.max(0, waveT - dt);
      const lookWave = look.t > 0 ? Math.sin(((look.dur - look.t) / look.dur) * Math.PI * 2) : 0;

      // Pose: whole body
      const lean = 3 * sp;
      set('root', tf({ y: -Math.abs(s) * 2.4 * sp, rot: lean + s * 3 * sp, px: 50, py: 134 }));

      // Legs step, with the foot lifting off the snow
      set('legL', tf({ y: -Math.max(0, s) * 5 * sp, rot: s * 20 * sp, px: 40, py: 112 }));
      set('legR', tf({ y: -Math.max(0, -s) * 5 * sp, rot: -s * 20 * sp, px: 60, py: 112 }));

      // Arms swing opposite the legs, or wave
      const idleSway = Math.sin(t * 1.6) * 2;
      let armL = -s * 24 * sp - idleSway;
      let armR = s * 24 * sp + idleSway;
      if (env.celebrating) {
        armL = 150 + Math.sin(t * 13) * 18;
        armR = -150 - Math.sin(t * 13 + 1) * 18;
      } else if (waveT > 0) {
        armR = -150 + Math.sin(t * 13) * 16;
      }
      set('armL', tf({ rot: armL, px: 24, py: 72 }));
      set('armR', tf({ rot: armR, px: 76, py: 72 }));

      // Head tilts when looking around; the face turns towards where he is going
      set('head', tf({ rot: lookWave * 7, px: 50, py: 64 }));
      set('face', tf({ x: 2.5 + lookWave * 3 }));
      const closed = blink.step(dt);
      set('eyes', tf({ px: 50, py: 46, sy: 1 - closed * 0.92 }));
      const open = env.celebrating || waveT > 0;
      parts.mouthSmile?.setAttribute('visibility', open ? 'hidden' : 'visible');
      parts.mouthOpen?.setAttribute('visibility', open ? 'visible' : 'hidden');

      // Pompom swings back as he moves; scarf tail streams out behind him
      const wobble = env.celebrating ? Math.sin(t * 18) * 14 : 0;
      set('pom', tf({ rot: -sp * 14 + Math.sin(t * 7) * 3 * sp + wobble, px: 50, py: 14 }));
      set('scarfTail', tf({ rot: 5 + sp * 28 + Math.sin(t * 8) * (2 + 5 * sp), px: 32, py: 69 }));

      // Breath puff
      if (!moving && !env.celebrating && puffT < 0 && breath.step(dt)) puffT = 0;
      const puff = parts.puff;
      if (puff) {
        if (puffT >= 0) {
          puffT += dt;
          const k = puffT / 1.3;
          if (k >= 1) {
            puffT = -1;
            puff.setAttribute('opacity', '0');
          } else {
            puff.setAttribute('cx', String(57 + k * 16));
            puff.setAttribute('cy', String(58 - k * 9));
            puff.setAttribute('r', String(2.5 + k * 6));
            puff.setAttribute('opacity', String(0.75 * (1 - k)));
          }
        }
      }

      return place;
    },
  };
}

export default function Yeti({ world, celebrating }) {
  return (
    <Actor
      viewBox={VIEW_BOX}
      width="min(11vh, 15vw)"
      behavior={createYeti}
      world={world}
      celebrating={celebrating}
    >
      <Art />
    </Actor>
  );
}
