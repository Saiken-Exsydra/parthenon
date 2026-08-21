import { CANCELLATION_RATE_LIMIT, CANCELLATION_RATE_WINDOW_MS } from '../../src/lib/cancellation';
import type { D1Database } from './types';

const hex = (buffer: ArrayBuffer): string => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export const keyedHash = async (value: string, pepper: string): Promise<string> =>
  hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${pepper}:${value}`)));

export const cleanupExpiredRecords = async (db: D1Database, now: Date): Promise<void> => {
  const nowIso = now.toISOString();
  await db.batch([
    db.prepare("UPDATE booking_cancellations SET status = 'expired', short_code = NULL, expired_at = ? WHERE status = 'active' AND appointment_start <= ?").bind(nowIso, nowIso),
    db.prepare('DELETE FROM cancellation_rate_limits WHERE window_started < ?').bind(new Date(now.getTime() - CANCELLATION_RATE_WINDOW_MS).toISOString()),
  ]);
};

export const rateLimit = async (db: D1Database, bucket: string, now: Date): Promise<boolean> => {
  const windowStart = new Date(now.getTime() - CANCELLATION_RATE_WINDOW_MS).toISOString();
  const nowIso = now.toISOString();
  await db.prepare(`INSERT INTO cancellation_rate_limits (bucket, window_started, attempts, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      attempts = CASE WHEN cancellation_rate_limits.window_started < ? THEN 1 ELSE cancellation_rate_limits.attempts + 1 END,
      window_started = CASE WHEN cancellation_rate_limits.window_started < ? THEN excluded.window_started ELSE cancellation_rate_limits.window_started END,
      updated_at = excluded.updated_at`).bind(bucket, nowIso, nowIso, windowStart, windowStart).run();
  const record = await db.prepare('SELECT attempts FROM cancellation_rate_limits WHERE bucket = ?').bind(bucket).first<{ attempts: number }>();
  return (record?.attempts ?? CANCELLATION_RATE_LIMIT + 1) <= CANCELLATION_RATE_LIMIT;
};
