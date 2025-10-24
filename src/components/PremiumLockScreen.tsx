import { Lock, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const PremiumLockScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full glass-effect p-8 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">Treść Premium</h1>
          <p className="text-muted-foreground">
            Ten trening jest dostępny tylko dla użytkowników premium
          </p>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">Nieograniczony dostęp do wszystkich treningów premium</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">Spersonalizowane plany treningowe</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">Dostęp do ekskluzywnych wyzwań</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={() => navigate('/pricing')}
            className="w-full"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Zostań Premium
          </Button>
          <Button 
            onClick={() => navigate('/training/library')}
            variant="outline"
            className="w-full"
          >
            Przeglądaj darmowe treningi
          </Button>
        </div>
      </Card>
    </div>
  );
};
