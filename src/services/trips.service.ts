import { HttpStatus } from '@/config/errors';
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
import { HTTPException } from 'hono/http-exception';

export const getTrips = async (user_id: string) => {
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
};

export const getTrip = async (
  trip_id: string,
  user_id: string,
): Promise<InferSelectModel<typeof trips>> => {
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
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (foundTrip.trip.background_provider === ImageProvider.S3) {
    foundTrip.trip.background = await getTripThumbnail(foundTrip.trip_id);
  }

  return foundTrip.trip;
};

export const createTrip = async (
  trip: CreateTripSchemaType,
  user_id: string,
) => {
  const tripToCreate: InferInsertModel<typeof trips> = {
    ...trip,
    owner_id: user_id,
  };

  const createdTrip = await db.insert(trips).values(tripToCreate).returning();
  const firstPartecipants = await db
    .insert(trip_partecipants)
    .values({
      trip_id: createdTrip[0].id,
      user_id,
    })
    .returning();
  return { ...createdTrip[0], partecipants: [firstPartecipants[0]] };
};

export const deleteTrip = async (
  trip_id: string,
  user_id: string,
): Promise<InferSelectModel<typeof trips>> => {
  const foundTrip = await db.query.trips.findFirst({
    where: and(eq(trips.id, trip_id), eq(trips.owner_id, user_id)),
  });

  if (!foundTrip) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  let deletedTrip: InferSelectModel<typeof trips> | null = null;

  const promises = [
    db
      .delete(trips)
      .where(eq(trips.id, trip_id))
      .returning()
      .then((res) => {
        deletedTrip = res[0];
      }),
    removeTripThumbnail(trip_id),
  ];

  await Promise.all(promises);

  if (!deletedTrip) {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while deleting trip',
    });
  }

  return deletedTrip;
};

export const editTrip = async (
  tripId: string,
  trip: CreateTripSchemaType,
  userId: string,
) => {
  const foundTrip = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
  });

  if (!foundTrip) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (trip.background) {
    if (foundTrip.background_provider === ImageProvider.S3) {
      await removeTripThumbnail(tripId);
      trip.background_provider = ImageProvider.EXTERNAL_SERVICE;
    }
  }

  const updatedTrip = await db
    .update(trips)
    .set({
      ...trip,
      background_provider: trip.background_provider
        ? trip.background_provider
        : foundTrip.background_provider,
      background: trip.background ? trip.background : foundTrip.background,
    })
    .where(eq(trips.id, tripId))
    .returning();

  return updatedTrip[0];
};

export const updateThumbnail = async (
  tripId: string,
  userId: string,
  thumbnail: File,
): Promise<string> => {
  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.owner_id, userId)),
  });

  if (!trip) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  const resizedImage = await resizeThumbnail(thumbnail, 500);
  const resizedBuffer = await resizedImage.toBuffer();

  const thumbnailUrl = await uploadToS3({
    folder: 'trip_thumbnails',
    fileName: `trip-${tripId}-thumbnail`,
    resizedBuffer,
    resizedImage,
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
  const bucketParams = {
    Bucket: Bun.env.BUCKET_NAME!,
    Key: `trip-${tripId}-thumbnail`,
  };

  const command = new DeleteObjectCommand(bucketParams);

  const s3DeleteResult = await s3Client.send(command);

  if (s3DeleteResult.$metadata.httpStatusCode !== HttpStatus.NO_CONTENT) {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while deleting trip thumbnail',
    });
  }
};
