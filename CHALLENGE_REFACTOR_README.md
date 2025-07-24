# Challenge Mechanism Refactor

This document explains the complete refactor of the challenge mechanism in the Aerial Flow Studio application.

## Overview

The challenge mechanism has been completely refactored to provide a more intuitive, maintainable, and robust system for tracking user progress through fitness challenges. The new system treats each calendar day as a separate entity, making it much easier to handle complex scenarios like failed day retries and rest day insertions.

## Key Improvements

### 1. **New Database Structure**

The refactor introduces a new table `user_challenge_calendar_days` that stores each calendar day as a separate entity:

```sql
CREATE TABLE public.user_challenge_calendar_days (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL,
  calendar_date DATE NOT NULL,           -- The actual calendar date
  training_day_id UUID NOT NULL,         -- Reference to the training day
  day_number INTEGER NOT NULL,           -- Original training day number
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, rest, skipped
  is_retry BOOLEAN NOT NULL DEFAULT false, -- Whether this is a retry of a failed day
  attempt_number INTEGER NOT NULL DEFAULT 1, -- Which attempt this is (1 = original, 2+ = retries)
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(user_id, challenge_id, calendar_date),
  UNIQUE(user_id, challenge_id, training_day_id, calendar_date)
);
```

### 2. **Simplified Calendar Generation**

Instead of complex logic to generate calendar days on-the-fly, the new system:

- **Pre-generates** all calendar days when a user joins a challenge
- **Dynamically inserts** retry days when a user fails a day
- **Automatically shifts** subsequent days when a retry or rest day is inserted
- **Maintains clear relationships** between calendar dates and training days

### 3. **Improved Day Status Management**

The new system provides clear, atomic operations for changing day status:

- **Completed**: Day is marked as done, next day is unlocked
- **Failed**: Day is marked as failed, a retry day is automatically inserted on the next day
- **Rest**: Day is marked as rest, a rest day is inserted on the next day

### 4. **Better Retry and Rest Logic**

Failed days and rest days are now handled much more intuitively:

- **Failed Day**: When a day is marked as failed, a new calendar day is automatically inserted on the next day
- **Rest Day**: When a day is marked as rest, a rest day is inserted on the next day
- **Day Shifting**: All subsequent days are shifted forward by one day to accommodate the new day
- **Retry attempts** are clearly tracked with incrementing attempt numbers
- **Users can see** which days are retries in the UI

## Database Functions

### Core Functions

#### `generate_user_challenge_calendar(p_user_id, p_challenge_id, p_start_date)`

Generates the initial calendar for a user when they join a challenge.

#### `handle_challenge_day_status_change(p_user_id, p_challenge_id, p_calendar_date, p_new_status, p_notes)`

Handles day status changes and manages retries/rest day insertions with day shifting.

#### `get_user_challenge_calendar(p_user_id, p_challenge_id)`

Returns all calendar days for a user's challenge with accessibility information.

#### `get_next_available_challenge_day(p_user_id, p_challenge_id)`

Returns the next available day for a user to work on.

#### `can_access_challenge_day(p_user_id, p_challenge_id, p_calendar_date)`

Checks if a user can access a specific calendar day.

### Challenge Management Functions

#### `join_challenge_with_calendar(p_user_id, p_challenge_id, p_start_date)`

Handles the complete process of joining a challenge.

#### `can_join_challenge(p_user_id, p_challenge_id)`

Checks if a user can join a specific challenge.

#### `get_challenge_participation_status(p_user_id, p_challenge_id)`

Returns the participation status of a user for a specific challenge.

## React Hook: `useChallengeCalendar`

The new system provides a comprehensive React hook that encapsulates all the challenge calendar logic:

```typescript
const {
  calendarDays, // All calendar days for the challenge
  nextAvailableDay, // Next day the user can work on
  isLoading, // Loading state
  error, // Error state
  generateCalendar, // Generate initial calendar
  changeDayStatus, // Change day status (completed/failed/rest)
  canAccessDay, // Check if user can access a day
  getCalendarDay, // Get calendar day by date
  getCalendarDayByTrainingDay, // Get calendar day by training day ID
  getCompletedDays, // Get all completed days
  getFailedDays, // Get all failed days
  getRestDays, // Get all rest days
  getPendingDays, // Get all pending days
  getTodayCalendarDay, // Get today's calendar day
  loadCalendar, // Reload calendar data
  loadNextAvailableDay, // Reload next available day
} = useChallengeCalendar(challengeId);
```

## Usage Examples

### Joining a Challenge

```typescript
const { generateCalendar } = useChallengeCalendar(challengeId);

const handleJoinChallenge = async (startDate: Date) => {
  await generateCalendar(startDate);
  // User is now joined and calendar is generated
};
```

