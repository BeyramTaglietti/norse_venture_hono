import { user } from '@/drizzle/schema';

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: typeof user.$inferSelect;
};
