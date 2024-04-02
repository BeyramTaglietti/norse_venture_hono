import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Hono } from 'hono';
import { client, db } from './drizzle/db';

await client.connect();

await migrate(db, { migrationsFolder: 'src/drizzle' });

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/trips', async (c) => {
  const trips = await db.query.trip.findMany();
  return c.json(trips);
});

export default app;
