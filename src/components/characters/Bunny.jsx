'use client';

import Actor from './Actor';
import { FUR, FUR_SHADE, INK, PINK, PartyHat, Shadow, line } from './art';
import { createBlinker, createInterval, tf } from '../../lib/pose';
import { createMover, createWanderer, moveToward, stepWander } from '../../lib/wander';
import { ground } from '../../lib/world';

/**
 * A snow bunny that hops around in short bursts. Between hops it twitches its
 * nose and ears. Click it for a double hop.
 */

const VIEW_BOX = '0 0 80 100';
const HOPS_PER_SECOND = 2.2;

function Art({ celebrating }) {
  return (
    <>
      <Shadow cx={40} cy={96} rx={22} ry={3.2} />
      <g data-part="root">
        <g data-part="tail">
          <circle cx="14" cy="80" r="6.5" fill="#ffffff" {...line} />
        </g>

        {/* Body, haunch and feet */}
        <ellipse cx="42" cy="75" rx="25" ry="19" fill={FUR} {...line} />
        <ellipse cx="46" cy="83" rx="19" ry="9" fill={FUR_SHADE} opacity="0.55" />
        <g data-part="hind">
          <ellipse cx="27" cy="80" rx="15" ry="13" fill={FUR} {...line} />
          <ellipse cx="25" cy="92" rx="15" ry="4.8" fill={FUR} {...line} />
        </g>
        <g data-part="front">
          <rect x="52" y="78" width="9" height="15" rx="4.5" fill={FUR} {...line} />
          <ellipse cx="57.5" cy="92.5" rx="7" ry="3.8" fill={FUR} {...line} />
        </g>

        {/* Head with long ears */}
        <g data-part="head">
          <g data-part="earA">
            <ellipse cx="52" cy="22" rx="5.8" ry="19.5" transform="rotate(-12 52 22)" fill={FUR} {...line} />
            <ellipse cx="52" cy="23" rx="2.8" ry="13.5" transform="rotate(-12 52 23)" fill={PINK} opacity="0.75" />
          </g>
          <g data-part="earB">
            <ellipse cx="66" cy="21" rx="5.8" ry="19" transform="rotate(10 66 21)" fill={FUR} {...line} />
            <ellipse cx="66" cy="22" rx="2.8" ry="13" transform="rotate(10 66 22)" fill={PINK} opacity="0.75" />
          </g>
          <circle cx="60" cy="54" r="15.5" fill={FUR} {...line} />
          <ellipse cx="68" cy="60" rx="8" ry="6" fill="#ffffff" />
          <ellipse cx="64" cy="59" rx="4" ry="2.6" fill={PINK} opacity="0.55" />
          <g data-part="eye">
            <circle cx="65" cy="49" r="2.9" fill={INK} />
            <circle cx="65.9" cy="48" r="1" fill="#fff" />
          </g>
          <g data-part="nose">
            <ellipse cx="74" cy="55" rx="2.8" ry="2.2" fill="#f07a9a" />
          </g>
          <path d="M72,58 q2,3 5,0 M74,56 l7,-2 M74,57 l7,2" fill="none" stroke="#8aa0c4" strokeWidth="1" strokeLinecap="round" />
          {celebrating && <PartyHat x={58} y={41} rot={22} size={0.9} />}
        </g>

        {/* Pink scarf */}
        <rect x="46" y="64" width="24" height="7" rx="3.5" fill="#ec6fa2" {...line} strokeWidth="1.8" transform="rotate(8 58 67)" />
        <path d="M50,69 L47,82 L54,83 L56,71 Z" fill="#ec6fa2" {...line} strokeWidth="1.8" />
      </g>
    </>
  );
}

const LINES = ['Boing!', 'Hop hop!', '*sniff sniff*', 'Carrots?', 'Wheee!'];

