'use client';

import { useEffect, useRef } from 'react';
import { handleCountdownAnnouncements } from '../lib/audio';

export function useAudio(hours, minutes, seconds) {
  const prevTimeRef = useRef({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Only trigger announcements when time changes
    if (
      prevTimeRef.current.hours !== hours ||
      prevTimeRef.current.minutes !== minutes ||
      prevTimeRef.current.seconds !== seconds
    ) {
      handleCountdownAnnouncements(hours, minutes, seconds);
      prevTimeRef.current = { hours, minutes, seconds };
    }
  }, [hours, minutes, seconds]);
}
