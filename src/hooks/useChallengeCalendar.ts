import { useState, useEffect, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./use-toast";
import { useAchievementChecker } from "./useAchievementChecker";

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
      const { data, error: fetchError } = await supabase.rpc(
        "get_user_challenge_calendar",
        {
          p_user_id: user.id,
          p_challenge_id: challengeId,
        }
      );

      if (fetchError) throw fetchError;

      setCalendarDays(data || []);
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
      const { data, error: fetchError } = await supabase.rpc(
        "get_next_available_challenge_day",
        {
          p_user_id: user.id,
          p_challenge_id: challengeId,
        }
      );

      if (fetchError) throw fetchError;

      setNextAvailableDay(data?.[0] || null);
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
        const { error: generateError } = await supabase.rpc(
          "generate_user_challenge_calendar",
          {
            p_user_id: user.id,
            p_challenge_id: challengeId,
            p_start_date: startDate.toISOString().split("T")[0],
          }
        );

        if (generateError) throw generateError;

        // Reload the calendar after generation
        await loadCalendar();
        await loadNextAvailableDay();

        toast({
          title: "Calendar Generated",
          description: "Your challenge calendar has been created successfully!",
        });
      } catch (err) {
        console.error("Error generating challenge calendar:", err);
        setError("Failed to generate challenge calendar");
        toast({
          title: "Error",
          description: "Failed to generate challenge calendar",
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
        // Mark challenge participant as completed
        const { error: completionError } = await supabase
          .from("challenge_participants")
          .update({
            completed: true,
            status: "completed",
          })
          .eq("challenge_id", challengeId)
          .eq("user_id", user.id);

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
          description: "Congratulations! You've completed this challenge!",
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
        const { error: statusError } = await supabase.rpc(
          "handle_challenge_day_status_change",
          {
            p_user_id: user.id,
            p_challenge_id: challengeId,
            p_calendar_date: calendarDate,
            p_new_status: newStatus,
            p_notes: notes || null,
          }
        );

        // The handle_challenge_day_status_change function already handles failed status logic
        // by creating a retry day when a day is marked as failed

        if (statusError) throw statusError;

        // Reload calendar and next available day
        await loadCalendar();
        await loadNextAvailableDay();

        console.log("newStatus");
        console.log(newStatus);

        // Check if challenge is completed after this day completion
        if (newStatus === "completed") {
          await checkChallengeCompletion();
        }

        const statusMessages = {
          completed: "Day completed successfully!",
          failed: "Day marked as failed. You can retry tomorrow.",
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

      try {
        const { data, error: accessError } = await supabase.rpc(
          "can_access_challenge_day",
          {
            p_user_id: user.id,
            p_challenge_id: challengeId,
            p_calendar_date: calendarDate,
          }
        );

        if (accessError) throw accessError;

        return data || false;
      } catch (err) {
        console.error("Error checking day access:", err);
        return false;
      }
    },
    [user?.id, challengeId]
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
