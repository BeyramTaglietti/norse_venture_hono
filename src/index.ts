import { Hono } from 'hono';
import { showRoutes } from 'hono/dev';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { client } from './drizzle/db';
import {
  authRouter,
  friendsRouter,
  tripsRouter,
  unsplashRouter,
  usersRouter,
} from './routes';

await client.connect();

const router = new Hono(); // .basePath('/v1')

if (Bun.env.NODE_ENV === 'development') router.use(logger());

router.route('v1/trips', tripsRouter);
router.route('v1/auth', authRouter);
router.route('v1/unsplash', unsplashRouter);
router.route('v1/users', usersRouter);
router.route('v1/friends', friendsRouter);

router.get('/', (c) => {
  return c.text('This is Norse Venture running on Bun!');
});

router.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.log(JSON.stringify(err, null, 2));
  return c.json({ message: 'Internal Server Error', error: err.message }, 500);
});

showRoutes(router);

export default router;
