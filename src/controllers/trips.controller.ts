import { throwCustomError } from '@/config/errors';
import { getTrips } from '@/services';
import { Context } from 'hono';

export const getTripsController = async (c: Context) => {
  try {
    const trips = await getTrips();
    return c.json(trips);
  } catch (error) {
    return throwCustomError(error, c);
  }
};
