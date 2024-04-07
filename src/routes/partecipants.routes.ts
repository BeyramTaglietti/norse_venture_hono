import { HttpStatus } from '@/config/errors';
import { addPartecipant, getPartecipants, removePartecipant } from '@/services';
import { Hono } from 'hono';

const partecipantsRouter = new Hono();

partecipantsRouter.get('/:trip_id/partecipants', async (c) => {
  const payload = c.get('jwtPayload');
  const tripId = c.req.param('trip_id');
  const partecipants = await getPartecipants(tripId, payload.sub);
  return c.json(partecipants);
});

partecipantsRouter.post('/:trip_id/partecipants/:partecipant_id', async (c) => {
  const payload = c.get('jwtPayload');
  const tripId = c.req.param('trip_id');
  const partecipantId = c.req.param('partecipant_id');
  const partecipant = await addPartecipant(tripId, payload.sub, partecipantId);
  return c.json(partecipant, HttpStatus.CREATED);
});

// eslint-disable-next-line drizzle/enforce-delete-with-where
partecipantsRouter.delete(
  '/:trip_id/partecipants/:partecipant_id',
  async (c) => {
    const payload = c.get('jwtPayload');
    const tripId = c.req.param('trip_id');
    const partecipantId = c.req.param('partecipant_id');
    const partecipant = await removePartecipant(
      tripId,
      payload.sub,
      partecipantId,
    );
    return c.json(partecipant);
  },
);

export { partecipantsRouter };
