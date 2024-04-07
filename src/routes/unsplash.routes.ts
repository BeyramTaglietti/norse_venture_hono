import { HttpStatus } from '@/config/errors';
import { getImages, triggerDownload } from '@/services';
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
  const keyword = c.req.query('keyword') ?? '';
  const images = await getImages(keyword);
  return c.json(images);
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
    const body = c.req.valid('json');
    await triggerDownload(body.url);
    return c.json({ message: 'Download triggered' }, HttpStatus.NO_CONTENT);
  },
);

export { unsplashRouter };
