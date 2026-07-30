-- Update handle_new_user to also link any existing participant records
-- that were added by email before the user created their account.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Upsert profile
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name);

  -- Link participant rows that were added by email before signup
  UPDATE participants
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND (user_id IS NULL OR user_id != NEW.id);

  RETURN NEW;
END;
$$;

-- Re-create the trigger (safe to run again)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Backfill: link any existing participants whose email matches a known user
UPDATE participants p
SET user_id = u.id
FROM auth.users u
WHERE p.email = u.email
  AND (p.user_id IS NULL OR p.user_id != u.id);
