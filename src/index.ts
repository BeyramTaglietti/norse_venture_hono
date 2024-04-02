import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { client, db } from './drizzle/db';
import { tripsRouter } from './routes';

await client.connect();
await migrate(db, { migrationsFolder: 'src/drizzle' });

const router = new Hono();
router.use(logger());
router.route('/trips', tripsRouter);

router.get('/', (c) => {
  return c.text('This is Norse Venture running on Bun!');
});

export default router;
