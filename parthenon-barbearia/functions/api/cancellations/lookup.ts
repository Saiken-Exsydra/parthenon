import { isPastAppointment, normalizeBrazilianPhone, sanitizeShortCode, type CancellationBooking, type ServiceSummary } from '../../../src/lib/cancellation';
import { getCalBooking, CalError } from '../../_lib/cal';
import { apiError, json, readJson } from '../../_lib/http';
import { cleanupExpiredRecords, keyedHash, rateLimit } from '../../_lib/security';
import type { PagesContext } from '../../_lib/types';

type RecordRow = { booking_uid: string; services_json: string; total_price_cents: number; appointment_start: string; appointment_end: string | null; status: string };
const requester = (request: Request) => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
const genericFailure = () => apiError('NOT_FOUND', 404);

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.PARTHENON_DB || !env.CANCELLATION_PEPPER) return apiError('CANCELLATION_NOT_CONFIGURED', 503);
  const body = await readJson(request);
  const code = sanitizeShortCode(body?.code);
  const phone = normalizeBrazilianPhone(body?.phone);
  if (!code || !phone) return apiError('INVALID_INPUT', 400);
  const now = new Date();
  const db = env.PARTHENON_DB;
  await cleanupExpiredRecords(db, now);
  const bucket = await keyedHash(`lookup:${requester(request)}`, env.CANCELLATION_PEPPER);
  if (!await rateLimit(db, bucket, now)) return apiError('RATE_LIMITED', 429);
  const phoneHash = await keyedHash(phone, env.CANCELLATION_PEPPER);
  const record = await db.prepare(`SELECT booking_uid, services_json, total_price_cents, appointment_start, appointment_end, status
    FROM booking_cancellations WHERE short_code = ? AND phone_hash = ? AND status = 'active'`).bind(code, phoneHash).first<RecordRow>();
  if (!record) return genericFailure();
  if (isPastAppointment(record.appointment_start, now.getTime())) return apiError('BOOKING_EXPIRED', 409);
  try {
    const live = await getCalBooking(record.booking_uid, env.CAL_API_KEY);
    if (live.status.toLowerCase() === 'cancelled') {
      await db.prepare("UPDATE booking_cancellations SET status = 'cancelled', short_code = NULL, cancelled_at = ? WHERE booking_uid = ?").bind(now.toISOString(), record.booking_uid).run();
      return apiError('ALREADY_CANCELLED', 409);
    }
    const appointmentStart = live.start && !Number.isNaN(Date.parse(live.start)) ? live.start : record.appointment_start;
    if (isPastAppointment(appointmentStart, now.getTime())) {
      await db.prepare("UPDATE booking_cancellations SET status = 'expired', short_code = NULL, expired_at = ? WHERE booking_uid = ?").bind(now.toISOString(), record.booking_uid).run();
      return apiError('BOOKING_EXPIRED', 409);
    }
    if (appointmentStart !== record.appointment_start || live.end !== record.appointment_end) {
      await db.prepare('UPDATE booking_cancellations SET appointment_start = ?, appointment_end = ? WHERE booking_uid = ?').bind(appointmentStart, live.end || record.appointment_end, record.booking_uid).run();
    }
    let services: ServiceSummary[] = [];
    try { services = JSON.parse(record.services_json) as ServiceSummary[]; } catch { return apiError('INTERNAL_ERROR', 500); }
    const booking: CancellationBooking = { customerName: live.name, services, totalPriceCents: record.total_price_cents, appointmentStart, appointmentEnd: live.end || record.appointment_end };
    return json({ ok: true, booking });
  } catch (error) {
    if (error instanceof CalError && error.kind === 'not_found') return genericFailure();
    return apiError('CAL_UNAVAILABLE', 503);
  }
};
