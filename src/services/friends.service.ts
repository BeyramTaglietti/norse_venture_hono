import { HttpStatus } from '@/config/errors';
import { db } from '@/drizzle/db';
import { friend_requests, friends, users } from '@/drizzle/schema';
import { InferInsertModel, InferSelectModel, and, eq, or } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export const getFriends = async (
  userId: string,
): Promise<InferSelectModel<typeof users>[]> => {
  const foundUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      friends: {
        with: {
          friend: true,
        },
      },
    },
  });

  if (!foundUser)
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'User not found',
    });

  return foundUser.friends.map((friend) => friend.friend);
};

export const deleteFriend = async (
  userId: string,
  friendId: string,
): Promise<InferSelectModel<typeof users>> => {
  const friendToDelete = await db.query.friends.findFirst({
    where: and(eq(friends.user_id, userId), eq(friends.friend_id, friendId)),
    with: {
      friend: true,
    },
  });

  if (!friendToDelete)
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Friend not found',
    });

  const promises = [];

  promises.push(
    db
      .delete(friends)
      .where(and(eq(friends.user_id, userId), eq(friends.friend_id, friendId))),
  );

  promises.push(
    db
      .delete(friends)
      .where(and(eq(friends.user_id, friendId), eq(friends.friend_id, userId))),
  );

  await Promise.all(promises);

  return friendToDelete.friend;
};

export const getFriendRequests = async (
  userId: string,
  type: 'sent' | 'received',
): Promise<InferSelectModel<typeof users>[]> => {
  const whereClause =
    type === 'sent'
      ? eq(friend_requests.sender_id, userId)
      : eq(friend_requests.receiver_id, userId);

  const friendRequestsFound = await db.query.friend_requests.findMany({
    where: whereClause,
    with: {
      sender: true,
      receiver: true,
    },
  });

  return friendRequestsFound.map((request) =>
    type === 'sent' ? request.receiver : request.sender,
  );
};

export const addFriendRequest = async (
  userId: string,
  friendId: string,
): Promise<InferInsertModel<typeof friend_requests>> => {
  if (userId === friendId)
    throw new HTTPException(HttpStatus.BAD_REQUEST, {
      message: 'You cannot add yourself as a friend',
    });

  const foundUser = await db.query.users.findFirst({
    where: eq(users.id, friendId),
    with: {
      friends: true,
      friend_requests: true,
    },
  });

  const friendRequest = await db.query.friend_requests.findFirst({
    where: or(
      and(
        eq(friend_requests.sender_id, userId),
        eq(friend_requests.receiver_id, friendId),
      ),
      and(
        eq(friend_requests.sender_id, friendId),
        eq(friend_requests.receiver_id, userId),
      ),
    ),
  });

  if (!foundUser)
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Friend not found',
    });

  if (foundUser.friends.find((x) => x.friend_id === userId))
    throw new HTTPException(HttpStatus.BAD_REQUEST, {
      message: 'User is already a friend',
    });

  if (friendRequest)
    throw new HTTPException(HttpStatus.BAD_REQUEST, {
      message: 'Friend request already created',
    });

  const requestSent = await db
    .insert(friend_requests)
    .values({
      sender_id: userId,
      receiver_id: friendId,
    })
    .returning();

  return requestSent[0];
};

export const acceptFriendRequest = async (
  userId: string,
  friendId: string,
): Promise<InferInsertModel<typeof users>> => {
  const friendRequest = await db.query.friend_requests.findFirst({
    where: and(
      eq(friend_requests.sender_id, friendId),
      eq(friend_requests.receiver_id, userId),
    ),
    with: {
      sender: true,
    },
  });

  if (!friendRequest)
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Friend request not found',
    });

  const promises = [];

  promises.push(
    db
      .delete(friend_requests)
      .where(
        and(
          eq(friend_requests.sender_id, friendId),
          eq(friend_requests.receiver_id, userId),
        ),
      ),
    db.insert(friends).values({
      user_id: userId,
      friend_id: friendId,
    }),
    db.insert(friends).values({
      user_id: friendId,
      friend_id: userId,
    }),
  );

  await Promise.all(promises);

  return friendRequest.sender;
};

export const denyFriendRequest = async (
  userId: string,
  friendId: string,
): Promise<InferInsertModel<typeof users>> => {
  const friendRequest = await db.query.friend_requests.findFirst({
    where: and(
      eq(friend_requests.sender_id, friendId),
      eq(friend_requests.receiver_id, userId),
    ),
    with: {
      sender: true,
    },
  });

  if (!friendRequest)
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Friend request not found',
    });

  await db
    .delete(friend_requests)
    .where(
      and(
        eq(friend_requests.sender_id, friendId),
        eq(friend_requests.receiver_id, userId),
      ),
    )
    .returning();

  return friendRequest.sender;
};
