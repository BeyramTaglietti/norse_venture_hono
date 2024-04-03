import { throwCustomError } from '@/config/errors';
import { getTrips } from '@/services';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

const tripsRouter = new Hono();

tripsRouter.use(
  '/*',
  jwt({
    secret: Bun.env.JWT_SECRET!,
  }),
);

tripsRouter.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    console.log(payload);
    const trips = await getTrips();
    return c.json(trips);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

export { tripsRouter };
