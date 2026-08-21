import { createShortCode, isPastAppointment, normalizeBrazilianPhone, serializeServices, totalServicePrice } from '../../../src/lib/cancellation';
import { getCalBooking, CalError } from '../../_lib/cal';
import { apiError, json, readJson } from '../../_lib/http';
import { cleanupExpiredRecords, keyedHash } from '../../_lib/security';
import type { PagesContext } from '../../_lib/types';

type ExistingRecord = { short_code: string | null; status: string };

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.PARTHENON_DB || !env.CANCELLATION_PEPPER) return apiError('CANCELLATION_NOT_CONFIGURED', 503);
  const body = await readJson(request);
  const bookingUid = typeof body?.bookingUid === 'string' ? body.bookingUid.trim().slice(0, 160) : '';
  const phone = normalizeBrazilianPhone(body?.phone);
  const services = serializeServices(body?.services);
  const appointmentStart = typeof body?.appointmentStart === 'string' ? body.appointmentStart : '';
  const appointmentEnd = typeof body?.appointmentEnd === 'string' ? body.appointmentEnd : null;
  if (!bookingUid || !phone || !services || !appointmentStart || Number.isNaN(Date.parse(appointmentStart))) return apiError('INVALID_INPUT', 400);

  const db = env.PARTHENON_DB;
  const now = new Date();
  await cleanupExpiredRecords(db, now);
  const existing = await db.prepare('SELECT short_code, status FROM booking_cancellations WHERE booking_uid = ?').bind(bookingUid).first<ExistingRecord>();
  if (existing?.status === 'active' && existing.short_code) return json({ ok: true, code: existing.short_code });
  if (existing) return apiError('BOOKING_EXPIRED', 409);

  try {
    const liveBooking = await getCalBooking(bookingUid, env.CAL_API_KEY);
    if (liveBooking.status.toLowerCase() === 'cancelled') return apiError('ALREADY_CANCELLED', 409);
    if (liveBooking.phone && normalizeBrazilianPhone(liveBooking.phone) !== phone) return apiError('INVALID_INPUT', 400);
    const authoritativeStart = liveBooking.start && !Number.isNaN(Date.parse(liveBooking.start)) ? liveBooking.start : appointmentStart;
    if (isPastAppointment(authoritativeStart, now.getTime())) return apiError('BOOKING_EXPIRED', 409);
    const phoneHash = await keyedHash(phone, env.CANCELLATION_PEPPER);
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const shortCode = createShortCode();
      try {
        await db.prepare(`INSERT INTO booking_cancellations
          (booking_uid, short_code, phone_hash, services_json, total_price_cents, appointment_start, appointment_end, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`).bind(
          bookingUid, shortCode, phoneHash, JSON.stringify(services), totalServicePrice(services), authoritativeStart,
          liveBooking.end || appointmentEnd, now.toISOString(),
        ).run();
        return json({ ok: true, code: shortCode });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (!/unique|constraint/i.test(message)) throw error;
        const retry = await db.prepare('SELECT short_code, status FROM booking_cancellations WHERE booking_uid = ?').bind(bookingUid).first<ExistingRecord>();
        if (retry?.status === 'active' && retry.short_code) return json({ ok: true, code: retry.short_code });
      }
    }
    return apiError('INTERNAL_ERROR', 503);
  } catch (error) {
    if (error instanceof CalError) return apiError(error.kind === 'already_cancelled' ? 'ALREADY_CANCELLED' : 'CAL_UNAVAILABLE', error.kind === 'already_cancelled' ? 409 : 503);
    console.error('Cancellation registration failed for Cal booking.', bookingUid);
    return apiError('INTERNAL_ERROR', 500);
  }
};
