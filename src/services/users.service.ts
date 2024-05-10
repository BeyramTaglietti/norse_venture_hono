import { HttpError, HttpStatus } from '@/config/errors';
import { resizeThumbnail, uploadToS3 } from '@/config/s3';
import { SafeUserModel } from '@/models';
import {
  deleteUser_db,
  findUserByEqualUsername_db,
  findUserById_db,
  findUserByLikeUsername_db,
  updateUser_db,
} from '@/repositories';

export const getUsersByUsername = async (
  username: string,
  userId: string,
): Promise<SafeUserModel[]> => {
  const usersFound = await findUserByLikeUsername_db(userId, username);

  return usersFound.filter((user) => user.id !== userId);
};

export const getCurrentUser = async (
  userId: string,
): Promise<SafeUserModel> => {
  const user = await findUserById_db(userId);

  if (!user)
    throw new HttpError(HttpStatus.NOT_FOUND, {
      message: 'User not found',
    });

  return user;
};

export const setUsername = async (
  username: string,
  userId: string,
): Promise<SafeUserModel> => {
  try {
    const updatedUser = await updateUser_db(userId, { username });

    return updatedUser;
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error updating username',
    });
  }
};

export const usernameAvailable = async (username: string): Promise<boolean> => {
  const user = await findUserByEqualUsername_db(username);

  return !user;
};

export const deleteAccount = async (userId: string): Promise<SafeUserModel> => {
  try {
    const deletedUser = await deleteUser_db(userId);

    return deletedUser;
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error deleting user',
    });
  }
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

  try {
    await updateUser_db(userId, { profile_picture: thumbnailUrl });

    return thumbnailUrl;
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while updating profile picture',
    });
  }
};
