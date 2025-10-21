import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';

const CookiesBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookiesAccepted = localStorage.getItem('cookies-accepted');
    if (!cookiesAccepted) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookies-accepted', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-sm border-slate-700 shadow-2xl">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-white text-lg">Używamy plików cookie</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Używamy plików cookie, aby poprawić Twoje doświadczenia, analizować ruch na stronie i personalizować treści. 
                Klikając "Zaakceptuj wszystkie", wyrażasz zgodę na używanie plików cookie.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={rejectCookies}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Odrzuć
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={acceptCookies}
              className="min-w-[120px]"
            >
              Zaakceptuj wszystkie
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookiesBanner;