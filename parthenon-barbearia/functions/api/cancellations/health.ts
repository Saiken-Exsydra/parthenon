import { json } from '../../_lib/http';
import type { PagesContext } from '../../_lib/types';

type SchemaCheck = { table_count: number };

export const onRequestGet = async ({ env }: PagesContext): Promise<Response> => {
  const databaseConfigured = Boolean(env.PARTHENON_DB);
  const pepperConfigured = Boolean(env.CANCELLATION_PEPPER);
  const calApiKeyConfigured = Boolean(env.CAL_API_KEY);
  let databaseReachable = false;
  let schemaReady = false;

  if (env.PARTHENON_DB) {
    try {
      await env.PARTHENON_DB.prepare('SELECT 1').first();
      databaseReachable = true;
      const schema = await env.PARTHENON_DB.prepare(`SELECT COUNT(*) AS table_count
        FROM sqlite_master
        WHERE type = 'table' AND name IN ('booking_cancellations', 'cancellation_rate_limits')`).first<SchemaCheck>();
      schemaReady = schema?.table_count === 2;
    } catch {
      // Public diagnostics intentionally expose only the reachability boolean.
      databaseReachable = false;
      schemaReady = false;
    }
  }

  return json({
    ok: true,
    databaseConfigured,
    databaseReachable,
    schemaReady,
    pepperConfigured,
    calApiKeyConfigured,
    configured: databaseConfigured && databaseReachable && schemaReady && pepperConfigured && calApiKeyConfigured,
  });
};
