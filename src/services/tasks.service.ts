import { CustomError } from '@/config/errors';
import { db } from '@/drizzle/db';
import { tasks, trips } from '@/drizzle/schema';
import { CreateTaskSchemaType, UpdateTaskSchemaType } from '@/validators';
import { InferInsertModel, eq } from 'drizzle-orm';

export const getTasks = async (tripId: string, userId: string) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: {
        tasks: true,
        partecipants: true,
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
      throw new CustomError('User not partecipant of this trip', 403);
    }

    return tripFound.tasks;
  } catch (e) {
    throw new CustomError('Error while fetching tasks', 500);
  }
};

export const createTask = async (
  tripId: string,
  userId: string,
  task: CreateTaskSchemaType,
) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: {
        partecipants: true,
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
      throw new CustomError('User not partecipant of this trip', 403);
    }

    const taskToCreate: InferInsertModel<typeof tasks> = {
      ...task,
      trip_id: tripId,
    };

    const newTask = await db.insert(tasks).values(taskToCreate);

    return newTask;
  } catch (e) {
    throw new CustomError('Error while creating task', 500);
  }
};

export const putTask = async (
  tripId: string,
  userId: string,
  taskId: string,
  task: UpdateTaskSchemaType,
) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: {
        partecipants: true,
        tasks: true,
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
      throw new CustomError('User not partecipant of this trip', 403);
    }

    const taskFound = tripFound.tasks.find((x) => x.id === taskId);

    if (!taskFound) {
      throw new CustomError('task not found', 404);
    }

    const taskToUpdate: InferInsertModel<typeof tasks> = {
      ...task,
      trip_id: tripId,
    };

    const updatedTask = await db
      .update(tasks)
      .set(taskToUpdate)
      .where(eq(tasks.id, taskId).append(eq(tasks.trip_id, tripId)))
      .returning();

    return updatedTask;
  } catch (e) {
    throw new CustomError('Error while updating task', 500);
  }
};

export const deleteTask = async (
  tripId: string,
  userId: string,
  taskId: string,
) => {
  try {
    const tripFound = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: {
        partecipants: true,
        tasks: true,
      },
    });

    if (!tripFound) {
      throw new CustomError('trip not found', 404);
    }

    if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
      throw new CustomError('User not partecipant of this trip', 403);
    }

    const taskFound = tripFound.tasks.find((x) => x.id === taskId);

    if (!taskFound) {
      throw new CustomError('task not found', 404);
    }

    const deletedTask = await db
      .delete(tasks)
      .where(eq(tasks.id, taskId).append(eq(tasks.trip_id, tripId)))
      .returning();

    return deletedTask;
  } catch (e) {
    throw new CustomError('Error while deleting task', 500);
  }
};
