'use client';

import Actor from './Actor';
import { INK, OUTLINE, PartyHat, line } from './art';
import { createBlinker, createInterval, tf } from '../../lib/pose';
import { OWL_TREE, TREES, treeTipVh } from '../../lib/scene';

/**
 * An owl perched on the tip of a pine tree. It blinks slowly, turns its head
 * to look around, and when clicked it fluffs up and hoots. At midnight it
 * flaps its wings and hops about on its branch.
 */

const VIEW_BOX = '0 0 60 70';
const BROWN = '#8d6b4a';
const DARK_BROWN = '#6f523a';
const CREAM = '#f1e4c8';
const BEAK = '#f0a030';

function Eye({ side, cx }) {
  return (
    <>
      <circle cx={cx} cy="25" r="9.5" fill={CREAM} />
      <circle cx={cx} cy="25" r="6.6" fill="#f6c244" stroke="#d99a2b" strokeWidth="1.2" />
      <g data-part={`pupil${side}`}>
        <circle cx={cx} cy="25" r="3.3" fill={INK} />
        <circle cx={cx + 1.3} cy="23.6" r="1.1" fill="#fff" />
      </g>
      {/* Eyelid: a brown disc that drops down from the top of the eye to blink */}
      <circle data-part={`lid${side}`} cx={cx} cy="25" r="9.6" fill={BROWN} transform="translate(0 0) scale(1 0.0001)" />
    </>
  );
}

function Art({ celebrating }) {
  return (
    <g data-part="root">
      {/* Feet gripping the tree top */}
      <g fill={BEAK} {...line} strokeWidth="1.5">
        <ellipse cx="24" cy="66.5" rx="5.5" ry="2.6" />
        <ellipse cx="36" cy="66.5" rx="5.5" ry="2.6" />
      </g>

      <ellipse cx="30" cy="44" rx="20" ry="22" fill={BROWN} {...line} />
      <ellipse cx="30" cy="50" rx="13" ry="16" fill="#ead9b8" />
      <path
        d="M23,45 q3,3 6,0 q3,3 6,0 M24,52 q3,3 6,0 q3,3 6,0 M26,59 q3,3 6,0 q3,3 6,0"
        fill="none"
        stroke="#c4a77c"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      <g data-part="wingL">
        <ellipse cx="10" cy="46" rx="6.5" ry="16" transform="rotate(8 10 46)" fill={DARK_BROWN} {...line} />
      </g>
      <g data-part="wingR">
        <ellipse cx="50" cy="46" rx="6.5" ry="16" transform="rotate(-8 50 46)" fill={DARK_BROWN} {...line} />
      </g>

      <g data-part="head">
        <polygon points="10,5 22,12 12,22" fill={BROWN} {...line} />
        <polygon points="50,5 38,12 48,22" fill={BROWN} {...line} />
        <ellipse cx="30" cy="25" rx="21" ry="17" fill={BROWN} {...line} />
        <Eye side="L" cx={21.5} />
        <Eye side="R" cx={38.5} />
        <polygon points="30,27 26,32 30,38.5 34,32" fill={BEAK} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
        {celebrating && <PartyHat x={30} y={9} rot={0} size={0.85} />}
      </g>
    </g>
  );
}

const LINES = ['Hoo hoo!', 'Who? Who?', 'Hoot!', 'Midnight soon!'];

function createOwl({ parts, api, reduced }) {
  const rand = Math.random;
  const blink = createBlinker(rand, [2.5, 6]);
  const lookAround = createInterval([3, 7], rand);

  let look = { t: 0, dur: 0, dir: 1 };
  let puffT = 0;
  let wasCelebrating = false;

  const set = (name, value) => parts[name]?.setAttribute('transform', value);
  // The tree's tip, in vh above the bottom of the screen: the owl's feet sit there.
  const feetVh = treeTipVh(OWL_TREE) - 0.4;

  return {
    onClick() {
      api.say(LINES[Math.floor(rand() * LINES.length)]);
      api.hop({ height: 0.1 });
      puffT = 1.2;
    },

    tick(dt, t, env) {
      const alive = env.celebrating;
      if (alive !== wasCelebrating) {
        wasCelebrating = alive;
        api.jumpLoop(alive, { height: 0.12 });
      }

      // Turn the head to look around now and then
      if (!alive && look.t <= 0 && lookAround.step(dt)) {
        look = { t: 2.4, dur: 2.4, dir: rand() < 0.5 ? -1 : 1 };
      }
      look.t = Math.max(0, look.t - dt);
      const turn = look.t > 0 ? Math.sin(((look.dur - look.t) / look.dur) * Math.PI) * look.dir : 0;

      set('head', tf({ rot: turn * 14 + Math.sin(t * 0.7) * 1.5, px: 30, py: 38 }));
      const shift = turn * 3;
      set('pupilL', tf({ x: shift }));
      set('pupilR', tf({ x: shift }));

      // Slow, sleepy blink: the lids drop from the top of each eye
      const closed = blink.step(dt);
      for (const [side, cx] of [['L', 21.5], ['R', 38.5]]) {
        set(`lid${side}`, tf({ px: cx, py: 15.5, sy: Math.max(0.0001, closed) }));
      }

      // Flap at midnight; fluff up when clicked
      puffT = Math.max(0, puffT - dt);
      const puff = puffT > 0 ? Math.sin((puffT / 1.2) * Math.PI) * 0.1 : 0;
      let wing = 3 + Math.sin(t * 1.4) * 1.5;
      if (alive || puffT > 0) wing = 22 + Math.sin(t * 26) * 20;
      set('wingL', tf({ rot: wing, px: 14, py: 34 }));
      set('wingR', tf({ rot: -wing, px: 46, py: 34 }));
      set('root', tf({ px: 30, py: 66, sx: 1 + puff, sy: 1 + puff, rot: reduced ? 0 : Math.sin(t * 0.5) * 0.8 }));

      return {
        x: (TREES[OWL_TREE].x / 100) * env.W,
        bottomVh: feetVh,
        scale: 1,
        z: 7,
        dir: 1,
      };
    },
  };
}

export default function Owl({ world, celebrating }) {
  return (
    <Actor
      viewBox={VIEW_BOX}
      width="min(5.2vh, 8vw)"
      behavior={createOwl}
      world={world}
      celebrating={celebrating}
    >
      <Art celebrating={celebrating} />
    </Actor>
  );
}
