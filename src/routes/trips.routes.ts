import { throwCustomError } from '@/config/errors';
import {
  createTrip,
  getPartecipants,
  getTasks,
  getTrip,
  getTrips,
} from '@/services';
import { CreateTripSchema } from '@/validators';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const tripsRouter = new Hono();

// tripsRouter.use(
//   '/*',
//   jwt({
//     secret: Bun.env.JWT_SECRET!,
//   }),
// );

tripsRouter.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const trips = await getTrips(payload.sub);
    return c.json(trips);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.get('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('id');
    const trip = await getTrip(tripId, payload.sub);
    return c.json(trip);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.get('/:id/partecipants', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('id');
    const partecipants = await getPartecipants(tripId, payload.sub);
    return c.json(partecipants);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.get('/:id/tasks', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('id');
    const tasks = await getTasks(tripId, payload.sub);
    return c.json(tasks);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.post('/', zValidator('json', CreateTripSchema), async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const trip = c.req.valid('json');
    const createdTrip = await createTrip(trip, payload.sub);
    return c.json(createdTrip);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

export { tripsRouter };
