import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/hooks/use-toast';

export const UpdateChecker = () => {
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      
      // Check for updates every 60 minutes
      r && setInterval(() => {
        console.log('SW checking for updates...');
        r.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      console.log('New version detected, starting countdown...');
      // Show toast and start countdown
      setCountdown(3);
      
      toast({
        title: "Nowa wersja dostępna!",
        description: "Aktualizuję aplikację za 3 sekundy...",
        duration: 3000,
      });
    }
  }, [needRefresh]);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      console.log('Updating service worker and reloading...');
      // Update and reload
      updateServiceWorker(true);
      return;
    }
    
    // Countdown timer
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, updateServiceWorker]);

  return null; // This is a headless component
};
