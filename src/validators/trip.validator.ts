import { ImageProvider } from '@/models';
import { z } from 'zod';

export const CreateTripSchema = z.object({
  title: z.string().min(3),
  date: z.coerce.date(),
  background: z.string().url().nullable(),
  background_provider: z.nativeEnum(ImageProvider).nullable(),
});

export type CreateTripSchemaType = z.infer<typeof CreateTripSchema>;
