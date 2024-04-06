import { CustomError, throwInternalServerError } from '@/config/errors';
import {
  getSignedImageUrl,
  resizeThumbnail,
  s3Client,
  uploadToS3,
} from '@/config/s3';
import { db } from '@/drizzle/db';
import { trip_partecipants, trips } from '@/drizzle/schema';
import { ImageProvider } from '@/models';
import { CreateTripSchemaType } from '@/validators';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { InferInsertModel, InferSelectModel, and, eq } from 'drizzle-orm';

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
    return throwInternalServerError(e);
  }
};

export const getTrip = async (
  trip_id: string,
  user_id: string,
): Promise<InferSelectModel<typeof trips>> => {
  try {
    const foundTrip = await db.query.trip_partecipants.findFirst({
      where: and(
        eq(trip_partecipants.trip_id, trip_id),
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

    return foundTrip.trip;
  } catch (e) {
    return throwInternalServerError(e);
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
    const firstPartecipants = await db
      .insert(trip_partecipants)
      .values({
        trip_id: createdTrip[0].id,
        user_id,
      })
      .returning();
    return { ...createdTrip[0], partecipants: [firstPartecipants[0]] };
  } catch (e) {
    return throwInternalServerError(e);
  }
};

export const deleteTrip = async (trip_id: string, user_id: string) => {
  try {
    const foundTrip = await db.query.trips.findFirst({
      where: and(eq(trips.id, trip_id), eq(trips.owner_id, user_id)),
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
    return throwInternalServerError(e);
  }
};

export const editTrip = async (
  tripId: string,
  trip: CreateTripSchemaType,
  userId: string,
) => {
  try {
    const foundTrip = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
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
    return throwInternalServerError(e);
  }
};

export const updateThumbnail = async (
  tripId: string,
  userId: string,
  thumbnail: File,
): Promise<string> => {
  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
  });

  if (!trip) throw new CustomError('Trip not found', 404);

  const resizedImage = await resizeThumbnail(thumbnail, 500);
  const resizedBuffer = await resizedImage.toBuffer();

  const thumbnailUrl = await uploadToS3({
    folder: 'trip_thumbnails',
    fileName: `trip-${tripId}-thumbnail`,
    resizedBuffer,
    resizedImage,
  }).catch((e) => {
    throw new CustomError(e, 500);
  });

  await db
    .update(trips)
    .set({
      background: thumbnailUrl,
      background_provider: ImageProvider.S3,
    })
    .where(eq(trips.id, tripId));

  return getTripThumbnail(tripId);
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
    return throwInternalServerError(e);
  }
};
