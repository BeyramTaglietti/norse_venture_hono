import { trip_partecipants } from '@/drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type PartecipantModel = InferSelectModel<typeof trip_partecipants>;
