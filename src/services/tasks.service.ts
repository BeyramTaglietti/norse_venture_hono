import { CustomError } from '@/config/errors';
import { db } from '@/drizzle/db';
import { trips } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export const getTasks = async (tripId: string, userId: string) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: {
        tasks: true,
        partecipants: true,
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
      throw new CustomError('User not partecipant of this trip', 403);
    }

    return tripFound.tasks;
  } catch (e) {
    throw new CustomError('Error while fetching tasks', 500);
  }
};
