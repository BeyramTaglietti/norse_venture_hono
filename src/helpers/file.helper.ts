import { CustomError } from '@/config/errors';
import { Context } from 'hono';

export const getFileFromBody = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!file || !(file instanceof File)) {
    throw new CustomError('Missing file', 400);
  }

  return file;
};
