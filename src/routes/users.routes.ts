/* eslint-disable drizzle/enforce-delete-with-where */
import { HttpStatus } from '@/config/errors';
import { getThumbnailFromBody } from '@/helpers';
import {
  deleteAccount,
  getCurrentUser,
  getUsersByUsername,
  setProfilePicture,
  setUsername,
  usernameAvailable,
} from '@/services';
import { ChangeUsernameSchema, usernameSchema } from '@/validators';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { z } from 'zod';

const usersRouter = new Hono();

usersRouter.use(
  '/*',
  jwt({
    secret: Bun.env.JWT_SECRET!,
  }),
);

usersRouter.get(
  '/',
  zValidator('query', z.object({ username: usernameSchema })),
  async (c) => {
    const { username } = c.req.valid('query');

    const payload = c.get('jwtPayload');
    const usersFound = await getUsersByUsername(username, payload.sub);

    return c.json(usersFound);
  },
);

usersRouter.get('/me', async (c) => {
  const payload = c.get('jwtPayload');

  return c.json(await getCurrentUser(payload.sub));
});

usersRouter.patch('/', zValidator('json', ChangeUsernameSchema), async (c) => {
  const payload = c.get('jwtPayload');
  const { username } = c.req.valid('json');

  const updatedUser = await setUsername(username, payload.sub);

  return c.json(updatedUser);
});

usersRouter.get(
  '/username_available',
  zValidator('query', z.object({ username: usernameSchema })),
  async (c) => {
    const { username } = c.req.valid('query');
    return c.text(String(await usernameAvailable(username)));
  },
);

usersRouter.patch('/set_profile_picture', async (c) => {
  const payload = c.get('jwtPayload');

  const profilePicture = await getThumbnailFromBody(c);

  const url = await setProfilePicture(payload.sub, profilePicture);

  return c.json(url);
});

usersRouter.delete('/delete_account', async (c) => {
  const payload = c.get('jwtPayload');

  await deleteAccount(payload.sub);

  return c.status(HttpStatus.OK);
});

export { usersRouter };
