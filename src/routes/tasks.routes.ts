import { HttpStatus } from '@/config/errors';
import { createTask, deleteTask, getTasks, putTask } from '@/services';
import { createTaskSchema, updateTaskSchema } from '@/validators';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const tasksRouter = new Hono();

tasksRouter.get('/:trip_id/tasks', async (c) => {
  const payload = c.get('jwtPayload');
  const tripId = c.req.param('trip_id');
  const tasks = await getTasks(tripId, payload.sub);
  return c.json(tasks);
});

tasksRouter.post(
  '/:trip_id/tasks',
  zValidator('json', createTaskSchema),
  async (c) => {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const task = c.req.valid('json');
    const createdTask = await createTask(tripId, payload.sub, task);
    return c.json(createdTask, HttpStatus.CREATED);
  },
);

tasksRouter.put(
  '/:trip_id/tasks/:task_id',
  zValidator('json', updateTaskSchema),
  async (c) => {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const taskId = c.req.param('task_id');
    const task = c.req.valid('json');
    const updatedTask = await putTask(tripId, payload.sub, taskId, task);
    return c.json(updatedTask);
  },
);

// eslint-disable-next-line drizzle/enforce-delete-with-where
tasksRouter.delete('/:trip_id/tasks/:task_id', async (c) => {
  const payload = c.get('jwtPayload');
  const tripId = c.req.param('trip_id');
  const taskId = c.req.param('task_id');
  const deletedTask = deleteTask(tripId, payload.sub, taskId);
  return c.json(deletedTask);
});

export { tasksRouter };
