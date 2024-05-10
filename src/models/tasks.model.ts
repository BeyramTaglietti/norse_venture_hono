import { tasks } from '@/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';

export type TaskModel = InferSelectModel<typeof tasks>;
