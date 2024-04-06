import { CustomError, throwInternalServerError } from '@/config/errors';
import { db } from '@/drizzle/db';
import { trip_partecipants, trips, users } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';

export const getPartecipants = async (tripId: string, userId: string) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: {
        partecipants: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (!tripFound.partecipants.find((x) => x.user_id === userId)) {
      throw new CustomError('User not partecipant of this trip', 403);
    }

    return tripFound.partecipants.map((x) => x.user);
  } catch (e) {
    return throwInternalServerError(e);
  }
};

export const addPartecipant = async (
  tripId: string,
  userId: string,
  partecipantId: string,
) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
      with: {
        partecipants: true,
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (tripFound.partecipants.find((x) => x.user_id === partecipantId)) {
      throw new CustomError('User already partecipant of this trip', 403);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        friends: true,
      },
    });

    if (!user?.friends.find((x) => x.user_id === partecipantId))
      throw new CustomError('Can only add friends to trip', 403);

    const addedPartecipant = await db
      .insert(trip_partecipants)
      .values({
        trip_id: tripId,
        user_id: partecipantId,
      })
      .returning();

    return addedPartecipant[0];
  } catch (e) {
    return throwInternalServerError(e);
  }
};

export const removePartecipant = async (
  tripId: string,
  userId: string,
  partecipantId: string,
) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
      with: {
        partecipants: true,
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (!tripFound.partecipants.find((x) => x.user_id === partecipantId)) {
      throw new CustomError('User not partecipant of this trip', 403);
    }

    // owner or non-owner is deleting owner
    if (partecipantId === tripFound.owner_id)
      throw new CustomError('Cannot remove owner, delete trip instead', 403);

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
  } catch (e) {
    return throwInternalServerError(e);
  }
};
