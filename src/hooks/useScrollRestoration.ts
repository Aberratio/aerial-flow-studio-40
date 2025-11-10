import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Save scroll position when leaving page
    const saveScrollPosition = () => {
      sessionStorage.setItem(
        `scroll-${location.pathname}`,
        window.scrollY.toString()
      );
    };

    window.addEventListener('beforeunload', saveScrollPosition);

    // Restore scroll position
    const savedPosition = sessionStorage.getItem(`scroll-${location.pathname}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
    }

    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, [location.pathname]);
};
