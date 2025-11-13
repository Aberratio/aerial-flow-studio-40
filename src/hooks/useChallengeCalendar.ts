import { useState, useEffect, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./use-toast";
import { useAchievementChecker } from "./useAchievementChecker";
import { useUserRole } from "./useUserRole";

export interface CalendarDay {
  id: string;
  calendar_date: string;
  training_day_id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  is_rest_day: boolean;
  status: string;
  is_retry: boolean;
  attempt_number: number;
  exercises_completed: number;
  total_exercises: number;
  notes: string | null;
  completed_at: string | null;
  is_today: boolean;
  is_past: boolean;
  is_accessible: boolean;
}

export interface NextAvailableDay {
  calendar_date: string;
  training_day_id: string;
  day_number: number;
  is_rest_day: boolean;
  is_retry: boolean;
  attempt_number: number;
  total_exercises: number;
}

export const useChallengeCalendar = (challengeId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkChallengeCompletionAchievements } = useAchievementChecker();
  const { isAdmin } = useUserRole();
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [nextAvailableDay, setNextAvailableDay] =
    useState<NextAvailableDay | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [challengeCompletionData, setChallengeCompletionData] = useState<{
    title: string;
    totalDays: number;
    pointsEarned: number;
  } | null>(null);

  // Load calendar days for the user's challenge
  const loadCalendar = useCallback(async () => {
    if (!user?.id || !challengeId) {
      console.log("loadCalendar: Missing user or challengeId", { userId: user?.id, challengeId });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("loadCalendar: Starting calendar load for", { userId: user.id, challengeId });
      
      // Use the existing SQL function to get available challenge days
      const { data: availableDays, error: availableError } = await supabase
        .rpc('get_user_available_challenge_days', {
          p_user_id: user.id,
          p_challenge_id: challengeId
        });

      if (availableError) {
        console.error("Error getting available days:", availableError);
        throw availableError;
      }

      console.log("loadCalendar: Available days from RPC:", availableDays);

      // Get progress data to merge with available days
      const { data: progressData, error: progressError } = await supabase
        .from("challenge_day_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId);

      if (progressError) {
        console.error("Error getting progress:", progressError);
        throw progressError;
      }

      console.log("loadCalendar: Progress data:", progressData);

      // Get user's start date from challenge_participants
      const { data: participantData } = await supabase
        .from("challenge_participants")
        .select("user_started_at")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .single();

      const userStartDate = participantData?.user_started_at 
        ? new Date(participantData.user_started_at) 
        : new Date();

      // Create calendar days by merging available days with progress
      const calendarDays: CalendarDay[] = (availableDays || []).map((day: any) => {
        const progress = progressData?.find(p => p.training_day_id === day.training_day_id);
        
        // Calculate calendar_date properly
        let calendarDate: string;
        if (day.calendar_date) {
          // Use calendar_date from available days RPC
          calendarDate = day.calendar_date;
        } else {
          // Fallback: calculate from user_started_at + day_number
          const calculatedDate = new Date(userStartDate);
          calculatedDate.setDate(calculatedDate.getDate() + (day.day_number - 1));
          calendarDate = calculatedDate.toISOString().split('T')[0];
        }
        
        return {
          id: progress?.id || `${day.training_day_id}_placeholder`,
          calendar_date: calendarDate,
          training_day_id: day.training_day_id,
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          is_rest_day: day.total_exercises === 0, // Rest day if no exercises
          status: progress?.status || day.status || "pending",
          is_retry: false,
          attempt_number: progress?.attempt_number || 1,
          exercises_completed: progress?.exercises_completed || 0,
          total_exercises: day.total_exercises || 0,
          notes: progress?.notes || null,
          completed_at: progress?.changed_status_at || day.completed_at,
          is_today: false,
          is_past: false,
          is_accessible: day.is_accessible
        };
      });

      console.log("loadCalendar: Final calendar days:", calendarDays);
      setCalendarDays(calendarDays);
    } catch (err) {
      console.error("Error loading challenge calendar:", err);
      setError("Failed to load challenge calendar");
      toast({
        title: "Error",
        description: "Failed to load challenge calendar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, challengeId, toast]);

  // Load next available day
  const loadNextAvailableDay = useCallback(async () => {
    if (!user?.id || !challengeId) {
      console.log("loadNextAvailableDay: Missing user or challengeId", { userId: user?.id, challengeId });
      return;
    }

    try {
      console.log("loadNextAvailableDay: Using RPC to get next day");
      
      // Use the existing SQL function to get the next available day
      const { data: nextDayData, error: nextDayError } = await supabase
        .rpc('get_next_available_challenge_day', {
          p_user_id: user.id,
          p_challenge_id: challengeId
        });

      if (nextDayError) {
        console.error("Error getting next available day:", nextDayError);
        throw nextDayError;
      }

      console.log("loadNextAvailableDay: Next day data from RPC:", nextDayData);
      
      // Convert to expected format
      const nextDay = nextDayData && nextDayData.length > 0 ? {
        calendar_date: new Date().toISOString().split('T')[0],
        training_day_id: nextDayData[0].training_day_id,
        day_number: nextDayData[0].day_number,
        is_rest_day: nextDayData[0].total_exercises === 0,
        is_retry: false,
        attempt_number: 1,
        total_exercises: nextDayData[0].total_exercises
      } : null;

      console.log("loadNextAvailableDay: Setting next available day:", nextDay);
      setNextAvailableDay(nextDay);
    } catch (err) {
      console.error("Error loading next available day:", err);
    }
  }, [user?.id, challengeId]);

  // Generate initial calendar when user joins a challenge
  const generateCalendar = useCallback(
    async (startDate: Date) => {
      if (!user?.id || !challengeId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Simply reload the calendar and next available day
        // The participant record should already exist from joining
        await loadCalendar();
        await loadNextAvailableDay();

        toast({
          title: "Ready to Start",
          description: "Your challenge is ready to begin!",
        });
      } catch (err) {
        console.error("Error preparing challenge:", err);
        setError("Failed to prepare challenge");
        toast({
          title: "Error",
          description: "Failed to prepare challenge",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, challengeId, loadCalendar, loadNextAvailableDay, toast]
  );

  // Check if challenge is completed and handle achievements
  const checkChallengeCompletion = async () => {
    if (!user || !challengeId) return;

    try {
      // Get all calendar days (including rest days)
      const { data: allDays, error: daysError } = await supabase
        .from('challenge_training_days')
        .select('id, day_number')
        .eq('challenge_id', challengeId)
        .order('day_number');

      if (daysError) throw daysError;

      // Get user's completed days (including rest days)
      const { data: userProgress, error: progressError } = await supabase
        .from('challenge_day_progress')
        .select('training_day_id, status')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .eq('status', 'completed');

      if (progressError) throw progressError;

      const totalDays = allDays?.length || 0;
      const completedDays = userProgress?.length || 0;

      console.log('Challenge completion check:', {
        challengeId,
        totalDays,
        completedDays,
        isComplete: completedDays >= totalDays
      });

      // Check if ALL days are completed (fixed logic: >= instead of +1 >=)
      if (completedDays >= totalDays && totalDays > 0) {
        console.log('Challenge completed! Awarding points...');
        
        // Call the database function to award points
        const { error: awardError } = await supabase.rpc(
          'award_challenge_completion_points',
          {
            p_user_id: user.id,
            p_challenge_id: challengeId,
          }
        );

        if (awardError) {
          console.error('Error awarding challenge completion points:', awardError);
          return false;
        }

        console.log('Challenge completion points awarded successfully');
        
        // Check for achievements
        await checkChallengeCompletionAchievements(challengeId);

        // Get challenge details for celebration
        const { data: challengeData } = await supabase
          .from('challenges')
          .select('title')
          .eq('id', challengeId)
          .single();

        // Set celebration data and show modal
        setChallengeCompletionData({
          title: challengeData?.title || 'Challenge',
          totalDays: totalDays,
          pointsEarned: 50
        });
        setShowCelebration(true);
        return true; // Return true to signal completion
      }
      return false;
    } catch (error) {
      console.error("Error checking challenge completion:", error);
      return false;
    }
  };

  // Handle day status change (completed, failed, rest)
  const changeDayStatus = useCallback(
    async (
      calendarDate: string,
      newStatus: "completed" | "failed" | "rest",
      notes?: string
    ) => {
      if (!user?.id || !challengeId) return false;

      setIsLoading(true);
      setError(null);

      try {
        // Get current participant data
        const { data: participant, error: participantError } = await supabase
          .from('challenge_participants')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeId)
          .single();

        if (participantError) throw participantError;

        if (!participant) return false;

        // Get the training day (use day 1 for now as fallback)
        const { data: trainingDay, error: trainingDayError } = await supabase
          .from('challenge_training_days')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('day_number', 1)
          .single();

        if (trainingDayError || !trainingDay) return false;

        // Create or update progress record
        const { error: progressError } = await supabase
          .from('challenge_day_progress')
          .upsert({
            user_id: user.id,
            challenge_id: challengeId,
            training_day_id: trainingDay.id,
            status: newStatus,
            notes: notes || null,
            changed_status_at: new Date().toISOString()
          });

        if (progressError) throw progressError;

        // Update participant if completed (simplified for now)
        if (newStatus === "completed") {
          const { error: updateError } = await supabase
            .from('challenge_participants')
            .update({
              status: 'active',
              completed: false
            })
            .eq('user_id', user.id)
            .eq('challenge_id', challengeId);

          if (updateError) throw updateError;
        }

        // Reload calendar and next available day
        await loadCalendar();
        await loadNextAvailableDay();

        // Check if challenge is completed after this day completion and return result
        let isCompleted = false;
        if (newStatus === "completed") {
          isCompleted = await checkChallengeCompletion();
        }

        const statusMessages = {
          completed: "Day completed successfully!",
          failed: "Day marked as failed.",
          rest: "Rest day completed. Take time to recover!",
        };

        toast({
          title: "Status Updated",
          description: statusMessages[newStatus],
        });
        
        return isCompleted;
      } catch (err) {
        console.error("Error changing day status:", err);
        setError("Failed to update day status");
        toast({
          title: "Error",
          description: "Failed to update day status",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      user?.id,
      challengeId,
      loadCalendar,
      loadNextAvailableDay,
      checkChallengeCompletion,
      toast,
    ]
  );

  // Check if user can access a specific calendar day
  const canAccessDay = useCallback(
    async (calendarDate: string): Promise<boolean> => {
      if (!user?.id || !challengeId) return false;

      // Admin users can access any challenge day
      if (isAdmin) return true;

      try {
        // Simple check: user can access if they're a participant
        const { data: participant, error: participantError } = await supabase
          .from('challenge_participants')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeId)
          .single();

        if (participantError) return false;

        // For now, always return true for simplicity
        return true;
      } catch (err) {
        console.error("Error checking day access:", err);
        return false;
      }
    },
    [user?.id, challengeId, isAdmin]
  );

  // Get calendar day by date
  const getCalendarDay = useCallback(
    (calendarDate: string): CalendarDay | null => {
      return (
        calendarDays.find((day) => day.calendar_date === calendarDate) || null
      );
    },
    [calendarDays]
  );

  // Get calendar day by training day ID
  const getCalendarDayByTrainingDay = useCallback(
    (id: string): CalendarDay | null => {
      return calendarDays.find((day) => day.id === id) || null;
    },
    [calendarDays]
  );

  // Get all completed days
  const getCompletedDays = useCallback((): CalendarDay[] => {
    return calendarDays.filter((day) => day.status === "completed");
  }, [calendarDays]);

  // Get all failed days
  const getFailedDays = useCallback((): CalendarDay[] => {
    return calendarDays.filter((day) => day.status === "failed");
  }, [calendarDays]);

  // Get all rest days
  const getRestDays = useCallback((): CalendarDay[] => {
    return calendarDays.filter((day) => day.status === "rest");
  }, [calendarDays]);

  // Get pending days
  const getPendingDays = useCallback((): CalendarDay[] => {
    return calendarDays.filter((day) => day.status === "pending");
  }, [calendarDays]);

  // Get today's calendar day
  const getTodayCalendarDay = useCallback((): CalendarDay | null => {
    const today = new Date().toISOString().split("T")[0];
    return getCalendarDay(today);
  }, [getCalendarDay]);

  // Load initial data
  useEffect(() => {
    if (user?.id && challengeId) {
      loadCalendar();
      loadNextAvailableDay();
    }
  }, [user?.id, challengeId, loadCalendar, loadNextAvailableDay]);

  return {
    calendarDays,
    nextAvailableDay,
    isLoading,
    error,
    generateCalendar,
    changeDayStatus,
    canAccessDay,
    getCalendarDay,
    getCalendarDayByTrainingDay,
    getCompletedDays,
    getFailedDays,
    getRestDays,
    getPendingDays,
    getTodayCalendarDay,
    loadCalendar,
    loadNextAvailableDay,
    showCelebration,
    setShowCelebration,
    challengeCompletionData,
  };
};
