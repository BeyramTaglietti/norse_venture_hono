import { db } from '@/drizzle/db';
import { friend_requests, friends } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';

export const findFriends_db = async (userId: string) => {
  const result = await db.query.friends.findMany({
    where: eq(friends.user_id, userId),
    with: {
      friend: {
        columns: {
          id: true,
          email: true,
          created_at: true,
          profile_picture: true,
          username: true,
        },
      },
    },
  });

  return result.map((friend) => friend.friend);
};

export const findFriendById_db = (userId: string, friendId: string) => {
  return db.query.friends.findFirst({
    where: and(eq(friends.user_id, userId), eq(friends.friend_id, friendId)),
    with: {
      friend: {
        columns: {
          id: true,
          email: true,
          created_at: true,
          profile_picture: true,
          username: true,
        },
      },
    },
  });
};

export const addFriend_db = async (userId: string, friendId: string) => {
  const addedFriend = await db
    .insert(friends)
    .values({
      user_id: userId,
      friend_id: friendId,
    })
    .returning();

  return addedFriend[0];
};

export const deleteFriend_db = async (userId: string, friendId: string) => {
  const deletedFriend = await db
    .delete(friends)
    .where(and(eq(friends.user_id, userId), eq(friends.friend_id, friendId)))
    .returning();

  return deletedFriend[0];
};

export const findFriendRequests_db = async (
  userId: string,
  type: 'sent' | 'received',
) => {
  const whereClause =
    type === 'sent'
      ? eq(friend_requests.sender_id, userId)
      : eq(friend_requests.receiver_id, userId);

  const friendRequestsFound = await db.query.friend_requests.findMany({
    where: whereClause,
    with: {
      sender: {
        columns: {
          id: true,
          email: true,
          created_at: true,
          profile_picture: true,
          username: true,
        },
      },
      receiver: {
        columns: {
          id: true,
          email: true,
          created_at: true,
          profile_picture: true,
          username: true,
        },
      },
    },
  });

  return friendRequestsFound.map((request) =>
    type === 'sent' ? request.receiver : request.sender,
  );
};

export const findFriendRequest_db = async (
  senderId: string,
  receiverId: string,
) => {
  return db.query.friend_requests.findFirst({
    where: and(
      eq(friend_requests.sender_id, senderId),
      eq(friend_requests.receiver_id, receiverId),
    ),
    with: {
      sender: {
        columns: {
          id: true,
          email: true,
          created_at: true,
          profile_picture: true,
          username: true,
        },
      },
    },
  });
};

export const addFriendRequest_db = async (userId: string, friendId: string) => {
  const requestSent = await db
    .insert(friend_requests)
    .values({
      sender_id: userId,
      receiver_id: friendId,
    })
    .returning();

  return requestSent[0];
};

export const deleteFriendRequest_db = async (
  senderId: string,
  receiverId: string,
) => {
  const deletedRequest = await db
    .delete(friend_requests)
    .where(
      and(
        eq(friend_requests.sender_id, senderId),
        eq(friend_requests.receiver_id, receiverId),
      ),
    )
    .returning();

  return deletedRequest[0];
};
