import { z } from 'zod';

export const LoginSchema = z.object({
  token: z.string().min(1),
});
