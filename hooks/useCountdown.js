'use client';

import { useState, useEffect } from 'react';

export function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        return {
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
          isExpired: true,
        };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return {
        hours,
        minutes,
        seconds,
        total: difference,
        isExpired: false,
      };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatTime = (value) => {
    return value.toString().padStart(2, '0');
  };

  return {
    ...timeLeft,
    formatted: {
      hours: formatTime(timeLeft.hours),
      minutes: formatTime(timeLeft.minutes),
      seconds: formatTime(timeLeft.seconds),
    },
    timeString: `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`,
    isGreen: timeLeft.minutes !== 0 || timeLeft.hours !== 0,
  };
}
