import { z } from 'zod';

export const LoginSchema = z.object({
  token: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});
