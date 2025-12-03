import { trip_partecipants, trips } from '@/drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type TripWitPartecipantsModel = InferSelectModel<typeof trips> & {
  partecipants: InferSelectModel<typeof trip_partecipants>[];
};

export type TripModel = InferSelectModel<typeof trips>;
