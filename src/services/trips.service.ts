import { HttpStatus } from '@/config/errors';
import {
  getSignedImageUrl,
  resizeThumbnail,
  s3Client,
  uploadToS3,
} from '@/config/s3';
import {
  ImageProvider,
  type TripModel,
  type TripWitPartecipantsModel,
} from '@/models';
import {
  addTripPartecipant_db,
  createTrip_db,
  deleteTrip_db,
  findTripByOwnerId_db,
  findTripByPartecipant_db,
  findTripsWithPartecipants_db,
  updateTrip_db,
} from '@/repositories';
import type { CreateTripSchemaType } from '@/validators';
import {
  DeleteObjectCommand,
  type DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import { HTTPException } from 'hono/http-exception';

export const getTrips = async (
  user_id: string,
): Promise<TripWitPartecipantsModel[]> => {
  const foundTrips = await findTripsWithPartecipants_db(user_id);
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
): Promise<TripModel> => {
  const foundTrip = await findTripByPartecipant_db(trip_id, user_id);

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
): Promise<TripWitPartecipantsModel> => {
  const tripToCreate = {
    ...trip,
    owner_id: user_id,
  };

  try {
    const createdTrip = await createTrip_db(tripToCreate);
    const firstPartecipant = await addTripPartecipant_db(
      createdTrip.id,
      user_id,
    );

    return { ...createdTrip, partecipants: [firstPartecipant] };
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while creating trip',
    });
  }
};

export const deleteTrip = async (
  trip_id: string,
  owner_id: string,
): Promise<TripModel> => {
  try {
    const deletedTrip = await deleteTrip_db(trip_id, owner_id);

    if (deletedTrip.background_provider === ImageProvider.S3)
      await removeTripThumbnail(trip_id);

    return deletedTrip;
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while deleting trip',
    });
  }
};

export const editTrip = async (
  tripId: string,
  trip: CreateTripSchemaType,
  ownerId: string,
): Promise<TripModel> => {
  const foundTrip = await findTripByOwnerId_db(tripId, ownerId);

  if (!foundTrip) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  try {
    const promises = [];

    if (trip.background) {
      if (foundTrip.background_provider === ImageProvider.S3) {
        promises.push(removeTripThumbnail(tripId));
        trip.background_provider = ImageProvider.EXTERNAL_SERVICE;
      }
    }

    let updatedTrip: Awaited<ReturnType<typeof updateTrip_db>> | undefined;

    promises.push(
      updateTrip_db(tripId, ownerId, {
        ...trip,
        background_provider: trip.background_provider
          ? trip.background_provider
          : foundTrip.background_provider,
        background: trip.background ? trip.background : foundTrip.background,
      }).then((x) => (updatedTrip = x)),
    );

    await Promise.all(promises);

    if (!updatedTrip)
      throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Error while updating trip',
      });

    return updatedTrip;
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while updating trip',
    });
  }
};

export const updateThumbnail = async (
  tripId: string,
  ownerId: string,
  thumbnail: File,
): Promise<string> => {
  const trip = await findTripByOwnerId_db(tripId, ownerId);

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

  try {
    await updateTrip_db(tripId, ownerId, {
      background: thumbnailUrl,
      background_provider: ImageProvider.S3,
    });

    return getTripThumbnail(tripId);
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while updating trip thumbnail',
    });
  }
};

const getTripThumbnail = async (tripId: string): Promise<string> => {
  return await getSignedImageUrl('trip_thumbnails', `trip-${tripId}-thumbnail`);
};

const removeTripThumbnail = async (tripId: string): Promise<void> => {
  const bucketParams: DeleteObjectCommandInput = {
    Bucket: Bun.env.BUCKET_NAME!,
    Key: `trip_thumbnails/trip-${tripId}-thumbnail`,
  };

  const command = new DeleteObjectCommand(bucketParams);

  const s3DeleteResult = await s3Client.send(command);

  if (s3DeleteResult.$metadata.httpStatusCode !== HttpStatus.NO_CONTENT) {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while deleting trip thumbnail',
    });
  }
};
