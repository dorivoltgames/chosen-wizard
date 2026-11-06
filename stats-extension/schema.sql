-- Add these tables to a dedicated D1 binding named FUNNEL_DB.
-- This migration does not read or modify any existing game counters.
CREATE TABLE IF NOT EXISTS funnel_events (
  event_id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  path TEXT NOT NULL,
  mode TEXT NOT NULL,
  client_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS funnel_day_event ON funnel_events(day, event, path, mode);

-- Daily counts for the Cloudflare D1 console. Client submissions are self-reported.
CREATE VIEW IF NOT EXISTS funnel_daily AS
SELECT day, event, path, mode, COUNT(*) AS total
FROM funnel_events GROUP BY day, event, path, mode;
