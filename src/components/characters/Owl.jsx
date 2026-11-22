'use client';

import Actor from './Actor';
import { INK, OUTLINE, PartyHat, line } from './art';
import { createBlinker, createInterval, tf } from '../../lib/pose';
import { flightDuration, flightPoint, pickPerch } from '../../lib/flight';
import { OWL_START_PERCH, PERCHES, perchSpot } from '../../lib/scene';

/**
 * An owl that lives in the pine trees. It blinks slowly, turns its head to
 * look around, and every so often flies in an arc to another tree. Click it and
 * it hoots, then flies off. At midnight it stays put on its tree, flapping
 * and hopping about.
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

// Things it says on its own
const CHATTER = [
  "Hoo's up?",
  'Hoo hoo!',
  'I saw that!',
  'Wise tip: stay warm!',
  'Best view in town!',
  'Time flies... so do I!',
  'Who? Who?',
];
const CELEBRATE = ['Happy New Year!', 'Hoo-ray!', 'Woohoo!', 'Cheers!', 'What a night!'];

const TAKEOFF_SECONDS = 0.35;
const LANDING_SECONDS = 0.4;

function createOwl({ parts, api, reduced }) {
  const rand = Math.random;
  const blink = createBlinker(rand, [2.5, 6]);
  const lookAround = createInterval([3, 7], rand);

  let look = { t: 0, dur: 0, dir: 1 };
  let puffT = 0;
  let wasJumping = false;

  // Flight: perched -> takeoff -> flying -> landing -> perched
  let state = 'perched';
  let stateT = 0;
  let perch = OWL_START_PERCH; // index into PERCHES
  let target = perch;
  let perchLeft = 6 + rand() * 8; // seconds until it flies somewhere else
  let flight = { from: null, to: null, duration: 1 };
  let dir = 1;

  const set = (name, value) => parts[name]?.setAttribute('transform', value);

  return {
    talk: { lines: CHATTER, celebrate: CELEBRATE },

    onClick() {
      api.say(LINES[Math.floor(rand() * LINES.length)]);
      puffT = 1.2;
      if (state === 'perched') {
        api.hop({ height: 0.1 });
        perchLeft = Math.min(perchLeft, 0.9); // startled: it flies off soon
      }
    },

    tick(dt, t, env) {
      const alive = env.celebrating;
      stateT += dt;

      // Where it is sitting right now (recomputed so it follows window resizes)
      const here = perchSpot(perch, env.W);

      // Time to go somewhere? Not once the party has started.
      if (state === 'perched') {
        if (!alive) perchLeft -= dt;
        if (perchLeft <= 0 && !alive && !reduced) {
          target = pickPerch(PERCHES.length, perch, rand);
          state = 'takeoff';
          stateT = 0;
        }
      } else if (state === 'takeoff' && stateT >= TAKEOFF_SECONDS) {
        const from = perchSpot(perch, env.W);
        const to = perchSpot(target, env.W);
        flight = { from, to, duration: flightDuration(Math.abs(to.x - from.x), env.W) };
        dir = to.x >= from.x ? 1 : -1;
        state = 'flying';
        stateT = 0;
      } else if (state === 'flying' && stateT >= flight.duration) {
        perch = target;
        state = 'landing';
        stateT = 0;
      } else if (state === 'landing' && stateT >= LANDING_SECONDS) {
        state = 'perched';
        stateT = 0;
        perchLeft = 8 + rand() * 14;
      }

      // Only jump for joy while sitting on a tree
      const jumping = alive && state === 'perched';
      if (jumping !== wasJumping) {
        wasJumping = jumping;
        api.jumpLoop(jumping, { height: 0.12 });
      }

      // Position: on the perch, or along the arc between two perches
      let x = here.x;
      let vh = here.vh;
      let lean = 0;
      if (state === 'flying') {
        const u = stateT / flight.duration;
        const p = flightPoint(flight.from, flight.to, u, env.W);
        x = p.x;
        vh = p.vh;
        lean = dir * Math.sin(Math.PI * u) * 12; // leans into the flight
      } else if (state === 'takeoff') {
        // crouch before the leap
        vh -= Math.sin((stateT / TAKEOFF_SECONDS) * Math.PI) * 0.4;
      }

      // Turn the head to look around now and then (only when sitting still)
      const sitting = state === 'perched';
      if (sitting && !alive && look.t <= 0 && lookAround.step(dt)) {
        look = { t: 2.4, dur: 2.4, dir: rand() < 0.5 ? -1 : 1 };
      }
      if (!sitting) look.t = 0;
      look.t = Math.max(0, look.t - dt);
      const turn = look.t > 0 ? Math.sin(((look.dur - look.t) / look.dur) * Math.PI) * look.dir : 0;

      set('head', tf({ rot: turn * 14 + Math.sin(t * 0.7) * 1.5, px: 30, py: 38 }));
      const shift = state === 'flying' ? 2 : turn * 3; // eyes on where it is going
      set('pupilL', tf({ x: shift }));
      set('pupilR', tf({ x: shift }));

      // Slow, sleepy blink: the lids drop from the top of each eye
      const closed = sitting ? blink.step(dt) : 0;
      for (const [side, cx] of [['L', 21.5], ['R', 38.5]]) {
        set(`lid${side}`, tf({ px: cx, py: 15.5, sy: Math.max(0.0001, closed) }));
      }

      // Wings: a lazy shuffle when perched; big flaps in the air, at midnight, or when startled
      puffT = Math.max(0, puffT - dt);
      const puff = puffT > 0 ? Math.sin((puffT / 1.2) * Math.PI) * 0.1 : 0;
      let wing = 3 + Math.sin(t * 1.4) * 1.5;
      if (state === 'flying') wing = 38 + Math.sin(t * 24) * 34;
      else if (state === 'takeoff' || state === 'landing') wing = 30 + Math.sin(t * 30) * 28;
      else if (alive || puffT > 0) wing = 22 + Math.sin(t * 26) * 20;
      set('wingL', tf({ rot: wing, px: 14, py: 34 }));
      set('wingR', tf({ rot: -wing, px: 46, py: 34 }));
      set(
        'root',
        tf({ px: 30, py: 66, rot: lean + (reduced ? 0 : Math.sin(t * 0.5) * 0.8), sx: 1 + puff, sy: 1 + puff })
      );

      return { x, bottomVh: vh, scale: 1, z: 7, dir };
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
