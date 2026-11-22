'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { canSpeak, countdownRemark, pickLine, speechDuration } from '../../lib/chatter';

/**
 * Shared shell for every character. It owns the parts that are the same for
 * all of them, so each character only has to supply its art and behaviour:
 *
 *   - placement on the ground (position, lane/depth, size, which way it faces)
 *   - one animation loop (requestAnimationFrame)
 *   - click reactions: a speech bubble and hops/spins
 *   - the celebration jumping at midnight
 *
 * A character's `behavior` is a factory called once after mount:
 *
 *   behavior({ parts, world, api, reduced }) -> { tick(dt, t, env), onClick? }
 *
 *   parts: the SVG elements marked data-part="name" in the character's art
 *   world: object shared by all characters (e.g. so the cub can follow the yeti)
 *   api:   { say(text), hop({height, spin}), jumpLoop(on, {height}) }
 *   tick:  runs every frame, poses the parts, and returns where to put the
 *          character: { x, bottomVh, scale, z, dir } (x is its centre in px)
 *   talk:  optional { lines, celebrate }: things to say on its own now and
 *          then, and things to say once the countdown ends. Actor does the
 *          timing: at random, only while on screen, and never while someone
 *          else is talking (world.lastSpeechAt) so bubbles don't pile up.
 *   env:   { W, H, u, w, h, celebrating, reduced } where u = H / 900 is a unit
 *          scale so speeds and sizes follow the screen size
 */
