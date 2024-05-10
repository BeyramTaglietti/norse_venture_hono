import { HttpError, HttpStatus } from '@/config/errors';
import { FriendRequestModel, SafeUserModel } from '@/models';
import {
  addFriendRequest_db,
  addFriend_db,
  deleteFriendRequest_db,
  deleteFriend_db,
  findFriendById_db,
  findFriendRequest_db,
  findFriendRequests_db,
  findFriends_db,
} from '@/repositories';

export const getFriends = async (userId: string): Promise<SafeUserModel[]> => {
  const foundFriends = await findFriends_db(userId);

  return foundFriends;
};

export const deleteFriend = async (
  userId: string,
  friendId: string,
): Promise<SafeUserModel> => {
  const friendToDelete = await findFriendById_db(userId, friendId);

  if (!friendToDelete)
    throw new HttpError(HttpStatus.NOT_FOUND, {
      message: 'Friend not found',
    });

  try {
    const promises = [];

    promises.push(
      deleteFriend_db(userId, friendId),
      deleteFriend_db(friendId, userId),
    );

    await Promise.all(promises);

    return friendToDelete.friend;
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error deleting friend',
    });
  }
};

export const getFriendRequests = async (
  userId: string,
  type: 'sent' | 'received',
): Promise<SafeUserModel[]> => {
  return findFriendRequests_db(userId, type);
};

export const addFriendRequest = async (
  userId: string,
  friendId: string,
): Promise<FriendRequestModel> => {
  if (userId === friendId)
    throw new HttpError(HttpStatus.BAD_REQUEST, {
      message: 'You cannot add yourself as a friend',
    });

  const foundUser = await findFriendById_db(userId, friendId);

  if (foundUser)
    throw new HttpError(HttpStatus.BAD_REQUEST, {
      message: 'User is already a friend',
    });

  try {
    const addedFriend = await addFriendRequest_db(userId, friendId);
    return addedFriend;
  } catch (e) {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Failed to add friend request',
    });
  }
};

export const acceptFriendRequest = async (
  userId: string,
  friendId: string,
): Promise<SafeUserModel> => {
  const friendRequest = await findFriendRequest_db(friendId, userId);

  if (!friendRequest)
    throw new HttpError(HttpStatus.NOT_FOUND, {
      message: 'Friend request not found',
    });

  try {
    const promises = [
      deleteFriendRequest_db(friendId, userId),
      addFriend_db(userId, friendId),
      addFriend_db(friendId, userId),
    ];

    await Promise.all(promises);

    return friendRequest.sender;
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error accepting friend request',
    });
  }
};

export const denyFriendRequest = async (
  userId: string,
  friendId: string,
): Promise<SafeUserModel> => {
  const friendRequest = await findFriendRequest_db(friendId, userId);

  if (!friendRequest)
    throw new HttpError(HttpStatus.NOT_FOUND, {
      message: 'Friend request not found',
    });

  try {
    await deleteFriendRequest_db(friendId, userId);

    return friendRequest.sender;
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error denying friend request',
    });
  }
};
