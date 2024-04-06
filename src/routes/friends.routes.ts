/* eslint-disable drizzle/enforce-delete-with-where */
import { throwCustomError } from '@/config/errors';
import { deleteFriend, getFriends } from '@/services/friends.service';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

const friendsRouter = new Hono();

friendsRouter.use(
  '/*',
  jwt({
    secret: Bun.env.JWT_SECRET!,
  }),
);

friendsRouter.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const friends = await getFriends(payload.user_id);
    return c.json(friends);
  } catch (e) {
    return throwCustomError(e, c);
  }
});

friendsRouter.delete('/:friend_id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const friendId = c.req.param('friend_id');
    const deletedFriend = await deleteFriend(payload.user_id, friendId);
    return c.json(deletedFriend, 200);
  } catch (e) {
    return throwCustomError(e, c);
  }
});

export { friendsRouter };
