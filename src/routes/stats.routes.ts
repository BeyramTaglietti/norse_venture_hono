import { getAppStats } from '@/services';
import { Hono } from 'hono';

const statsRouter = new Hono();

statsRouter.get('/', async (c) => {
  const stats = await getAppStats();
  return c.json(stats);
});

export { statsRouter };
