'use client';

import Actor from './Actor';
import { FUR, FUR_SHADE, INK, PINK, PartyHat, Shadow, line } from './art';
import { createBlinker, createInterval, tf } from '../../lib/pose';
import { createMover, moveToward, stepFollow } from '../../lib/wander';
import { ground } from '../../lib/world';

/**
 * A polar bear cub that tags along behind the yeti and stops to watch him when
 * he stops. Click it and it does a somersault.
 */

const VIEW_BOX = '0 0 120 90';

function Leg({ part, x, shade }) {
  return (
    <g data-part={part}>
      <rect x={x - 7} y="56" width="14" height="28" rx="7" fill={shade ? FUR_SHADE : FUR} {...line} />
      <path d={`M${x - 3},81 v2.5 M${x + 1},81 v2.5 M${x + 5},81 v2.5`} {...line} strokeWidth="1.2" fill="none" />
    </g>
  );
}

function Art({ celebrating }) {
  return (
    <>
      <Shadow cx={60} cy={86} rx={40} ry={4} />
      <g data-part="root">
        <defs>
          <clipPath id="cub-body">
            <ellipse cx="58" cy="52" rx="39" ry="25" />
          </clipPath>
        </defs>

        {/* Far-side legs (a little darker, behind the body) */}
        <Leg part="legFarBack" x={50} shade />
        <Leg part="legFarFront" x={70} shade />

        <g data-part="tail">
          <circle cx="20" cy="50" r="7" fill={FUR} {...line} />
        </g>

        <ellipse cx="58" cy="52" rx="39" ry="25" fill={FUR} {...line} />
        <g clipPath="url(#cub-body)">
          <ellipse cx="58" cy="68" rx="36" ry="13" fill={FUR_SHADE} opacity="0.65" />
        </g>

        {/* Near-side legs */}
        <Leg part="legNearBack" x={34} />
        <Leg part="legNearFront" x={84} />

        {/* Head */}
        <g data-part="head">
          <g data-part="earL">
            <circle cx="85" cy="25" r="8" fill={FUR} {...line} />
            <circle cx="85" cy="26" r="4.2" fill={PINK} opacity="0.8" />
          </g>
          <g data-part="earR">
            <circle cx="111" cy="26" r="8" fill={FUR} {...line} />
            <circle cx="111" cy="27" r="4.2" fill={PINK} opacity="0.8" />
          </g>
          <circle cx="98" cy="42" r="22" fill={FUR} {...line} />
          <ellipse cx="111" cy="51" rx="11.5" ry="9" fill="#ffffff" {...line} strokeWidth="1.8" />
          <ellipse cx="118.5" cy="47" rx="4.4" ry="3.4" fill={INK} />
          <path d="M117.5,50 V54 M112.5,55 Q115.5,58 119.5,55" {...line} strokeWidth="1.5" fill="none" />
          <ellipse cx="99" cy="49" rx="4" ry="2.6" fill={PINK} opacity="0.5" />
          <g data-part="eyes">
            <circle cx="102" cy="37" r="3.2" fill={INK} />
            <circle cx="115" cy="37" r="3.2" fill={INK} />
            <circle cx="103" cy="35.8" r="1.1" fill="#fff" />
            <circle cx="116" cy="35.8" r="1.1" fill="#fff" />
          </g>
          {celebrating && <PartyHat x={98} y={22} rot={12} size={0.9} />}
        </g>

        {/* Little blue scarf */}
        <path d="M78,50 Q90,64 104,56 L102,65 Q90,74 77,61 Z" fill="#4aa3df" {...line} strokeWidth="1.8" />
        <path d="M86,58 L84,70 L92,71 L92,62 Z" fill="#4aa3df" {...line} strokeWidth="1.8" />
      </g>
    </>
  );
}

const LINES = ['Rawr!', 'Hehe!', 'Snacks?', 'Wheee!', 'Follow me!'];

function createCub({ parts, world, api, reduced }) {
  const rand = Math.random;
  const m = createMover(window.innerWidth * 0.3, 0.65);
  const blink = createBlinker(rand);
  const earFlick = createInterval([3, 7], rand);
  let phase = 0;
  let earT = 0;
  let wasCelebrating = false;
  let initialised = false;

  const set = (name, value) => parts[name]?.setAttribute('transform', value);

  return {
    onClick() {
      api.say(LINES[Math.floor(rand() * LINES.length)]);
      api.hop({ height: 0.22, spin: -360 }); // a somersault
    },

    tick(dt, t, env) {
      const u = env.u;
      const maxSpeed = (reduced ? 70 : 125) * u;
      const leader = world.yeti;

      // Start next to the yeti instead of somewhere random.
      if (!initialised && leader.x > 0) {
        m.x = leader.x - 130 * u;
        initialised = true;
      }

      if (env.celebrating !== wasCelebrating) {
        wasCelebrating = env.celebrating;
        api.jumpLoop(env.celebrating, { height: 0.2 });
      }

      let moving;
      if (env.celebrating) {
        m.depth += (0.85 - m.depth) * Math.min(1, dt * 2);
        moving = !moveToward(m, env.W * 0.42, dt, { maxSpeed: 300 * u, accel: 900 * u, slowRadius: 160 * u });
      } else {
        moving = stepFollow(m, leader, dt, {
          gap: 130 * u,
          minX: env.W * 0.06,
          maxX: env.W * 0.94,
          maxSpeed,
          accel: 520 * u,
          depthOffset: 0.12,
        });
      }
      const place = { ...ground(m.depth), x: m.x, dir: m.dir };

      const stride = Math.max(20, env.h * place.scale * 0.95);
      phase += (Math.abs(m.vx) * dt) / stride;
      const sp = Math.min(1, Math.abs(m.vx) / (maxSpeed || 1));
      const s = Math.sin(phase * Math.PI * 2);

      // Trotting: legs move in diagonal pairs
      const swing = 26 * sp;
      set('legNearBack', tf({ rot: s * swing, px: 34, py: 58 }));
      set('legFarFront', tf({ rot: s * swing, px: 70, py: 58 }));
      set('legNearFront', tf({ rot: -s * swing, px: 84, py: 58 }));
      set('legFarBack', tf({ rot: -s * swing, px: 50, py: 58 }));

      // Body bounce, plus a gentle breathing motion when standing
      const breathe = Math.sin(t * 2.2) * 0.012;
      set('root', tf({ y: -Math.abs(s) * 2 * sp, rot: s * 1.5 * sp, px: 60, py: 84, sy: 1 + breathe * (1 - sp) }));
      set('head', tf({ rot: Math.sin(phase * Math.PI * 4) * 2 * sp + (moving ? 0 : Math.sin(t * 0.9) * 4), px: 90, py: 52 }));
      set('tail', tf({ rot: Math.sin(t * (6 + 8 * sp)) * 12, px: 24, py: 52 }));

      // Now and then an ear flicks
      if (!moving && earFlick.step(dt)) earT = 0.35;
      earT = Math.max(0, earT - dt);
      set('earR', tf({ rot: earT > 0 ? Math.sin((earT / 0.35) * Math.PI) * 18 : 0, px: 108, py: 34 }));
      set('eyes', tf({ px: 108, py: 37, sy: 1 - blink.step(dt) * 0.92 }));

      return place;
    },
  };
}

export default function BearCub({ world, celebrating }) {
  return (
    <Actor
      viewBox={VIEW_BOX}
      width="min(11vh, 16vw)"
      behavior={createCub}
      world={world}
      celebrating={celebrating}
    >
      <Art celebrating={celebrating} />
    </Actor>
  );
}
