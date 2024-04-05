import { users } from '@/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: InferSelectModel<typeof users>;
};
