import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useTrainingBookmarks = (userId: string | undefined) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBookmarkedIds([]);
      setIsLoading(false);
      return;
    }
    fetchBookmarks();
  }, [userId]);

  async function fetchBookmarks() {
    try {
      const { data, error } = await supabase
        .from('user_training_bookmarks')
        .select('training_id')
        .eq('user_id', userId!);

      if (error) throw error;
      setBookmarkedIds(data?.map(b => b.training_id) || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleBookmark(trainingId: string) {
    if (!userId) {
      toast({
        title: "Zaloguj się",
        description: "Musisz być zalogowany, aby zapisywać treningi.",
        variant: "destructive",
      });
      return;
    }

    const isBookmarked = bookmarkedIds.includes(trainingId);
    
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('user_training_bookmarks')
          .delete()
          .eq('user_id', userId!)
          .eq('training_id', trainingId);

        if (error) throw error;
        setBookmarkedIds(prev => prev.filter(id => id !== trainingId));
        toast({
          title: "Usunięto z ulubionych",
          description: "Trening został usunięty z zakładek.",
        });
      } else {
        const { error } = await supabase
          .from('user_training_bookmarks')
          .insert({ user_id: userId!, training_id: trainingId });

        if (error) throw error;
        setBookmarkedIds(prev => [...prev, trainingId]);
        toast({
          title: "Dodano do ulubionych",
          description: "Trening został zapisany w zakładkach.",
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać zmiany.",
        variant: "destructive",
      });
    }
  }

  return { 
    bookmarkedIds, 
    toggleBookmark, 
    isLoading,
    isBookmarked: (id: string) => bookmarkedIds.includes(id)
  };
};
