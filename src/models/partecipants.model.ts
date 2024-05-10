import { trip_partecipants } from '@/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';

export type PartecipantModel = InferSelectModel<typeof trip_partecipants>;
