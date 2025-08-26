import { useEffect, useRef, useState } from 'react';

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = async () => {
    if (!isSupported) return false;

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      
      // Listen for wake lock release
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
      });

      return true;
    } catch (error) {
      console.warn('Wake Lock request failed:', error);
      return false;
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
      } catch (error) {
        console.warn('Wake Lock release failed:', error);
      }
    }
  };

  // Auto-release when component unmounts
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Re-request wake lock when page becomes visible (handles iOS Safari edge cases)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, isSupported]);

  return {
    isSupported,
    isActive,
    requestWakeLock,
    releaseWakeLock,
  };
}