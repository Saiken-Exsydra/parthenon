export type LiveBooking = { status: string; start: string | null; end: string | null; phone: string | null };

export class CalError extends Error {
  constructor(public kind: 'not_found' | 'already_cancelled' | 'unavailable', message: string) { super(message); }
}

const CAL_API_VERSION = '2026-02-25';
const requestCal = async (path: string, init: RequestInit, apiKey?: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    return await fetch(`https://api.cal.com/v2${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'cal-api-version': CAL_API_VERSION, ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}), ...(init.headers || {}) },
    });
  } catch {
    throw new CalError('unavailable', 'Cal.com request failed');
  } finally { clearTimeout(timer); }
};

const responseValue = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as Record<string, unknown>).value === 'string') return (value as Record<string, string>).value;
  return null;
};

const bookingFromResponse = (data: unknown): LiveBooking => {
  const booking = data && typeof data === 'object' ? data as Record<string, any> : {};
  const attendee = Array.isArray(booking.attendees) ? booking.attendees[0] : undefined;
  const responses = booking.bookingFieldsResponses && typeof booking.bookingFieldsResponses === 'object' ? booking.bookingFieldsResponses : {};
  const fieldPhone = responseValue(responses.attendeePhoneNumber) || responseValue(responses.phone);
  return { status: String(booking.status || ''), start: booking.start || booking.startTime || null, end: booking.end || booking.endTime || null, phone: attendee?.phoneNumber || booking.attendee?.phoneNumber || fieldPhone };
};

export const getCalBooking = async (bookingUid: string, apiKey?: string): Promise<LiveBooking> => {
  const response = await requestCal(`/bookings/${encodeURIComponent(bookingUid)}`, { method: 'GET' }, apiKey);
  if (response.status === 404) throw new CalError('not_found', 'Booking not found');
  if (response.status === 401 || response.status === 403 || response.status >= 500) throw new CalError('unavailable', 'Cal.com unavailable');
  if (!response.ok) throw new CalError('unavailable', 'Cal.com rejected booking lookup');
  const payload = await response.json() as { data?: unknown };
  return bookingFromResponse(payload.data);
};

export const cancelCalBooking = async (bookingUid: string, apiKey?: string): Promise<void> => {
  const response = await requestCal(`/bookings/${encodeURIComponent(bookingUid)}/cancel`, {
    method: 'POST', body: JSON.stringify({ cancellationReason: 'Cancelado pelo cliente pelo site da Parthenon.' }),
  }, apiKey);
  if (response.ok) return;
  if (response.status === 404) throw new CalError('not_found', 'Booking not found');
  if (response.status === 409 || response.status === 422) throw new CalError('already_cancelled', 'Booking already cancelled');
  throw new CalError('unavailable', 'Cal.com cancellation failed');
};
