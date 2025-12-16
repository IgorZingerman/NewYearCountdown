'use client';

import { useConfig } from '../hooks/useConfig';
import { useCountdown } from '../hooks/useCountdown';
import { useAudio } from '../hooks/useAudio';
import CountdownDisplay from '../components/CountdownDisplay';
import Snowflakes from '../components/Snowflakes';
import Yeti from '../components/Yeti';
import Scenery from '../components/Scenery';
import Link from 'next/link';

export default function HomePage() {
  const { config, loading } = useConfig();
  const countdown = useCountdown(config?.targetDate);
  
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
      <Scenery />

      {/* Yeti Character */}
      <Yeti />

      {/* Snowflakes */}
      {config.snowflakes?.enabled && (
        <Snowflakes
          enabled={config.snowflakes.enabled}
          count={config.snowflakes.count}
          speed={config.snowflakes.speed}
          options={config.snowflakes.options}
          color={config.snowflakes.color?.value}
          rotateColors={config.snowflakes.color?.rotate}
          colorRotationOptions={config.snowflakes.color?.rotationOptions}
          colorRotationFrequency={config.snowflakes.color?.frequency}
        />
      )}

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
          rotateFonts={config.font?.rotate}
          fontRotationOptions={config.font?.rotationOptions}
          defaultFont={config.font?.name}
          rotateFrequency={config.font?.frequency}
          color={config.color?.value}
          rotateColors={config.color?.rotate}
          colorRotationOptions={config.color?.rotationOptions}
          colorRotationFrequency={config.color?.frequency}
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
