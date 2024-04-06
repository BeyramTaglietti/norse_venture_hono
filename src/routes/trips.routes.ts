/* eslint-disable drizzle/enforce-delete-with-where */
import { throwCustomError } from '@/config/errors';
import { getThumbnailFromBody } from '@/helpers';
import {
  addPartecipant,
  createTask,
  createTrip,
  deleteTask,
  deleteTrip,
  editTrip,
  getPartecipants,
  getTasks,
  getTrip,
  getTrips,
  putTask,
  removePartecipant,
  updateThumbnail,
} from '@/services';
import {
  CreateTripSchema,
  createTaskSchema,
  updateTaskSchema,
} from '@/validators';
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
  try {
    const payload = c.get('jwtPayload');
    const trips = await getTrips(payload.sub);
    return c.json(trips);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.get('/:trip_id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const trip = await getTrip(tripId, payload.sub);
    return c.json(trip);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.post('/', zValidator('json', CreateTripSchema), async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const trip = c.req.valid('json');
    const createdTrip = await createTrip(trip, payload.sub);
    return c.json(createdTrip, 201);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.delete('/:trip_id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const deletedTrip = await deleteTrip(tripId, payload.sub);
    return c.json(deletedTrip, 200);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.put(
  '/:trip_id',
  zValidator('json', CreateTripSchema),
  async (c) => {
    try {
      const payload = c.get('jwtPayload');
      const tripId = c.req.param('trip_id');
      const trip = c.req.valid('json');
      const updatedTrip = await editTrip(tripId, trip, payload.sub);
      return c.json(updatedTrip, 200);
    } catch (error) {
      return throwCustomError(error, c);
    }
  },
);

tripsRouter.patch('/:trip_id/thumbnail', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');

    const file = await getThumbnailFromBody(c);

    const updatedTrip = await updateThumbnail(tripId, payload.sub, file);
    return c.json(updatedTrip, 200);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

/// Partecipants

tripsRouter.get('/:trip_id/partecipants', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const partecipants = await getPartecipants(tripId, payload.sub);
    return c.json(partecipants);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.post('/:trip_id/partecipants/:partecipant_id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const partecipantId = c.req.param('partecipant_id');
    const partecipant = await addPartecipant(
      tripId,
      payload.sub,
      partecipantId,
    );
    return c.json(partecipant, 201);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.delete('/:trip_id/partecipants/:partecipant_id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const partecipantId = c.req.param('partecipant_id');
    const partecipant = await removePartecipant(
      tripId,
      payload.sub,
      partecipantId,
    );
    return c.json(partecipant, 200);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

/// Tasks

tripsRouter.get('/:trip_id/tasks', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const tasks = await getTasks(tripId, payload.sub);
    return c.json(tasks);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

tripsRouter.post(
  '/:trip_id/tasks',
  zValidator('json', createTaskSchema),
  async (c) => {
    try {
      const payload = c.get('jwtPayload');
      const tripId = c.req.param('trip_id');
      const task = c.req.valid('json');
      const createdTask = await createTask(tripId, payload.sub, task);
      return c.json(createdTask, 201);
    } catch (error) {
      return throwCustomError(error, c);
    }
  },
);

tripsRouter.put(
  '/:trip_id/tasks/:task_id',
  zValidator('json', updateTaskSchema),
  async (c) => {
    try {
      const payload = c.get('jwtPayload');
      const tripId = c.req.param('trip_id');
      const taskId = c.req.param('task_id');
      const task = c.req.valid('json');
      const updatedTask = await putTask(tripId, payload.sub, taskId, task);
      return c.json(updatedTask, 200);
    } catch (error) {
      return throwCustomError(error, c);
    }
  },
);

tripsRouter.delete('/:trip_id/tasks/:task_id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const taskId = c.req.param('task_id');
    const deletedTask = deleteTask(tripId, payload.sub, taskId);
    return c.json(deletedTask, 200);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

export { tripsRouter };
