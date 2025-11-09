import { useEffect } from 'react';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useVersionCheck = () => {
  useEffect(() => {
    let initialVersion: string | null = null;

    const checkVersion = async () => {
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const data = await response.json();
        
        if (!initialVersion) {
          initialVersion = data.version;
          console.log('Initial version:', initialVersion);
          return;
        }
        
        if (data.version !== initialVersion) {
          console.log('New version detected via version.json:', data.version);
          // Force reload
          window.location.reload();
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    // Check immediately
    checkVersion();
    
    // Check periodically
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);
};
