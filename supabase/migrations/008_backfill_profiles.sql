-- Re-run profile backfill in case any users were created without triggering the insert
-- (e.g. created via Supabase admin panel or before the trigger existed)
INSERT INTO profiles (id, email, name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      email = EXCLUDED.email
WHERE profiles.name IS NULL OR profiles.name = '';
