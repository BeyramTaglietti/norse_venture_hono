import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';

export const client = new Client({
  host: Bun.env.POSTGRES_NAME,
  port: Number(Bun.env.POSTGRES_PORT),
  user: Bun.env.POSTGRES_USER,
  password: Bun.env.POSTGRES_PASSWORD,
  database: Bun.env.POSTGRES_DB,
});

export const db = drizzle(client, { schema });
