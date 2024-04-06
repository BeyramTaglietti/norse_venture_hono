import { CustomError } from '@/config/errors';
import { Context } from 'hono';

export const getThumbnailFromBody = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body['thumbnail'];

  if (!file || !(file instanceof File)) {
    throw new CustomError('Missing file', 400);
  }

  return file;
};
