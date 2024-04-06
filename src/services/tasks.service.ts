import { CustomError, throwInternalServerError } from '@/config/errors';
import { db } from '@/drizzle/db';
import { tasks, trips } from '@/drizzle/schema';
import { CreateTaskSchemaType, UpdateTaskSchemaType } from '@/validators';
import { InferInsertModel, InferSelectModel, and, eq } from 'drizzle-orm';

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
    return throwInternalServerError(e);
  }
};

export const createTask = async (
  tripId: string,
  userId: string,
  task: CreateTaskSchemaType,
): Promise<InferSelectModel<typeof tasks>> => {
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

    const newTask = await db.insert(tasks).values(taskToCreate).returning();

    return newTask[0];
  } catch (e) {
    return throwInternalServerError(e);
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
      .where(and(eq(tasks.id, taskId), eq(tasks.trip_id, tripId)))
      .returning();

    return updatedTask;
  } catch (e) {
    return throwInternalServerError(e);
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
      .where(and(eq(tasks.id, taskId), eq(tasks.trip_id, tripId)))
      .returning();

    return deletedTask;
  } catch (e) {
    return throwInternalServerError(e);
  }
};
