import { db } from '@/drizzle/db';
import { trip_partecipants, trips } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';

export const findTripPartecipants_db = (tripId: string) => {
  return db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      partecipants: {
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              created_at: true,
              profile_picture: true,
              username: true,
            },
          },
        },
      },
    },
  });
};

export const addTripPartecipant_db = async (
  tripId: string,
  partecipantId: string,
) => {
  const addedPartecipant = await db
    .insert(trip_partecipants)
    .values({
      trip_id: tripId,
      user_id: partecipantId,
    })
    .returning();

  return addedPartecipant[0];
};

export const removeTripPartecipant_db = async (
  tripId: string,
  partecipantId: string,
) => {
  const removedPartecipant = await db
    .delete(trip_partecipants)
    .where(
      and(
        eq(trip_partecipants.trip_id, tripId),
        eq(trip_partecipants.user_id, partecipantId),
      ),
    )
    .returning();

  return removedPartecipant[0];
};
