import { CustomError } from '@/config/errors';
import { db } from '@/drizzle/db';
import { friends, users } from '@/drizzle/schema';
import { InferSelectModel, eq } from 'drizzle-orm';

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
    throw new CustomError('Error while fetching friends', 500);
  }
};

export const deleteFriend = async (
  userId: string,
  friendId: string,
): Promise<InferSelectModel<typeof users>> => {
  try {
    const friendToDelete = await db.query.friends.findFirst({
      where: eq(friends.user_id, userId).append(
        eq(friends.friend_id, friendId),
      ),
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
          eq(friends.user_id, userId).append(eq(friends.friend_id, friendId)),
        ),
    );

    promises.push(
      db
        .delete(friends)
        .where(
          eq(friends.user_id, friendId).append(eq(friends.friend_id, userId)),
        ),
    );

    await Promise.all(promises);

    return friendToDelete.friend;
  } catch (e) {
    throw new CustomError('Error while deleting friend', 500);
  }
};
