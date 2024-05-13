import {
  getTotalExpiredTripsNumber,
  getTotalGroupTripsNumber,
  getTotalTasksNumber,
  getTotalTripsNumber,
  getTotalUsersNumber,
} from '@/repositories';

export const getAppStats = async () => {
  let tripsCreated: number = 0,
    tasksCreated: number = 0,
    usersCount: number = 0,
    groupTrips: number = 0,
    expiredTrips: number = 0;

  const promises = [
    getTotalTripsNumber().then((x) => (tripsCreated = x)),
    getTotalTasksNumber().then((x) => (tasksCreated = x)),
    getTotalUsersNumber().then((x) => (usersCount = x)),
    getTotalGroupTripsNumber().then((x) => (groupTrips = x)),
    getTotalExpiredTripsNumber().then((x) => (expiredTrips = x)),
  ];

  await Promise.all(promises);

  return {
    trips_created: tripsCreated,
    group_trips: groupTrips,
    expired_trips: expiredTrips,
    tasks_created: tasksCreated,
    number_of_users: usersCount,
  };
};
