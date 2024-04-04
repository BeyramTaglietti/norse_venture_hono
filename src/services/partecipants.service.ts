import { CustomError } from '@/config/errors';
import { db } from '@/drizzle/db';
import { trips } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

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
    throw new CustomError('Error while fetching partecipants', 500);
  }
};
