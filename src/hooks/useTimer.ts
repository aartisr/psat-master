import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerOptions {
  initialSeconds?: number;
  autoStart?: boolean;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { initialSeconds = 0, autoStart = true } = options;
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(autoStart);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback((newSeconds = 0) => {
    setSeconds(newSeconds);
    setIsActive(autoStart);
  }, [autoStart]);

  const formatTime = useCallback((totalSecs: number = seconds) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [seconds]);

  return {
    seconds,
    isActive,
    start,
    pause,
    reset,
    formatTime
  };
}
