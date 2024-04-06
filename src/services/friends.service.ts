import { CustomError, throwInternalServerError } from '@/config/errors';
import { db } from '@/drizzle/db';
import { friends, users } from '@/drizzle/schema';
import { InferSelectModel, and, eq } from 'drizzle-orm';

export const getFriends = async (
  user_id: string,
): Promise<InferSelectModel<typeof users>[]> => {
  try {
    const foundUser = await db.query.users.findFirst({
      where: eq(users.id, user_id),
      with: {
        friends: {
          with: {
            friend: true,
          },
        },
      },
    });

    if (!foundUser) throw new CustomError('User not found', 404);

    return foundUser.friends.map((friend) => friend.friend);
  } catch (e) {
    return throwInternalServerError(e);
  }
};

export const deleteFriend = async (
  userId: string,
  friendId: string,
): Promise<InferSelectModel<typeof users>> => {
  try {
    const friendToDelete = await db.query.friends.findFirst({
      where: and(eq(friends.user_id, userId), eq(friends.friend_id, friendId)),
      with: {
        friend: true,
      },
    });

    if (!friendToDelete) throw new CustomError('Friend not found', 404);

    const promises = [];

    promises.push(
      db
        .delete(friends)
        .where(
          and(eq(friends.user_id, userId), eq(friends.friend_id, friendId)),
        ),
    );

    promises.push(
      db
        .delete(friends)
        .where(
          and(eq(friends.user_id, friendId), eq(friends.friend_id, userId)),
        ),
    );

    await Promise.all(promises);

    return friendToDelete.friend;
  } catch (e) {
    return throwInternalServerError(e);
  }
};
