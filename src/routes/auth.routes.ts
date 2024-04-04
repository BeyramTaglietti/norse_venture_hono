import { appleLogin, googleLogin, refreshToken } from '@/services';
import { LoginSchema, RefreshTokenSchema } from '@/validators';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const authRouter = new Hono();

authRouter.post('/google_login', zValidator('json', LoginSchema), async (c) => {
  const { token } = c.req.valid('json');
  const res = await googleLogin(token);
  return c.json(res);
});

authRouter.post('/apple_login', zValidator('json', LoginSchema), async (c) => {
  const { token } = c.req.valid('json');
  const res = await appleLogin(token);
  return c.json(res);
});

authRouter.post(
  '/refresh_token',
  zValidator('json', RefreshTokenSchema),
  async (c) => {
    const { refresh_token } = c.req.valid('json');
    const res = await refreshToken(refresh_token);
    return c.json(res);
  },
);

export { authRouter };
