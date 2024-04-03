import { db } from '@/drizzle/db';

export const getTrips = async () => {
  try {
    const trips = await db.query.trips.findMany({
      with: {
        partecipants: true,
      },
    });
    return trips;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
