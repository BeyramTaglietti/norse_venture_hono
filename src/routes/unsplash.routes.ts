import { throwCustomError } from '@/config/errors';
import { getImages } from '@/services';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { z } from 'zod';

const unsplashRouter = new Hono();

unsplashRouter.use(
  '/*',
  jwt({
    secret: Bun.env.JWT_SECRET!,
  }),
);

unsplashRouter.get('/', async (c) => {
  try {
    const keyword = c.req.query('keyword') ?? '';
    const images = await getImages(keyword);
    return c.json(images, 200);
  } catch (error) {
    return throwCustomError(error, c);
  }
});

unsplashRouter.post(
  '/trigger_download',
  zValidator(
    'json',
    z.object({
      url: z.string(),
    }),
  ),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const images = await getImages(body.url);
      return c.json(images, 200);
    } catch (error) {
      return throwCustomError(error, c);
    }
  },
);

export { unsplashRouter };
