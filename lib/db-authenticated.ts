import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '@/db/schema';

// The WebSocket (transaction-capable) driver is required because RLS context is
// set with SET LOCAL inside a transaction (neon-http has no transaction support).
// Node 22+ and Vercel's Node/Edge runtimes expose a global WebSocket.
if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

// Connects as the NON-OWNER `app_authenticated` role, so RLS policies apply.
const pool = new Pool({ connectionString: process.env.DATABASE_AUTHENTICATED_URL! });
export const authedDb = drizzle(pool, { schema });

type AuthedTx = Parameters<Parameters<typeof authedDb.transaction>[0]>[0];

/**
 * Run database work AS the given staff member, with RLS enforced.
 *
 * Sets the verified `app.staff_id` context (from the resolved session — see
 * getCurrentUser) for the duration of a transaction; every query inside `fn` is
 * then constrained by the RLS policies for that staff's role. Feature code
 * (check-in, children, medical notes, …) MUST go through here rather than the
 * owner `db` client, so the database — not just the UI — enforces the role matrix.
 */
export async function withStaffContext<T>(
  staffId: string,
  fn: (tx: AuthedTx) => Promise<T>,
): Promise<T> {
  return authedDb.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.staff_id', ${staffId}, true)`);
    return fn(tx);
  });
}
