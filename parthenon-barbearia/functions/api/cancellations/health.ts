import { json } from '../../_lib/http';
import type { PagesContext } from '../../_lib/types';

export const onRequestGet = ({ env }: PagesContext): Response => json({
  ok: true,
  configured: Boolean(env.PARTHENON_DB && env.CANCELLATION_PEPPER),
  calApiKeyConfigured: Boolean(env.CAL_API_KEY),
});