export default function Actor({ viewBox, width, behavior, world, celebrating, children }) {
  const outerRef = useRef(null);
  const hopRef = useRef(null);
  const svgRef = useRef(null);
  const bubbleRef = useRef(null);
  const celebratingRef = useRef(celebrating);

  useEffect(() => {
    celebratingRef.current = celebrating;
  }, [celebrating]);

  const [, , vbW, vbH] = viewBox.split(' ').map(Number);

  useEffect(() => {
    const outer = outerRef.current;
    const hop = hopRef.current;
    const svg = svgRef.current;
    const bubble = bubbleRef.current;
    if (!outer || !hop || !svg || !bubble) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const parts = {};
    svg.querySelectorAll('[data-part]').forEach((el) => {
      parts[el.dataset.part] = el;
    });

    gsap.set(hop, { transformOrigin: '50% 100%' });
    let hopTl = null;
    let loopTl = null;
    let bubbleTl = null;

    const api = {
      /** Show a speech bubble for a moment. */
      say(text, ms = speechDuration(text)) {
        bubble.textContent = text;
        world.lastSpeechAt = performance.now() / 1000;
        if (bubbleTl) bubbleTl.kill();
        bubbleTl = gsap
          .timeline()
          .fromTo(
            bubble,
            { scale: 0, opacity: 0, transformOrigin: '50% 100%' },
            { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.2)' }
          )
          .to(bubble, { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power1.in' }, `+=${ms / 1000}`);
      },
      /** One jump with a squash and stretch. `height` is a fraction of the character's height. */
      hop({ height = 0.18, spin = 0 } = {}) {
        if (loopTl) return; // celebrating: already jumping
        if (hopTl) hopTl.kill();
        gsap.set(hop, { y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
        const up = -outer.offsetHeight * height;
        hopTl = gsap
          .timeline()
          .to(hop, { scaleX: 1.1, scaleY: 0.86, duration: 0.1, ease: 'power1.out' })
          .to(hop, { y: up, scaleX: 0.94, scaleY: 1.1, rotation: spin, duration: 0.26, ease: 'power2.out' })
          .to(hop, { y: 0, duration: 0.24, ease: 'power2.in' })
          .to(hop, { scaleX: 1.12, scaleY: 0.86, duration: 0.08 })
          .to(hop, { scaleX: 1, scaleY: 1, rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.45)' });
      },
      /** Jump again and again (the midnight celebration). */
      jumpLoop(on, { height = 0.16 } = {}) {
        if (loopTl) {
          loopTl.kill();
          loopTl = null;
        }
        if (hopTl) hopTl.kill();
        if (!on) {
          gsap.set(hop, { y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
          return;
        }
        const up = -outer.offsetHeight * height;
        loopTl = gsap
          .timeline({ repeat: -1, repeatDelay: 0.05 + Math.random() * 0.25, delay: Math.random() * 0.6 })
          .to(hop, { scaleX: 1.1, scaleY: 0.86, duration: 0.1 })
          .to(hop, { y: up, scaleX: 0.94, scaleY: 1.1, duration: 0.28, ease: 'power2.out' })
          .to(hop, { y: 0, duration: 0.26, ease: 'power2.in' })
          .to(hop, { scaleX: 1, scaleY: 1, duration: 0.12 });
      },
    };

    const brain = behavior({ parts, world, api, reduced });

    let w = outer.offsetWidth;
    let h = outer.offsetHeight;
    const measure = () => {
      w = outer.offsetWidth;
      h = outer.offsetHeight;
    };
    window.addEventListener('resize', measure);

    let dirApplied = 0;
    let raf = 0;
    let last = null;
    let time = 0;

    // Talking on its own
    let nextSayAt = 5 + Math.random() * 20;
    let lastLine = null;
    let wasCelebrating = false;

    function frame(now) {
      // dt is never negative (the very first frame can arrive "before" the start
      // time) and is capped so a background tab coming back doesn't teleport anyone.
      const dt = last === null ? 0 : Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      time += dt;
      if (!w || !h) measure(); // layout may not have been ready on the first frames
      const W = window.innerWidth;
      const H = window.innerHeight;
      const env = { W, H, u: H / 900, w, h, celebrating: celebratingRef.current, reduced };
      const place = brain.tick(dt, time, env);

      // Say something now and then (a different range once the party starts).
      if (brain.talk) {
        if (env.celebrating !== wasCelebrating) {
          wasCelebrating = env.celebrating;
          nextSayAt = time + (env.celebrating ? 2 + Math.random() * 4 : 15 + Math.random() * 25);
        }
        if (time >= nextSayAt) {
          const nowSeconds = now / 1000;
          if (canSpeak({ now: nowSeconds, lastSpeechAt: world.lastSpeechAt ?? -Infinity, x: place.x, width: W })) {
            const lines = env.celebrating ? brain.talk.celebrate : brain.talk.lines;
            const remark = env.celebrating ? null : countdownRemark(world.hoursLeft);
            const line = pickLine(lines, { remark, last: lastLine });
            if (line) {
              api.say(line);
              lastLine = line;
            }
            const range = env.celebrating ? [6, 12] : [25, 60];
            nextSayAt = time + range[0] + Math.random() * (range[1] - range[0]);
          } else {
            nextSayAt = time + 1.5; // someone else is talking, or out of sight: try again soon
          }
        }
      }

      const bottomPx = (place.bottomVh / 100) * H;
      outer.style.transform = `translate3d(${(place.x - w / 2).toFixed(1)}px, ${(-bottomPx).toFixed(1)}px, 0) scale(${place.scale.toFixed(3)})`;
      if (outer.style.zIndex !== String(place.z)) outer.style.zIndex = String(place.z);
      if (place.dir !== dirApplied) {
        svg.style.transform = `scaleX(${place.dir})`;
        dirApplied = place.dir;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onClick = () => brain.onClick?.();
    outer.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      outer.removeEventListener('click', onClick);
      if (hopTl) hopTl.kill();
      if (loopTl) loopTl.kill();
      if (bubbleTl) bubbleTl.kill();
    };
  }, [behavior, world]);

  return (
    <div
      ref={outerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width,
        aspectRatio: `${vbW} / ${vbH}`,
        transformOrigin: '50% 100%',
        willChange: 'transform',
        pointerEvents: 'auto',
        cursor: 'pointer',
        // Start off-screen until the first frame places it.
        transform: 'translate3d(-9999px, 0, 0)',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      <div ref={hopRef} style={{ width: '100%', height: '100%' }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        >
          {children}
        </svg>
      </div>

      {/* Speech bubble above the head. It sits outside the SVG so it never flips. */}
      <div
        style={{
          position: 'absolute',
          left: '-50%',
          right: '-50%',
          bottom: '100%',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          ref={bubbleRef}
          style={{
            opacity: 0,
            marginBottom: 6,
            padding: '0.3em 0.7em',
            borderRadius: '0.9em',
            background: '#ffffff',
            color: '#1d2a48',
            fontWeight: 700,
            fontSize: 'max(12px, 1.7vh)',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          }}
        />
      </div>
    </div>
  );
}
