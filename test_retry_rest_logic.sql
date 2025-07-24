-- Test script for the new retry and rest day logic
-- This script tests the handle_challenge_day_status_change function

-- Test scenario: User fails day 2 and then sets day 3 as rest

-- First, let's create a test challenge and user
-- (This assumes you have test data or can create it)

-- Test 1: Mark a day as failed
-- Expected: Retry day should be created on the next day, all subsequent days shifted forward

SELECT 'Test 1: Mark day as failed' as test_name;

-- Example: Mark day 2024-07-09 as failed
-- CALL handle_challenge_day_status_change(
--   'test_user_id', 
--   'test_challenge_id', 
--   '2024-07-09'::date, 
--   'failed', 
--   'Test failed day'
-- );

-- Expected result:
-- Day 2024-07-09: status = 'failed'
-- Day 2024-07-10: NEW retry day (is_retry = true, attempt_number = 2)
-- Day 2024-07-11: Original day shifted from 2024-07-10
-- Day 2024-07-12: Original day shifted from 2024-07-11
-- etc.

-- Test 2: Mark a day as rest
-- Expected: Rest day should be created on the next day, all subsequent days shifted forward

SELECT 'Test 2: Mark day as rest' as test_name;

-- Example: Mark day 2024-07-10 as rest
-- CALL handle_challenge_day_status_change(
--   'test_user_id', 
--   'test_challenge_id', 
--   '2024-07-10'::date, 
--   'rest', 
--   'Test rest day'
-- );

-- Expected result:
-- Day 2024-07-10: status = 'rest'
-- Day 2024-07-11: NEW rest day
-- Day 2024-07-12: Original day shifted from 2024-07-11
-- Day 2024-07-13: Original day shifted from 2024-07-12
-- etc.

-- Test 3: Verify day shifting logic
-- This query can be used to verify that days are properly shifted

SELECT 
  calendar_date,
  day_number,
  status,
  is_retry,
  attempt_number,
  title
FROM user_challenge_calendar_days 
WHERE user_id = 'test_user_id' 
  AND challenge_id = 'test_challenge_id'
ORDER BY calendar_date;

-- Expected pattern after failed day:
-- 2024-07-09: failed
-- 2024-07-10: pending (retry)
-- 2024-07-11: pending (original next day)
-- 2024-07-12: pending (original day after next)

-- Expected pattern after rest day:
-- 2024-07-10: rest
-- 2024-07-11: rest (new rest day)
-- 2024-07-12: pending (original next day)
-- 2024-07-13: pending (original day after next)

-- Test 4: Multiple retries
-- Test that multiple retries increment attempt_number correctly

SELECT 'Test 4: Multiple retries' as test_name;

-- After marking the retry day as failed again:
-- CALL handle_challenge_day_status_change(
--   'test_user_id', 
--   'test_challenge_id', 
--   '2024-07-10'::date, 
--   'failed', 
--   'Second attempt failed'
-- );

-- Expected result:
-- Day 2024-07-10: status = 'failed' (retry attempt)
-- Day 2024-07-11: NEW retry day (is_retry = true, attempt_number = 3)
-- All subsequent days shifted forward again

-- Verification query for multiple retries
SELECT 
  calendar_date,
  day_number,
  status,
  is_retry,
  attempt_number,
  title
FROM user_challenge_calendar_days 
WHERE user_id = 'test_user_id' 
  AND challenge_id = 'test_challenge_id'
  AND training_day_id = 'same_training_day_id'
ORDER BY calendar_date, attempt_number;

-- Expected pattern:
-- 2024-07-09: failed, attempt_number = 1
-- 2024-07-10: failed, attempt_number = 2 (retry)
-- 2024-07-11: pending, attempt_number = 3 (retry)
-- etc. 