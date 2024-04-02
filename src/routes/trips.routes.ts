import { getTripsController } from '@/controllers';
import { Hono } from 'hono';

const tripsRouter = new Hono();

tripsRouter.get('/', getTripsController);

export { tripsRouter };
