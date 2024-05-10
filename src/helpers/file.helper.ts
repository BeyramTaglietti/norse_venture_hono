import { HttpError, HttpStatus } from '@/config/errors';
import { Context } from 'hono';

export const getThumbnailFromBody = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body['thumbnail'];

  if (!file || !(file instanceof File)) {
    throw new HttpError(HttpStatus.BAD_REQUEST, {
      message: 'Missing thumbnail file',
    });
  }

  return file;
};
