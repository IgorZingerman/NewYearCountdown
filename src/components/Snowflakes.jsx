'use client';

import { useEffect, useRef } from 'react';
import {
  createFlake,
  createWind,
  flakeCount,
  speedScale,
  stepFlake,
} from '../lib/snow';

/**
 * Natural-looking snowfall drawn on a single canvas.
 *
 * Soft, white flakes in many depth layers (far = small/slow/faint, near =
 * big/fast/bright), each swaying on its own path, pushed together by gentle
 * wind and occasional gusts, with a few crystal-shaped flakes up close.
 * See src/lib/snow.js for the maths.
 *
 * Settings used: `enabled`, `count` (density), `speed` (bigger = slower, as
 * before). The glyph and colour settings only apply to the terminal version.
 */

// Soft round flake: bright core fading smoothly to nothing.
function makeSoftSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.65, 'rgba(235,245,255,0.28)');
  grad.addColorStop(1, 'rgba(235,245,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

// Six-armed crystal with little side branches, with a faint glow behind it.
function makeCrystalSprite() {
  const size = 96;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const mid = size / 2;

  const glow = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  glow.addColorStop(0, 'rgba(255,255,255,0.35)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, size, size);

  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.lineCap = 'round';
  g.translate(mid, mid);
  const arm = mid - 8;
  for (let i = 0; i < 6; i++) {
    g.save();
    g.rotate((i * Math.PI) / 3);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -arm);
    g.stroke();
    g.lineWidth = 2;
    for (const at of [0.45, 0.72]) {
      const y = -arm * at;
      const len = arm * (at === 0.45 ? 0.32 : 0.22);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(-len, y - len);
      g.moveTo(0, y);
      g.lineTo(len, y - len);
      g.stroke();
    }
    g.restore();
  }
  return c;
}

export default function Snowflakes({ enabled = true, count = 40, speed = 4500 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const soft = makeSoftSprite();
    const crystal = makeCrystalSprite();
    const fall = speedScale(speed) * (reduced ? 0.5 : 1);
    const wind = createWind(Math.random, !reduced);

    let width = 0;
    let height = 0;
    let flakes = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const prevW = width;
      const prevH = height;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = flakeCount(count, width, height, reduced);
      if (flakes.length === 0) {
        flakes = Array.from({ length: target }, () => createFlake(width, height));
        return;
      }
      // Keep the existing snowfall; just rescale it to the new window size
      // and add or remove flakes to match the new density.
      for (const f of flakes) {
        f.x = (f.x / prevW) * width;
        f.y = (f.y / prevH) * height;
        f.landY = (f.landY / prevH) * height;
      }
      while (flakes.length < target) flakes.push(createFlake(width, height, Math.random, true));
      if (flakes.length > target) flakes.length = target;
    }

    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    let time = 0;

    function frame(now) {
      // Clamp dt so a background tab coming back doesn't teleport the snow.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const w = wind.step(dt);

      ctx.clearRect(0, 0, width, height);

      // Draw far flakes first so near ones overlap them.
      flakes.sort((a, b) => a.z - b.z);
      for (let i = 0; i < flakes.length; i++) {
        let f = flakes[i];
        stepFlake(f, dt, time, w, fall, width);
        if (f.dead) {
          // Recycle as a brand-new flake just above the top.
          f = flakes[i] = createFlake(width, height, Math.random, false);
        }
        const a = f.alpha * f.fade;
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        if (f.crystal) {
          const s = f.radius * 7;
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.angle);
          ctx.drawImage(crystal, -s / 2, -s / 2, s, s);
          ctx.restore();
        } else {
          const s = f.radius * 3.6;
          ctx.drawImage(soft, f.x - s / 2, f.y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, count, speed]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
