CREATE TABLE IF NOT EXISTS payments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id         UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  cost            NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_by_id      TEXT,
  paid_by_name    TEXT,
  attachment_path TEXT,
  attachment_url  TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can view payments" ON payments FOR SELECT USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM participants WHERE trip_id = payments.trip_id AND user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Can update payments" ON payments FOR UPDATE USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND created_by = auth.uid())
);

CREATE POLICY "Can delete payments" ON payments FOR DELETE USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND created_by = auth.uid())
);
