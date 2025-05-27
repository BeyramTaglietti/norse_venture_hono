import { db } from '@/drizzle/db';
import { tasks } from '@/drizzle/schema';
import { InferInsertModel, and, eq } from 'drizzle-orm';

export const findTripTasks_db = (tripId: string) => {
  return db.query.tasks.findMany({
    where: eq(tasks.trip_id, tripId),
    orderBy: (tasks, { asc }) => [asc(tasks.created_at)],
  });
};

export const createTask_db = async (task: InferInsertModel<typeof tasks>) => {
  const createdTask = await db.insert(tasks).values(task).returning();

  return createdTask[0];
};

export const updateTask_db = async (
  taskId: string,
  tripId: string,
  task: InferInsertModel<typeof tasks>,
) => {
  const updatedTask = await db
    .update(tasks)
    .set(task)
    .where(and(eq(tasks.id, taskId), eq(tasks.trip_id, tripId)))
    .returning();

  return updatedTask[0];
};

export const deleteTask_db = async (taskId: string, tripId: string) => {
  const deletedTask = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.trip_id, tripId)))
    .returning();

  return deletedTask[0];
};
