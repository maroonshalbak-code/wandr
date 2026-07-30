-- ── Group chat messages ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id      UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name  TEXT NOT NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can view messages" ON messages
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM trips      WHERE id = trip_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM participants WHERE trip_id = messages.trip_id AND user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Location column on plans ─────────────────────────────────────

ALTER TABLE plans ADD COLUMN IF NOT EXISTS location TEXT;
