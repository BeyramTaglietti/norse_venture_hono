import { HttpStatus } from '@/config/errors';
import { resizeThumbnail, uploadToS3 } from '@/config/s3';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { SafeUser } from '@/models';
import { eq, ilike } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export const getUsersByUsername = async (
  username: string,
  userId: string,
): Promise<SafeUser[]> => {
  const usersFound = await db.query.users.findMany({
    where: ilike(users.username, `%${username}%`),
    columns: {
      id: true,
      email: true,
      created_at: true,
      profile_picture: true,
      username: true,
    },
    limit: 20,
  });

  return usersFound.filter((user) => user.id !== userId);
};

export const getCurrentUser = async (userId: string): Promise<SafeUser> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      created_at: true,
      profile_picture: true,
      username: true,
    },
  });

  if (!user)
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'User not found',
    });

  return user;
};

export const setUsername = async (
  username: string,
  userId: string,
): Promise<SafeUser> => {
  const updatedUser = await db
    .update(users)
    .set({
      username,
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      created_at: users.created_at,
      profile_picture: users.profile_picture,
      username: users.username,
    });

  return updatedUser[0];
};

export const usernameAvailable = async (username: string): Promise<boolean> => {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  return !user;
};

export const deleteAccount = async (userId: string): Promise<SafeUser> => {
  const deletedUser = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      created_at: users.created_at,
      profile_picture: users.profile_picture,
      username: users.username,
    });

  return deletedUser[0];
};

export const setProfilePicture = async (
  userId: string,
  profilePicture: File,
): Promise<string> => {
  const resizedImage = await resizeThumbnail(profilePicture, 500);
  const resizedBuffer = await resizedImage.toBuffer();

  const thumbnailUrl = await uploadToS3({
    folder: 'user_pictures',
    fileName: `user-${userId}-picture`,
    resizedImage,
    resizedBuffer,
    isPublic: true,
  });

  await db
    .update(users)
    .set({ profile_picture: thumbnailUrl })
    .where(eq(users.id, userId));

  return thumbnailUrl;
};
