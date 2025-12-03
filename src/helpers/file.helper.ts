import { HttpStatus } from '@/config/errors';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const getThumbnailFromBody = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body['thumbnail'];

  if (!file || !(file instanceof File)) {
    throw new HTTPException(HttpStatus.BAD_REQUEST, {
      message: 'Missing thumbnail file',
    });
  }

  return file;
};
