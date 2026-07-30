-- Fix 1: Allow users to SELECT participant rows where their email matches.
-- This is needed when a participant was added by email before they signed up
-- (user_id is NULL) and the trigger hasn't run yet, OR as defense-in-depth.
DROP POLICY IF EXISTS "Users can view participants by email" ON participants;
CREATE POLICY "Users can view participants by email" ON participants
  FOR SELECT USING (email = (auth.jwt() ->> 'email'));

-- Fix 2: Re-run backfill in case 005 was never run.
-- Links existing participant rows to their auth user by matching email.
UPDATE participants p
SET user_id = u.id
FROM auth.users u
WHERE p.email = u.email
  AND (p.user_id IS NULL OR p.user_id != u.id);
