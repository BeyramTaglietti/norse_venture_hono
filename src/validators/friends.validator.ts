import { z } from 'zod';

export const addFriendRequestSchema = z.object({
  friend_id: z.string(),
});
export const updateFriendRequestSchema = z.object({
  friend_id: z.string(),
  accept: z.boolean(),
});
