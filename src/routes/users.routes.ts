/* eslint-disable drizzle/enforce-delete-with-where */
import { throwCustomError } from '@/config/errors';
import { getFileFromBody } from '@/helpers';
import {
  deleteAccount,
  getUsersByUsername,
  setProfilePicture,
  setUsername,
  usernameAvailable,
} from '@/services';
import { ChangeUsernameSchema, usernameSchema } from '@/validators';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

const usersRouter = new Hono();

usersRouter.use(
  '/*',
  jwt({
    secret: Bun.env.JWT_SECRET!,
  }),
);

usersRouter.get('/', async (c) => {
  try {
    const username = c.req.query('username') ?? '';

    const res = usernameSchema.safeParse(username);
    if (!res.success) return c.json(res, 400);

    const payload = c.get('jwtPayload');
    const usersFound = await getUsersByUsername(username, payload.sub);

    return c.json(usersFound);
  } catch (e) {
    return throwCustomError(e, c);
  }
});

usersRouter.put('/', zValidator('json', ChangeUsernameSchema), async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const user = c.req.valid('json');

    const updatedUser = await setUsername(user, payload.sub);

    return c.json(updatedUser);
  } catch (e) {
    return throwCustomError(e, c);
  }
});

usersRouter.get('/username_available', async (c) => {
  try {
    const username = c.req.query('username') ?? '';
    const res = usernameSchema.safeParse(username);
    if (!res.success) return c.json(res, 400);

    return c.text(String(await usernameAvailable(username)));
  } catch (e) {
    return throwCustomError(e, c);
  }
});

usersRouter.delete('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');

    await deleteAccount(payload.sub);

    return c.status(204);
  } catch (e) {
    return throwCustomError(e, c);
  }
});

usersRouter.patch('/set_profile_picture', async (c) => {
  try {
    const payload = c.get('jwtPayload');

    const profilePicture = await getFileFromBody(c);

    const newUrl = await setProfilePicture(payload.sub, profilePicture);

    return c.text(newUrl, 204);
  } catch (e) {
    return throwCustomError(e, c);
  }
});

export { usersRouter };
