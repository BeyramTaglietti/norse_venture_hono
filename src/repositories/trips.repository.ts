import { db } from '@/drizzle/db';
import { trip_partecipants, trips } from '@/drizzle/schema';
import { type InferInsertModel, and, eq } from 'drizzle-orm';

export const findTripsWithPartecipants_db = (partecipantId: string) => {
  return db.query.trip_partecipants.findMany({
    with: {
      trip: {
        with: {
          partecipants: true,
        },
      },
    },
    where: eq(trip_partecipants.user_id, partecipantId),
  });
};

export const findTripByPartecipant_db = (
  tripId: string,
  partecipantId: string,
) => {
  return db.query.trip_partecipants.findFirst({
    where: and(
      eq(trip_partecipants.trip_id, tripId),
      eq(trip_partecipants.user_id, partecipantId),
    ),
    with: {
      trip: true,
    },
  });
};

export const findTripByOwnerId_db = (
  tripId: string,
  ownerId: string,
  options?: {
    withPartecipants?: boolean;
  },
) => {
  return db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.owner_id, ownerId)),
    with: {
      ...(options?.withPartecipants && { partecipants: true }),
    },
  });
};

export const createTrip_db = async (trip: InferInsertModel<typeof trips>) => {
  const createdTrip = await db.insert(trips).values(trip).returning();

  return createdTrip[0];
};

export const deleteTrip_db = async (tripId: string, ownerId: string) => {
  const deletedTrip = await db
    .delete(trips)
    .where(and(eq(trips.id, tripId), eq(trips.owner_id, ownerId)))
    .returning();

  return deletedTrip[0];
};

export const updateTrip_db = async (
  tripId: string,
  ownerId: string,
  editedTrip: Partial<InferInsertModel<typeof trips>>,
) => {
  const updatedTrip = await db
    .update(trips)
    .set(editedTrip)
    .where(and(eq(trips.id, tripId), eq(trips.owner_id, ownerId)))
    .returning();

  return updatedTrip[0];
};
