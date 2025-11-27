import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle } from 'lucide-react';

export const ProfileCompletionCard = () => {
  const { user } = useAuth();
  const [completion, setCompletion] = useState({
    hasAvatar: false,
    hasBio: false,
    hasSports: false,
    hasPost: false,
    hasFriend: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkCompletion();
    }
  }, [user]);

  const checkCompletion = async () => {
    if (!user) return;

    try {
      // Fetch profile data for sports info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('sports')
        .eq('id', user.id)
        .single();

      // Check profile data
      const hasAvatar = !!user.avatar_url;
      const hasBio = !!user.bio && user.bio.length > 0;
      const hasSports = !!profileData?.sports && profileData.sports.length > 0;

      // Check if user has at least one post
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check if user has at least one friend
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      setCompletion({
        hasAvatar,
        hasBio,
        hasSports,
        hasPost: (postCount || 0) > 0,
        hasFriend: (friendCount || 0) > 0,
      });
    } catch (error) {
      console.error('Error checking completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionItems = [
    { key: 'hasAvatar', label: 'Dodaj zdjęcie profilowe', value: 20 },
    { key: 'hasBio', label: 'Napisz opis profilu', value: 20 },
    { key: 'hasSports', label: 'Wybierz swoje dyscypliny', value: 20 },
    { key: 'hasPost', label: 'Dodaj pierwszy post', value: 20 },
    { key: 'hasFriend', label: 'Dodaj pierwszego znajomego', value: 20 },
  ];

  const completedCount = Object.values(completion).filter(Boolean).length;
  const completionPercent = (completedCount / completionItems.length) * 100;

  if (loading || completionPercent === 100) return null;

  const nextIncomplete = completionItems.find(item => !completion[item.key as keyof typeof completion]);

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-purple-500/30 overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Progress Circle */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-white/10"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionPercent / 100)}`}
                className="text-purple-400 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{Math.round(completionPercent)}%</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">Uzupełnij swój profil</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              {nextIncomplete?.label} aby odblokować więcej funkcji
            </p>

            {/* Checklist - only on desktop */}
            <div className="hidden sm:block space-y-2 mb-4">
              {completionItems.map((item) => {
                const isComplete = completion[item.key as keyof typeof completion];
                return (
                  <div key={item.key} className="flex items-center gap-2 text-xs">
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/30" />
                    )}
                    <span className={isComplete ? 'text-white/70 line-through' : 'text-white'}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
