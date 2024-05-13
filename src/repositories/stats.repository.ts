import { db } from '@/drizzle/db';
import { tasks, trip_partecipants, trips, users } from '@/drizzle/schema';
import { count, lt } from 'drizzle-orm';

export const getTotalTripsNumber = async () => {
  const tripsCreated = await db.select({ count: count() }).from(trips);
  return tripsCreated[0].count;
};

export const getTotalTasksNumber = async () => {
  const tasksCreated = await db.select({ count: count() }).from(tasks);
  return tasksCreated[0].count;
};

export const getTotalUsersNumber = async () => {
  const usersCount = await db.select({ count: count() }).from(users);
  return usersCount[0].count;
};

export const getTotalGroupTripsNumber = async () => {
  const groupTrips = await db
    .select({ count: count() })
    .from(trip_partecipants)
    .groupBy(trip_partecipants.trip_id);

  return groupTrips.filter((x) => x.count > 1).length;
};

export const getTotalExpiredTripsNumber = async () => {
  const expiredTrips = await db
    .select({ count: count() })
    .from(trips)
    .where(lt(trips.date, new Date()));
  return expiredTrips[0].count;
};
