import { CustomError } from '@/config/errors';
import { getSignedImageUrl, s3Client } from '@/config/s3';
import { db } from '@/drizzle/db';
import { trip_partecipants, trips } from '@/drizzle/schema';
import { ImageProvider } from '@/models';
import { CreateTripSchemaType } from '@/validators';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { InferInsertModel, InferSelectModel, eq } from 'drizzle-orm';

export const getTrips = async (user_id: string) => {
  try {
    const foundTrips = await db.query.trip_partecipants.findMany({
      with: {
        trip: {
          with: {
            partecipants: true,
          },
        },
      },
      where: eq(trip_partecipants.user_id, user_id),
    });

    const trips = await Promise.all(
      foundTrips.map(async (x) => {
        const trip = x.trip;

        if (trip.background_provider === ImageProvider.S3) {
          trip.background = await getTripThumbnail(trip.id);
        }

        return trip;
      }),
    );

    return trips;
  } catch (e) {
    throw new CustomError('Error while fetching trips', 500);
  }
};

export const getTrip = async (trip_id: string, user_id: string) => {
  try {
    const foundTrip = await db.query.trip_partecipants.findFirst({
      where: eq(trip_partecipants.trip_id, trip_id).append(
        eq(trip_partecipants.user_id, user_id),
      ),
      with: {
        trip: true,
      },
    });

    if (!foundTrip) {
      throw new CustomError('Trip not found', 404);
    }

    if (foundTrip.trip.background_provider === ImageProvider.S3) {
      foundTrip.trip.background = await getTripThumbnail(foundTrip.trip_id);
    }

    return foundTrip;
  } catch (e) {
    throw new CustomError('Error while fetching trip', 500);
  }
};

export const createTrip = async (
  trip: CreateTripSchemaType,
  user_id: string,
) => {
  const tripToCreate: InferInsertModel<typeof trips> = {
    ...trip,
    owner_id: user_id,
  };

  try {
    const createdTrip = await db.insert(trips).values(tripToCreate).returning();
    await db.insert(trip_partecipants).values({
      trip_id: createdTrip[0].id,
      user_id,
    });
    return createdTrip[0];
  } catch (e) {
    throw new CustomError('Error while creating trip', 500);
  }
};

export const deleteTrip = async (trip_id: string, user_id: string) => {
  try {
    const foundTrip = await db.query.trips.findFirst({
      where: eq(trips.id, trip_id).append(eq(trips.owner_id, user_id)),
    });

    if (!foundTrip) {
      throw new CustomError('Trip not found', 404);
    }

    let deletedTrip: InferSelectModel<typeof trips> | null = null;

    const promises = [
      db
        .delete(trips)
        .where(eq(trips.id, trip_id))
        .returning()
        .then((trip) => (deletedTrip = trip[0])),
      removeTripThumbnail(trip_id),
    ];

    await Promise.resolve(promises);

    return deletedTrip;
  } catch (e) {
    throw new CustomError('Error while deleting trip', 500);
  }
};

export const editTrip = async (
  tripId: string,
  trip: CreateTripSchemaType,
  userId: string,
) => {
  try {
    const foundTrip = await db.query.trips.findFirst({
      where: eq(trips.id, tripId).append(eq(trips.owner_id, userId)),
    });

    if (!foundTrip) {
      throw new CustomError('Trip not found', 404);
    }

    if (trip.background) {
      if (foundTrip.background_provider === ImageProvider.S3) {
        await removeTripThumbnail(tripId);
        trip.background_provider = ImageProvider.EXTERNAL_SERVICE;
      }
    }

    const updatedTrip = await db
      .update(trips)
      .set(trip)
      .where(eq(trips.id, tripId))
      .returning();

    return updatedTrip[0];
  } catch (e) {
    throw new CustomError('Error while updating trip', 500);
  }
};

const getTripThumbnail = async (tripId: string): Promise<string> => {
  return await getSignedImageUrl('trip_thumbnails', `trip-${tripId}-thumbnail`);
};

const removeTripThumbnail = async (tripId: string): Promise<void> => {
  try {
    const bucketParams = {
      Bucket: Bun.env.BUCKET_NAME!,
      Key: `trip-${tripId}-thumbnail`,
    };

    const command = new DeleteObjectCommand(bucketParams);

    const s3DeleteResult = await s3Client.send(command);

    if (s3DeleteResult.$metadata.httpStatusCode !== 204) {
      throw new CustomError('Error while deleting trip thumbnail', 500);
    }
  } catch (e) {
    throw new CustomError('Error while deleting trip thumbnail', 500);
  }
};
