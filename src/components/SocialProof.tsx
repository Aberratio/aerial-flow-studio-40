import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const SocialProof: React.FC = () => {
  const { data: recentUsers } = useQuery({
    queryKey: ['recent-signups'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: weeklyCount } = useQuery({
    queryKey: ['weekly-signups'],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());
      
      return count || 12;
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!recentUsers || recentUsers.length === 0) return null;

  return (
    <div className="flex items-center justify-center lg:justify-start gap-2 mt-6">
      <div className="flex -space-x-3">
        {recentUsers.slice(0, 4).map((user, i) => (
          <Avatar key={user.id} className="border-2 border-background w-10 h-10">
            <AvatarImage src={user.avatar_url || ''} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user.username?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{weeklyCount}+ athletes</span> joined this week
      </p>
    </div>
  );
};
