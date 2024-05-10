import { friend_requests } from '@/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';

export type FriendRequestModel = InferSelectModel<typeof friend_requests>;