### Changing Day Status

```typescript
const { changeDayStatus } = useChallengeCalendar(challengeId);

const handleCompleteDay = async (calendarDate: string) => {
  await changeDayStatus(calendarDate, "completed");
  // Day is marked as completed, next day is unlocked
};

const handleFailDay = async (calendarDate: string) => {
  await changeDayStatus(calendarDate, "failed");
  // Day is marked as failed, retry day is automatically inserted on next day
  // All subsequent days are shifted forward by one day
};

const handleRestDay = async (calendarDate: string) => {
  await changeDayStatus(calendarDate, "rest");
  // Day is marked as rest, rest day is inserted on next day
  // All subsequent days are shifted forward by one day
};
```

### Checking Day Accessibility

```typescript
const { getCalendarDay, canAccessDay } = useChallengeCalendar(challengeId);

const handleDayClick = async (date: Date) => {
  const dateString = format(date, "yyyy-MM-dd");
  const canAccess = await canAccessDay(dateString);

  if (canAccess) {
    const dayInfo = getCalendarDay(dateString);
    if (dayInfo) {
      navigate(`/challenge/${challengeId}/day/${dayInfo.training_day_id}`);
    }
  }
};
```

## Calendar Examples

### Normal Flow

```
Day 1 (July 5): ✅ Completed (Workout Day 1)
Day 2 (July 6): 💪 Pending (Workout Day 2)
Day 3 (July 7): 🌴 Pending (Rest Day)
Day 4 (July 8): 💪 Pending (Workout Day 3)
```

### After Failing Day 2

```
Day 1 (July 5): ✅ Completed (Workout Day 1)
Day 2 (July 6): ❌ Failed (Workout Day 2)
Day 3 (July 7): 🔄 Retry (Workout Day 2 clone) - NEW DAY
Day 4 (July 8): 🌴 Pending (Rest Day) - SHIFTED FROM July 7
Day 5 (July 9): 💪 Pending (Workout Day 3) - SHIFTED FROM July 8
```

### After Setting Day 2 as Rest

```
Day 1 (July 5): ✅ Completed (Workout Day 1)
Day 2 (July 6): 🌿 Rest (Workout Day 2 converted)
Day 3 (July 7): 🌴 Rest Day - NEW DAY
Day 4 (July 8): 💪 Pending (Workout Day 3) - SHIFTED FROM July 7
Day 5 (July 9): 💪 Pending (Workout Day 4) - SHIFTED FROM July 8
```

## Migration Guide

### For Existing Challenges

1. **Run the new migrations** to create the new table structure
2. **Existing data will continue to work** with the old system
3. **New challenges** will use the new system
4. **Gradual migration** can be done by regenerating calendars for existing participants

### For New Features

1. **Use the new `useChallengeCalendar` hook** instead of manual calendar generation
2. **Use the new database functions** for all challenge operations
3. **Follow the new patterns** for day status changes and retry logic

## Benefits

### For Developers

- **Cleaner code**: No more complex calendar generation logic
- **Better separation of concerns**: Calendar logic is encapsulated in the hook
- **Easier testing**: Each function has a single responsibility
- **Type safety**: Full TypeScript support with proper interfaces

### For Users

- **More intuitive**: Calendar days are clearly represented
- **Better feedback**: Clear indication of retry attempts
- **Flexible scheduling**: Rest days can be inserted anywhere
- **Consistent behavior**: Predictable day unlocking logic

### For Performance

- **Faster queries**: Pre-generated calendar days
- **Better indexing**: Optimized for common access patterns
- **Reduced complexity**: Simpler database queries
- **Scalable**: Can handle complex challenge scenarios

## Files Modified/Created

### New Files

- `supabase/migrations/20250722000000-refactor-challenge-mechanism.sql`
- `supabase/migrations/20250722000001-update-types-for-refactored-challenge.sql`
- `supabase/migrations/20250722000002-update-join-challenge-flow.sql`
- `src/hooks/useChallengeCalendar.ts`
- `src/pages/ChallengePreviewRefactored.tsx`
- `src/pages/ChallengeDayOverviewRefactored.tsx`

### Key Features

- **Atomic operations**: Each status change is handled as a single transaction
- **Automatic retry management**: Failed days automatically create retry opportunities
- **Flexible rest day insertion**: Rest days can be inserted anywhere without breaking the flow
- **Clear progress tracking**: Easy to see which days are completed, failed, or pending
- **Robust error handling**: Comprehensive error states and recovery mechanisms

This refactor provides a solid foundation for future challenge features while maintaining backward compatibility with existing functionality.
