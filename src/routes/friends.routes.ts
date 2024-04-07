/* eslint-disable drizzle/enforce-delete-with-where */
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
  const payload = c.get('jwtPayload');
  const friends = await getFriends(payload.sub);
  return c.json(friends);
});

friendsRouter.delete('/:friend_id', async (c) => {
  const payload = c.get('jwtPayload');
  const friendId = c.req.param('friend_id');
  const deletedFriend = await deleteFriend(payload.sub, friendId);
  return c.json(deletedFriend);
});

export { friendsRouter };
