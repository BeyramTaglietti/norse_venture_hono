import { HttpStatus } from '@/config/errors';
import { db } from '@/drizzle/db';
import { trip_partecipants, trips, users } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export const getPartecipants = async (tripId: string, userId: string) => {
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
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (!tripFound.partecipants.find((x) => x.user_id === userId)) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'User not partecipant of this trip',
    });
  }

  return tripFound.partecipants.map((x) => x.user);
};

export const addPartecipant = async (
  tripId: string,
  userId: string,
  partecipantId: string,
) => {
  const tripFound = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
    with: {
      partecipants: true,
    },
  });

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (tripFound.partecipants.find((x) => x.user_id === partecipantId)) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'User already partecipant of this trip',
    });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      friends: true,
    },
  });

  if (!user?.friends.find((x) => x.friend_id === partecipantId))
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'Can only add friends to trip',
    });

  const addedPartecipant = await db
    .insert(trip_partecipants)
    .values({
      trip_id: tripId,
      user_id: partecipantId,
    })
    .returning();

  return addedPartecipant[0];
};

export const removePartecipant = async (
  tripId: string,
  userId: string,
  partecipantId: string,
) => {
  const tripFound = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
    with: {
      partecipants: true,
    },
  });

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (!tripFound.partecipants.find((x) => x.user_id === partecipantId)) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'User not partecipant of this trip',
    });
  }

  // owner or non-owner is deleting owner
  if (partecipantId === tripFound.owner_id)
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'Cannot remove owner, delete trip instead',
    });

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
