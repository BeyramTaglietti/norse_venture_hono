/* eslint-disable drizzle/enforce-delete-with-where */
import { HttpStatus } from '@/config/errors';
import { getThumbnailFromBody } from '@/helpers';
import {
  createTrip,
  deleteTrip,
  editTrip,
  getTrip,
  getTrips,
  updateThumbnail,
} from '@/services';
import { CreateTripSchema } from '@/validators';
import { zValidator } from '@hono/zod-validator';
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
  const payload = c.get('jwtPayload');
  const trips = await getTrips(payload.sub);
  return c.json(trips);
});

tripsRouter.get('/:trip_id', async (c) => {
  const payload = c.get('jwtPayload');
  const tripId = c.req.param('trip_id');
  const trip = await getTrip(tripId, payload.sub);
  return c.json(trip);
});

tripsRouter.post('/', zValidator('json', CreateTripSchema), async (c) => {
  const payload = c.get('jwtPayload');
  const trip = c.req.valid('json');
  const createdTrip = await createTrip(trip, payload.sub);
  return c.json(createdTrip, HttpStatus.CREATED);
});

tripsRouter.delete('/:trip_id', async (c) => {
  const payload = c.get('jwtPayload');
  const tripId = c.req.param('trip_id');
  const deletedTrip = await deleteTrip(tripId, payload.sub);
  return c.json(deletedTrip);
});

tripsRouter.patch(
  '/:trip_id',
  zValidator('json', CreateTripSchema),
  async (c) => {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const trip = c.req.valid('json');
    const updatedTrip = await editTrip(tripId, trip, payload.sub);

    return c.json(updatedTrip);
  },
);

tripsRouter.patch('/:trip_id/thumbnail', async (c) => {
  const payload = c.get('jwtPayload');
  const tripId = c.req.param('trip_id');

  const file = await getThumbnailFromBody(c);

  const updatedTrip = await updateThumbnail(tripId, payload.sub, file);
  return c.json(updatedTrip);
});

export { tripsRouter };
