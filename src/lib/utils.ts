import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Challenge calendar day locking logic
export function isDayLocked(
  dayNumber: number,
  calendarDays: Array<{
    day_number: number;
    status: string;
  }>
): boolean {
  // Day 1 is never locked
  if (dayNumber === 1) return false;
  
  // Check if previous day is completed
  const previousDay = calendarDays.find(day => day.day_number === dayNumber - 1);
  return !previousDay || previousDay.status !== 'completed';
}
