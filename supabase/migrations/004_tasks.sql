CREATE TABLE IF NOT EXISTS tasks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id      UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  assignee_id  TEXT,
  assignee_name TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can view tasks" ON tasks FOR SELECT USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM participants WHERE trip_id = tasks.trip_id AND user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Can update tasks" ON tasks FOR UPDATE USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND created_by = auth.uid())
);

CREATE POLICY "Can delete tasks" ON tasks FOR DELETE USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND created_by = auth.uid())
);
