import { googleLogin } from '@/services/auth.service';
import { LoginSchema } from '@/validators';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const authRouter = new Hono();

authRouter.post(
  '/google_login',
  zValidator('json', LoginSchema, (result, c) => {
    if (!result.success) {
      return c.text('Invalid body!', 400);
    }
  }),
  async (c) => {
    const { token } = c.req.valid('json');
    const trips = await googleLogin(token);
    return c.json(trips);
  },
);

authRouter.post('/apple_login', (c) => {});
authRouter.post('/refresh_token', (c) => {});

export { authRouter };