function createBunny({ parts, api, reduced }) {
  const rand = Math.random;
  const m = createMover(window.innerWidth * (0.2 + rand() * 0.5), 0.8);
  const wander = createWanderer(rand);
  const blink = createBlinker(rand);
  const twitch = createInterval([2, 5], rand);

  let phase = 0; // whole numbers = on the ground, in between = in the air
  let earT = 0;
  let wasCelebrating = false;

  const set = (name, value) => parts[name]?.setAttribute('transform', value);

  return {
    onClick() {
      api.say(LINES[Math.floor(rand() * LINES.length)]);
      api.hop({ height: 0.34, spin: 0 });
    },

    tick(dt, t, env) {
      const u = env.u;
      if (env.celebrating !== wasCelebrating) {
        wasCelebrating = env.celebrating;
        api.jumpLoop(env.celebrating, { height: 0.3 });
      }

      const frac = phase % 1;
      const air = Math.sin(Math.PI * frac); // 0 on the ground, 1 at the top of a hop
      // It only travels while in the air, which is what makes it look like hops.
      const hopSpeed = 0.1 + 0.9 * air;
      const base = (reduced ? 80 : 150) * u;

      let hopping;
      if (env.celebrating) {
        m.depth += (0.75 - m.depth) * Math.min(1, dt * 2);
        hopping = !moveToward(m, env.W * 0.34, dt, { maxSpeed: 300 * u * hopSpeed, accel: 2500 * u, slowRadius: 160 * u });
      } else {
        hopping = stepWander(wander, m, dt, {
          minX: env.W * 0.08,
          maxX: env.W * 0.92,
          maxSpeed: base * hopSpeed,
          accel: 2500 * u,
          rand,
          idleRange: [1, 3.5],
          minTrip: 100,
          slowRadius: 110 * u,
        });
      }
      const place = { ...ground(m.depth), x: m.x, dir: m.dir };

      // Keep hopping while travelling; finish the hop in progress when it stops.
      if (hopping || frac > 0) {
        const next = phase + dt * HOPS_PER_SECOND;
        phase = !hopping && Math.floor(next) > Math.floor(phase) ? Math.floor(next) : next;
      }
      const lift = air * (hopping || frac > 0 ? 1 : 0);
      const lean = -Math.cos(Math.PI * frac) * 9 * (lift ? 1 : 0); // nose up going up, down coming down

      // Stretch in the air, squash on landing
      const stretch = lift ? air * 0.1 - Math.pow(1 - air, 4) * 0.1 : 0;
      set('root', tf({ y: -air * 15, rot: lean, px: 40, py: 94, sx: 1 - stretch * 0.6, sy: 1 + stretch }));

      // Ears trail back going up and flop forward coming down
      const ear = -Math.cos(Math.PI * frac) * 16 * (lift ? 1 : 0);
      if (!hopping && twitch.step(dt)) earT = 0.3;
      earT = Math.max(0, earT - dt);
      const twitchAngle = earT > 0 ? Math.sin((earT / 0.3) * Math.PI * 3) * 8 : 0;
      set('earA', tf({ rot: ear + twitchAngle, px: 54, py: 42 }));
      set('earB', tf({ rot: ear * 0.8 - twitchAngle * 0.5, px: 64, py: 42 }));

      // Back leg kicks off the ground
      set('hind', tf({ rot: -lean * 1.4, px: 28, py: 80 }));
      set('tail', tf({ rot: Math.sin(t * 9) * 8 * (hopping ? 0 : 1), px: 18, py: 80 }));

      // Twitchy nose, blinking eye
      const sniff = 1 + Math.sin(t * 16) * 0.18 * (hopping ? 0.3 : 1);
      set('nose', tf({ px: 74, py: 55, sx: sniff, sy: sniff }));
      set('eye', tf({ px: 65, py: 49, sy: 1 - blink.step(dt) * 0.92 }));
      set('head', tf({ rot: Math.sin(t * 1.3) * 2 * (hopping ? 0 : 1), px: 58, py: 66 }));

      return place;
    },
  };
}

export default function Bunny({ world, celebrating }) {
  return (
    <Actor
      viewBox={VIEW_BOX}
      width="min(6vh, 9vw)"
      behavior={createBunny}
      world={world}
      celebrating={celebrating}
    >
      <Art celebrating={celebrating} />
    </Actor>
  );
}
