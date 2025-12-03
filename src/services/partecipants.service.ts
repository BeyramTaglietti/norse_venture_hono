import { HttpStatus } from '@/config/errors';
import type { PartecipantModel, SafeUserModel } from '@/models';
import {
  addTripPartecipant_db,
  findFriendById_db,
  findTripByOwnerId_db,
  findTripByPartecipant_db,
  findTripPartecipants_db,
  removeTripPartecipant_db,
} from '@/repositories';
import { HTTPException } from 'hono/http-exception';

export const getPartecipants = async (
  tripId: string,
  userId: string,
): Promise<SafeUserModel[]> => {
  const tripFound = await findTripPartecipants_db(tripId);

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
): Promise<PartecipantModel> => {
  const tripFound = await findTripByOwnerId_db(tripId, userId, {
    withPartecipants: true,
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

  const user = await findFriendById_db(userId, partecipantId);

  if (!user)
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'Can only add friends to trip',
    });

  try {
    const addedPartecipant = await addTripPartecipant_db(tripId, partecipantId);

    return addedPartecipant;
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error adding partecipant',
    });
  }
};

export const removePartecipant = async (
  tripId: string,
  userId: string,
  partecipantId: string,
): Promise<PartecipantModel> => {
  const tripFound = await findTripByPartecipant_db(tripId, partecipantId);

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (tripFound.trip.owner_id !== userId) {
    if (partecipantId !== userId) {
      throw new HTTPException(HttpStatus.FORBIDDEN, {
        message: 'Cannot remove other partecipants',
      });
    }
  }

  if (partecipantId === tripFound.trip.owner_id) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'Cannot remove owner, delete trip instead',
    });
  }

  try {
    const removedPartecipant = await removeTripPartecipant_db(
      tripId,
      partecipantId,
    );

    return removedPartecipant;
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error removing partecipant',
    });
  }
};
