import type { CancellationErrorCode } from '../../src/lib/cancellation';

export const json = (body: unknown, init: ResponseInit = {}): Response => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers || {}) },
});

export const apiError = (code: CancellationErrorCode, status: number): Response => json({ ok: false, code }, { status });

export const readJson = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch {
    return null;
  }
};
