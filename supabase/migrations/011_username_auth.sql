-- Add username column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Backfill existing users: derive username from email prefix
UPDATE profiles
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL AND email IS NOT NULL;

-- Unique constraint (after backfill to avoid conflicts)
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- RPC: look up email by username
-- SECURITY DEFINER so unauthenticated users can call it from the login page
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM profiles
  WHERE lower(username) = lower(p_username)
  LIMIT 1;
  RETURN v_email;
END;
$$;

-- Grant execute to anon (needed for pre-auth login lookup)
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon;

-- Update handle_new_user to store username from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_username text;
  v_name     text;
BEGIN
  v_username := COALESCE(
    lower(NEW.raw_user_meta_data->>'username'),
    lower(split_part(NEW.email, '@', 1))
  );
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', v_username);

  INSERT INTO profiles (id, email, name, username)
  VALUES (NEW.id, NEW.email, v_name, v_username)
  ON CONFLICT (id) DO UPDATE SET
    name     = COALESCE(EXCLUDED.name,     profiles.name),
    username = COALESCE(EXCLUDED.username, profiles.username);

  -- Link any participant rows invited by email
  UPDATE participants
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND (user_id IS NULL OR user_id != NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
