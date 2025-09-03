import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Challenge calendar day locking logic
export function isDayLocked(
  dayNumber: number,
  calendarDays: Array<{
    day_number: number;
    status: string;
    calendar_date?: string;
  }>,
  isAdmin?: boolean
): boolean {
  // Admin users can access any day
  if (isAdmin) return false;
  
  // Day 1 is never locked
  if (dayNumber === 1) return false;

  // Check if previous day is completed
  const isPreviousDayCompleted = calendarDays
    .filter((day) => day.day_number === dayNumber - 1)
    .some((day) => day.status === "completed" || day.status === "rest");

  if (!isPreviousDayCompleted) return true;

  // Check if the day date has arrived (only allow access on or after the day's date)
  const currentDay = calendarDays.find((day) => day.day_number === dayNumber);
  if (currentDay?.calendar_date) {
    const dayDate = new Date(currentDay.calendar_date);
    const today = new Date();
    
    // Set time to start of day for comparison
    dayDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // Day is locked if its date is in the future
    if (dayDate > today) return true;
  }

  return false;
}
