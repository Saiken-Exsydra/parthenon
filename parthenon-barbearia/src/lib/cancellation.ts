export const CANCELLATION_CODE_PATTERN = /^\d{4}$/;
export const CANCELLATION_RATE_LIMIT = 8;
export const CANCELLATION_RATE_WINDOW_MS = 15 * 60 * 1000;

export type ServiceSummary = { id: string; name: string; priceCents: number };

export type CancellationBooking = {
  services: ServiceSummary[];
  totalPriceCents: number;
  appointmentStart: string;
  appointmentEnd: string | null;
};

export type CancellationErrorCode =
  | 'CANCELLATION_NOT_CONFIGURED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BOOKING_EXPIRED'
  | 'BOOKING_PHONE_UNAVAILABLE'
  | 'ALREADY_CANCELLED'
  | 'CAL_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export const normalizeBrazilianPhone = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const areaCode = digits.slice(0, 2);
  if (areaCode === '00') return null;
  return `+55${digits}`;
};

export const formatBrazilianPhone = (value: unknown): string => {
  const normalized = normalizeBrazilianPhone(value);
  if (!normalized) return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 11) : '';
  const digits = normalized.slice(3);
  return digits.length === 11
    ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
};

export const sanitizeShortCode = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const code = value.replace(/\s/g, '');
  return CANCELLATION_CODE_PATTERN.test(code) ? code : null;
};

export const createShortCode = (randomValues: Uint32Array = crypto.getRandomValues(new Uint32Array(1))): string =>
  String(randomValues[0] % 10_000).padStart(4, '0');

export const isPastAppointment = (appointmentStart: string, now = Date.now()): boolean => {
  const timestamp = Date.parse(appointmentStart);
  return Number.isNaN(timestamp) || timestamp <= now;
};

export const serializeServices = (services: unknown): ServiceSummary[] | null => {
  if (!Array.isArray(services) || services.length === 0 || services.length > 12) return null;
  const parsed = services.map((service) => {
    if (!service || typeof service !== 'object') return null;
    const candidate = service as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id.trim().slice(0, 80) : '';
    const name = typeof candidate.name === 'string' ? candidate.name.trim().slice(0, 120) : '';
    const priceCents = Number(candidate.priceCents);
    return id && name && Number.isInteger(priceCents) && priceCents >= 0 && priceCents <= 100_000 ? { id, name, priceCents } : null;
  });
  return parsed.every(Boolean) ? parsed as ServiceSummary[] : null;
};

export const totalServicePrice = (services: ServiceSummary[]): number => services.reduce((total, service) => total + service.priceCents, 0);
