import { db } from '@/drizzle/db';

export const getTrips = async () => {
  try {
    const trips = await db.query.trip.findMany();
    return trips;
  } catch (e) {
    throw e;
  }
};
