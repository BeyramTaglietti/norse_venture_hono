import { HttpStatus } from '@/config/errors';
import { db } from '@/drizzle/db';
import { friends, users } from '@/drizzle/schema';
import { InferSelectModel, and, eq } from 'drizzle-orm';
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
