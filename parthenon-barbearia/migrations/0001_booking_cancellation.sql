CREATE TABLE IF NOT EXISTS booking_cancellations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_uid TEXT NOT NULL UNIQUE,
  short_code TEXT,
  phone_hash TEXT NOT NULL,
  services_json TEXT NOT NULL,
  total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
  appointment_start TEXT NOT NULL,
  appointment_end TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  created_at TEXT NOT NULL,
  cancelled_at TEXT,
  expired_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_cancellations_active_short_code
  ON booking_cancellations(short_code)
  WHERE status = 'active' AND short_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS booking_cancellations_active_lookup
  ON booking_cancellations(short_code, phone_hash)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS cancellation_rate_limits (
  bucket TEXT PRIMARY KEY,
  window_started TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
