import {
  acceptFriendRequest,
  addFriendRequest,
  deleteFriend,
  denyFriendRequest,
  getFriendRequests,
  getFriends,
} from '@/services';
import {
  addFriendRequestSchema,
  updateFriendRequestSchema,
} from '@/validators';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { z } from 'zod';

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

// eslint-disable-next-line drizzle/enforce-delete-with-where
friendsRouter.delete('/:friend_id', async (c) => {
  const payload = c.get('jwtPayload');
  const friendId = c.req.param('friend_id');
  const deletedFriend = await deleteFriend(payload.sub, friendId);
  return c.json(deletedFriend);
});

friendsRouter.get(
  '/requests',
  zValidator(
    'query',
    z.object({
      type: z.enum(['sent', 'received']),
    }),
  ),
  async (c) => {
    const payload = c.get('jwtPayload');
    const { type } = c.req.valid('query');
    const friends = await getFriendRequests(payload.sub, type);
    return c.json(friends);
  },
);

friendsRouter.post(
  '/requests',
  zValidator('json', addFriendRequestSchema),
  async (c) => {
    const payload = c.get('jwtPayload');
    const { friend_id } = c.req.valid('json');
    const friends = await addFriendRequest(payload.sub, friend_id);
    return c.json(friends);
  },
);

friendsRouter.put(
  '/requests',
  zValidator('json', updateFriendRequestSchema),
  async (c) => {
    const payload = c.get('jwtPayload');
    const { accept, friend_id } = c.req.valid('json');

    if (accept)
      return c.json(await acceptFriendRequest(payload.sub, friend_id));

    return c.json(await denyFriendRequest(payload.sub, friend_id));
  },
);

export { friendsRouter };
