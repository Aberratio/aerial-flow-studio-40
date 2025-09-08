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

  // Load calendar days for the user's challenge
  const loadCalendar = useCallback(async () => {
    if (!user?.id || !challengeId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get user progress for this challenge
      const { data: progressData, error: progressError } = await supabase
        .from('challenge_day_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId);

      if (progressError) throw progressError;

      // Get training days for this challenge to combine with progress
      const { data: trainingDays, error: trainingDaysError } = await supabase
        .from('challenge_training_days')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('day_number');

      if (trainingDaysError) throw trainingDaysError;

      // Transform the data to match CalendarDay interface
      const calendarDays: CalendarDay[] = progressData?.map(day => {
        const trainingDay = trainingDays?.find(td => td.id === day.training_day_id);
        return {
          id: day.id,
          calendar_date: new Date().toISOString().split('T')[0], // Simplified for now
          training_day_id: day.training_day_id,
          day_number: trainingDay?.day_number || 0,
          title: trainingDay?.title || null,
          description: trainingDay?.description || null,
          is_rest_day: false, // Removed from new structure
          status: day.status,
          is_retry: false, // Removed from new structure
          attempt_number: day.attempt_number,
          exercises_completed: day.exercises_completed || 0,
          total_exercises: day.total_exercises || 0,
          notes: day.notes,
          completed_at: day.changed_status_at,
          is_today: false, // Will be calculated if needed
          is_past: false, // Will be calculated if needed
          is_accessible: true // Will be calculated if needed
        };
      }) || [];

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
    if (!user?.id || !challengeId) return;

    try {
      // Get participant data to find next available day
      const { data: participant, error: participantError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .single();

      if (participantError) throw participantError;

      if (participant) {
        // Get the next training day (use day 1 for now as a fallback)
        const { data: nextDay, error: nextDayError } = await supabase
          .from('challenge_training_days')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('day_number', 1)
          .single();

        if (nextDayError || !nextDay) {
          setNextAvailableDay(null);
          return;
        }

        setNextAvailableDay({
          calendar_date: new Date().toISOString().split('T')[0],
          training_day_id: nextDay.id,
          day_number: nextDay.day_number,
          is_rest_day: false,
          is_retry: false,
          attempt_number: 1,
          total_exercises: 0
        });
      }
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
  const checkChallengeCompletion = useCallback(async () => {
    if (!user?.id || !challengeId) return;

    try {
      // Check if all training days are completed
      const totalTrainingDays = calendarDays.filter(
        (day) => !day.is_rest_day
      ).length;
      const completedTrainingDays = calendarDays.filter(
        (day) => !day.is_rest_day && day.status === "completed"
      ).length;

      if (
        totalTrainingDays > 0 &&
        completedTrainingDays + 1 >= totalTrainingDays
      ) {
        // Award completion points and mark challenge as completed
        const { error: completionError } = await supabase.rpc(
          'award_challenge_completion_points',
          {
            p_user_id: user.id,
            p_challenge_id: challengeId
          }
        );

        if (completionError) {
          console.error(
            "Error marking challenge as completed:",
            completionError
          );
          return;
        }

        // Check for achievements
        await checkChallengeCompletionAchievements(challengeId);

        toast({
          title: "Challenge Completed! 🎉",
          description: "Congratulations! You've completed this challenge and earned 50 points!",
        });
      }
    } catch (error) {
      console.error("Error checking challenge completion:", error);
    }
  }, [
    user,
    challengeId,
    calendarDays,
    checkChallengeCompletionAchievements,
    toast,
  ]);

  // Handle day status change (completed, failed, rest)
  const changeDayStatus = useCallback(
    async (
      calendarDate: string,
      newStatus: "completed" | "failed" | "rest",
      notes?: string
    ) => {
      if (!user?.id || !challengeId) return;

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

        if (!participant) return;

        // Get the training day (use day 1 for now as fallback)
        const { data: trainingDay, error: trainingDayError } = await supabase
          .from('challenge_training_days')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('day_number', 1)
          .single();

        if (trainingDayError || !trainingDay) return;

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

        // Check if challenge is completed after this day completion
        if (newStatus === "completed") {
          await checkChallengeCompletion();
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
      } catch (err) {
        console.error("Error changing day status:", err);
        setError("Failed to update day status");
        toast({
          title: "Error",
          description: "Failed to update day status",
          variant: "destructive",
        });
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
  };
};
