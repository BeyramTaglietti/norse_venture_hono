import { HttpStatus } from '@/config/errors';
import type { TaskModel } from '@/models';
import {
  createTask_db,
  deleteTask_db,
  findTripByPartecipant_db,
  findTripTasks_db,
  updateTask_db,
} from '@/repositories';
import type { CreateTaskSchemaType, UpdateTaskSchemaType } from '@/validators';
import { HTTPException } from 'hono/http-exception';

export const getTasks = async (
  tripId: string,
  userId: string,
): Promise<TaskModel[]> => {
  const tripFound = await findTripByPartecipant_db(tripId, userId);

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  const tasksFound = await findTripTasks_db(tripId);

  return tasksFound;
};

export const createTask = async (
  tripId: string,
  userId: string,
  task: CreateTaskSchemaType,
): Promise<TaskModel> => {
  const tripFound = await findTripByPartecipant_db(tripId, userId);

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  const taskToCreate = {
    ...task,
    trip_id: tripId,
  };

  try {
    const newTask = await createTask_db(taskToCreate);

    return newTask;
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Task not created',
    });
  }
};

export const putTask = async (
  tripId: string,
  userId: string,
  taskId: string,
  task: UpdateTaskSchemaType,
): Promise<TaskModel> => {
  const tripFound = await findTripByPartecipant_db(tripId, userId);

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  const taskToUpdate = {
    ...task,
    trip_id: tripId,
  };

  try {
    const updatedTask = await updateTask_db(taskId, tripId, taskToUpdate);

    return updatedTask;
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Task not updated',
    });
  }
};

export const deleteTask = async (
  tripId: string,
  userId: string,
  taskId: string,
): Promise<TaskModel> => {
  const tripFound = await findTripByPartecipant_db(tripId, userId);

  if (!tripFound) {
    throw new HTTPException(HttpStatus.NOT_FOUND, {
      message: 'Trip not found',
    });
  }

  try {
    const deletedTask = await deleteTask_db(taskId, tripId);

    return deletedTask;
  } catch {
    throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Task not deleted',
    });
  }
};
