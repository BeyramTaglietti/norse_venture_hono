import { db } from '@/drizzle/db';
import { tasks, trips, users } from '@/drizzle/schema';
import { count } from 'drizzle-orm';

export const getAppStats = async () => {
  let tripsCreated: number = 0,
    tasksCreated: number = 0,
    usersCount: number = 0;

  const promises = [
    db
      .select({ count: count() })
      .from(trips)
      .then((x) => (tripsCreated = x[0].count)),
    db
      .select({ count: count() })
      .from(tasks)
      .then((x) => (tasksCreated = x[0].count)),
    db
      .select({ count: count() })
      .from(users)
      .then((x) => (usersCount = x[0].count)),
  ];

  await Promise.all(promises);

  return {
    trips_created: tripsCreated,
    tasks_created: tasksCreated,
    number_of_users: usersCount,
  };
};
