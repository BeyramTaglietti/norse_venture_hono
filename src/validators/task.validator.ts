import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.coerce.date(),
  price: z
    .number()
    .transform((value) => {
      return parseFloat(value.toFixed(2));
    })
    .pipe(z.number().optional())
    .optional()
    .nullable(),
});

export const updateTaskSchema = createTaskSchema.extend({
  value: z.boolean().optional(),
});

export type CreateTaskSchemaType = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchemaType = z.infer<typeof updateTaskSchema>;
