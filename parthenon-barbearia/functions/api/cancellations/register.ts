import { bookingServices } from '../../../src/data/business';
import { createShortCode, isPastAppointment, normalizeBrazilianPhone, totalServicePrice, type ServiceSummary } from '../../../src/lib/cancellation';
import { getCalBooking, CalError } from '../../_lib/cal';
import { apiError, json, readJson } from '../../_lib/http';
import { cleanupExpiredRecords, keyedHash } from '../../_lib/security';
import type { PagesContext } from '../../_lib/types';

type ExistingRecord = { short_code: string | null; status: string };

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.PARTHENON_DB || !env.CANCELLATION_PEPPER) return apiError('CANCELLATION_NOT_CONFIGURED', 503);
  const body = await readJson(request);
  const bookingUid = typeof body?.bookingUid === 'string' ? body.bookingUid.trim().slice(0, 160) : '';
  const serviceIds = Array.isArray(body?.serviceIds) && body.serviceIds.every((id) => typeof id === 'string') ? body.serviceIds : null;
  const selectedServices = serviceIds?.map((id) => bookingServices.find((service) => service.id === id && service.bookingMode === 'calendar'));
  if (!bookingUid || !serviceIds || serviceIds.length === 0 || serviceIds.length > 12 || new Set(serviceIds).size !== serviceIds.length || !selectedServices?.every(Boolean)) return apiError('INVALID_INPUT', 400);
  const services: ServiceSummary[] = selectedServices.map((service) => ({ id: service!.id, name: service!.name, priceCents: Math.round((service!.priceValue || 0) * 100) }));

  const db = env.PARTHENON_DB;
  const now = new Date();
  await cleanupExpiredRecords(db, now);
  const existing = await db.prepare('SELECT short_code, status FROM booking_cancellations WHERE booking_uid = ?').bind(bookingUid).first<ExistingRecord>();
  if (existing?.status === 'active' && existing.short_code) return json({ ok: true, code: existing.short_code });
  if (existing) return apiError('BOOKING_EXPIRED', 409);

  try {
    const liveBooking = await getCalBooking(bookingUid, env.CAL_API_KEY);
    if (liveBooking.status.toLowerCase() === 'cancelled') return apiError('ALREADY_CANCELLED', 409);
    const phone = normalizeBrazilianPhone(liveBooking.phone);
    if (!phone) return apiError('BOOKING_PHONE_UNAVAILABLE', 422);
    const authoritativeStart = liveBooking.start && !Number.isNaN(Date.parse(liveBooking.start)) ? liveBooking.start : null;
    if (!authoritativeStart) return apiError('CAL_UNAVAILABLE', 503);
    if (isPastAppointment(authoritativeStart, now.getTime())) return apiError('BOOKING_EXPIRED', 409);
    const phoneHash = await keyedHash(phone, env.CANCELLATION_PEPPER);
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const shortCode = createShortCode();
      try {
        await db.prepare(`INSERT INTO booking_cancellations
          (booking_uid, short_code, phone_hash, services_json, total_price_cents, appointment_start, appointment_end, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`).bind(
          bookingUid, shortCode, phoneHash, JSON.stringify(services), totalServicePrice(services), authoritativeStart,
          liveBooking.end, now.toISOString(),
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
