import { HttpStatus } from '@/config/errors';
import { db } from '@/drizzle/db';
import { tasks, trips } from '@/drizzle/schema';
import { CreateTaskSchemaType, UpdateTaskSchemaType } from '@/validators';
import { InferInsertModel, InferSelectModel, and, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export const getTasks = async (tripId: string, userId: string) => {
  const tripFound = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      tasks: true,
      partecipants: true,
    },
  });

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'User not partecipant of this trip',
    });
  }

  return tripFound.tasks;
};

export const createTask = async (
  tripId: string,
  userId: string,
  task: CreateTaskSchemaType,
): Promise<InferSelectModel<typeof tasks>> => {
  const tripFound = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      partecipants: true,
    },
  });

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'User not partecipant of this trip',
    });
  }

  const taskToCreate: InferInsertModel<typeof tasks> = {
    ...task,
    trip_id: tripId,
  };

  const newTask = await db.insert(tasks).values(taskToCreate).returning();

  return newTask[0];
};

export const putTask = async (
  tripId: string,
  userId: string,
  taskId: string,
  task: UpdateTaskSchemaType,
) => {
  const tripFound = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      partecipants: true,
      tasks: true,
    },
  });

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'User not partecipant of this trip',
    });
  }

  const taskFound = tripFound.tasks.find((x) => x.id === taskId);

  if (!taskFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'task not found',
    });
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
};

export const deleteTask = async (
  tripId: string,
  userId: string,
  taskId: string,
) => {
  const tripFound = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      partecipants: true,
      tasks: true,
    },
  });

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  if (!tripFound.partecipants.some((x) => x.user_id === userId)) {
    throw new HTTPException(HttpStatus.FORBIDDEN, {
      message: 'User not partecipant of this trip',
    });
  }

  const taskFound = tripFound.tasks.find((x) => x.id === taskId);

  if (!taskFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'task not found',
    });
  }

  const deletedTask = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.trip_id, tripId)))
    .returning();

  return deletedTask;
};
