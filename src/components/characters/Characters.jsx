'use client';

import { useState } from 'react';
import Yeti from './Yeti';
import BearCub from './BearCub';
import Penguin from './Penguin';
import Bunny from './Bunny';
import Snowman from './Snowman';
import Owl from './Owl';

/**
 * The yeti and his friends. They share a `world` object so they can react to
 * each other (for example the cub follows the yeti), and all celebrate when
 * the countdown ends: the wanderers run to their spots, the snowman comes
 * alive and the owl flaps.
 *
 * Click any of them to make them react. See Actor.jsx for how a character is
 * put together.
 */
export default function Characters({ celebrating }) {
  const [world] = useState(() => ({
    yeti: { x: 0, dir: 1, depth: 0.5, moving: false },
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>
      <Snowman world={world} celebrating={celebrating} />
      <Owl world={world} celebrating={celebrating} />
      <Bunny world={world} celebrating={celebrating} />
      <Penguin world={world} celebrating={celebrating} />
      <BearCub world={world} celebrating={celebrating} />
      <Yeti world={world} celebrating={celebrating} />
    </div>
  );
}
