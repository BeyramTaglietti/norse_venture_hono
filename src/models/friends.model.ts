import { friend_requests } from '@/drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type FriendRequestModel = InferSelectModel<typeof friend_requests>;
