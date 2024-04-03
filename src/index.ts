import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Hono } from 'hono';
import { showRoutes } from 'hono/dev';
import { logger } from 'hono/logger';
import { client, db } from './drizzle/db';
import { authRouter, tripsRouter } from './routes';

await client.connect();
await migrate(db, { migrationsFolder: 'src/drizzle' });

const router = new Hono(); // .basePath('/v1')
router.use(logger());

router.route('v1/trips', tripsRouter);
router.route('v1/auth', authRouter);

router.get('/', (c) => {
  return c.text('This is Norse Venture running on Bun!');
});
showRoutes(router);

export default router;
