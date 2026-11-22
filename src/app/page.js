'use client';

import { useConfig } from '../hooks/useConfig';
import { snowSettings } from '../lib/config';
import { useCountdown } from '../hooks/useCountdown';
import { useAudio } from '../hooks/useAudio';
import CountdownDisplay from '../components/CountdownDisplay';
import Snowflakes from '../components/Snowflakes';
import Fireworks from '../components/Fireworks';
import Characters from '../components/characters/Characters';
import Scenery from '../components/Scenery';
import Link from 'next/link';

export default function HomePage() {
  const { config, loading } = useConfig();
  const countdown = useCountdown(config?.targetDate);
  const snow = snowSettings(config?.snowflakes);
  
  // Handle audio announcements
  useAudio(countdown.hours, countdown.minutes, countdown.seconds);

  if (loading || !config) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <main style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Background Scenery */}
      <Scenery targetDate={config.targetDate} />

      {/* The yeti and his friends */}
      <Characters celebrating={countdown.isExpired} hoursLeft={countdown.total > 0 ? countdown.hours : null} />

      {/* Snowflakes - stop when countdown expires */}
      {config.snowflakes?.enabled && !countdown.isExpired && (
        <Snowflakes enabled count={snow.count} speed={snow.speed} />
      )}

      {/* Fireworks - show when countdown expires */}
      {countdown.isExpired && <Fireworks />}

      {/* Countdown Display */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
      }}>
        <CountdownDisplay
          hours={countdown.hours}
          minutes={countdown.minutes}
          seconds={countdown.seconds}
          isExpired={countdown.isExpired}
          targetDate={config.targetDate}
          celebrationMessage={config.celebrationMessage}
          rotateFonts={config.font?.rotate}
          fontRotationOptions={config.font?.rotationOptions}
          defaultFont={config.font?.name}
          color={config.color?.value}
          rotateColors={config.color?.rotate}
          colorRotationOptions={config.color?.rotationOptions}
          isGreen={countdown.isGreen}
        />
      </div>

      {/* Settings Link */}
      <Link
        href="/settings"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#ffffff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          zIndex: 30,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
      >
        ⚙️ Settings
      </Link>
    </main>
  );
}
