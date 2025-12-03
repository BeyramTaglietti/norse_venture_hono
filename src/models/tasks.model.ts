import { tasks } from '@/drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type TaskModel = InferSelectModel<typeof tasks>;
