'use client';

import { useEffect, useRef } from 'react';

const COLORS = [
  '#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585',
  '#b5179e', '#ffffff', '#ff9e00', '#7bf1a8',
];

const GRAVITY = 0.06; // px per frame^2 (at 60fps)
const TRAIL_FADE = 0.18; // higher = shorter trails

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Full-screen canvas fireworks. Rockets launch from the bottom, explode into
 * bursts of particles that fall and fade. Transparent background so the scene
 * (stars, mountains, yeti) stays visible.
 */
export default function Fireworks({ intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fewer, gentler bursts for people who prefer reduced motion
    const rate = (reducedMotion ? 0.4 : 1) * intensity;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rockets = [];
    const particles = [];

    const launchRocket = (x = rand(width * 0.1, width * 0.9)) => {
      const targetY = rand(height * 0.12, height * 0.45);
      const flightFrames = rand(40, 65);
      rockets.push({
        x,
        y: height,
        vx: rand(-0.6, 0.6),
        vy: -(height - targetY) / flightFrames,
        targetY,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    };

    const explode = (x, y, color) => {
      const count = Math.floor(rand(70, 120));
      const kind = Math.random();
      const twoTone = Math.random() < 0.4;
      const altColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < count; i++) {
        let angle = rand(0, Math.PI * 2);
        let speed = rand(1, 5.5);
        if (kind < 0.35) {
          // Ring burst: even angle, uniform speed
          angle = (i / count) * Math.PI * 2;
          speed = 4;
        }
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: rand(0.008, 0.018),
          size: rand(1.5, 3),
          color: twoTone && i % 2 ? altColor : color,
        });
      }
    };

    // Opening salvo so it feels like an immediate celebration
    const salvoTimers = [];
    for (let i = 0; i < 4; i++) {
      salvoTimers.push(setTimeout(() => launchRocket(), i * 250));
    }

    let nextLaunchIn = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const frame = (now) => {
      // Normalise to 60fps so speed is the same on 120Hz displays
      const dt = Math.min((now - lastTime) / (1000 / 60), 3);
      lastTime = now;

      // Fade previous frame to leave trails while keeping the canvas transparent
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(TRAIL_FADE * dt, 1)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      nextLaunchIn -= dt;
      if (nextLaunchIn <= 0) {
        launchRocket();
        nextLaunchIn = rand(15, 45) / rate;
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      salvoTimers.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5, // above scenery (<=2), below the yeti (6) and the message (20)
      }}
    />
  );
}
