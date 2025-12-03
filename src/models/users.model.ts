import { users } from '@/drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type UserModel = InferSelectModel<typeof users>;

export type SafeUserModel = Omit<UserModel, 'refresh_token'>;
