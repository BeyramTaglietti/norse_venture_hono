import { CustomError, throwInternalServerError } from '@/config/errors';
import { resizeThumbnail, uploadToS3 } from '@/config/s3';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { InferSelectModel, eq, like } from 'drizzle-orm';

export const getUsersByUsername = async (
  username: string,
  userId?: string,
): Promise<InferSelectModel<typeof users>> => {
  const usersFound = await db.query.users.findMany({
    where: like(users.username, `%${username.toLowerCase()}%`),
  });

  if (!userId) return usersFound[0];

  return usersFound.filter((user) => user.id !== userId)[0];
};

export const setUsername = async (
  user: { username: string },
  userId: string,
): Promise<InferSelectModel<typeof users>> => {
  try {
    const updatedUser = await db
      .update(users)
      .set(user)
      .where(eq(users.id, userId))
      .returning();

    return updatedUser[0];
  } catch (e) {
    return throwInternalServerError(e, 'Error updating username');
  }
};

export const usernameAvailable = async (username: string): Promise<boolean> => {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  return !user;
};

export const deleteAccount = async (userId: string): Promise<void> => {
  await db.delete(users).where(eq(users.id, userId));
};

export const setProfilePicture = async (
  userId: string,
  profilePicture: File,
): Promise<string> => {
  const resizedImage = await resizeThumbnail(profilePicture, 500).catch((e) => {
    throw new CustomError(e, 500);
  });
  const resizedBuffer = await resizedImage.toBuffer();

  const thumbnailUrl = await uploadToS3({
    folder: 'user_pictures',
    fileName: `user-${userId}-picture`,
    resizedImage,
    resizedBuffer,
    isPublic: true,
  }).catch((e) => {
    throw new CustomError(e, 500);
  });

  await db
    .update(users)
    .set({ profile_picture: thumbnailUrl })
    .where(eq(users.id, userId));

  return thumbnailUrl;
};
