import { Pool } from "pg";

const globalForPostgres = globalThis as unknown as {
  postgresPool?: Pool;
};

export const postgresPool =
  globalForPostgres.postgresPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = postgresPool;
}
