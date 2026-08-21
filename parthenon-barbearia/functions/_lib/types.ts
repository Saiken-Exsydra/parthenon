export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
}

export interface Env {
  PARTHENON_DB?: D1Database;
  CAL_API_KEY?: string;
  CANCELLATION_PEPPER?: string;
}

export type PagesContext = {
  request: Request;
  env: Env;
};
