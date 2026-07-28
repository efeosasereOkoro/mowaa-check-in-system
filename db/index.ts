import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// App DB client (Neon serverless over HTTP — ideal for Vercel/serverless).
// Note: this is the base client. Authenticated, RLS-scoped access (passing the
// Neon Auth token per request) is added when auth + RLS land in E2/E3.
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
