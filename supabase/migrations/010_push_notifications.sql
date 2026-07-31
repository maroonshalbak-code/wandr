-- Push subscriptions (one row per user — last device wins)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscription"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Notification preferences (default: all on)
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  new_trip     boolean DEFAULT true,
  new_task     boolean DEFAULT true,
  new_payment  boolean DEFAULT true,
  new_message  boolean DEFAULT true,
  new_plan     boolean DEFAULT true
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL USING (auth.uid() = user_id);
