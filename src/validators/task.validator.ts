import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  price: z
    .number()
    .refine(
      (n) => {
        return n.toString().split('.')[1].length <= 2;
      },
      { message: 'Max precision is 2 decimal places' },
    )
    .optional(),
});

export const updateTaskSchema = createTaskSchema.extend({
  value: z.boolean().optional(),
});

export type CreateTaskSchemaType = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchemaType = z.infer<typeof updateTaskSchema>;
