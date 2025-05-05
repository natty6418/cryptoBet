import express, { Request, Response } from 'express';
import { PrismaClient, Prisma, EventMetadata } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Type for the incoming request body when creating an event
type CreateEventBody = {
  id: number;
  title: string;
  description: string;
  longDescription?: string;
  category: string;
  status: 'live' | 'upcoming' | 'completed';
  date?: string;
  outcomes: {
    name: string;
    amount: number;
  }[];
};

// POST / - Create a new event with outcomes
router.post('/', async (req: Request<{}, {}, CreateEventBody>, res: Response): Promise<void> => {
  const {
    id,
    title,
    description,
    longDescription,
    category,
    status,
    date,
    outcomes,
  } = req.body;

  try {
    const event = await prisma.eventMetadata.create({
      data: {
      eventId: parseInt(String(id), 10), // Ensure id is treated as an integer
      title,
      description,
      longDescription: longDescription ?? '',
      category,
      status,
      date: date ? new Date(date) : undefined,
      pool: outcomes.reduce((acc, o) => acc + o.amount, 0),
      totalBets: 0,
      outcomes: {
        create: outcomes.map((outcome) => ({
          name: outcome.name,
          amount: outcome.amount,
        })),
      },
      },
      include: {
      outcomes: true,
      },
    });

    res.status(201).json(event);
  } catch (err: any) {
    console.log(err.message)
    res.status(400).json({ error: err.message });
  }
});

// GET /category/:categoryId - Fetch all events for a specific category
router.get('/category/:categoryId', async (req: Request<{ categoryId: string }>, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  try {
    const events = await prisma.eventMetadata.findMany({
      where: { category: categoryId },
      include: { outcomes: true },
    });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:eventId - Fetch one event and its outcomes
router.get('/:eventId', async (req: Request<{ eventId: string }>, res: Response): Promise<void> => {
  const { eventId } = req.params;

  try {
    const event = await prisma.eventMetadata.findUnique({
      where: { eventId: Number(eventId) },
      include: { outcomes: true },
    });

    if (!event) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:eventId/resolve', async (req: Request<{ eventId: string }>, res: Response): Promise<void> => {
  const { eventId } = req.params;
  const { winningOutcome } = req.body;
  try {
    const event = await prisma.eventMetadata.update({
      where: { eventId: Number(eventId) },
      data: {
        winningOutcome: winningOutcome,
        status: 'completed',
      },
      include: { outcomes: true },
    });
    if (!event) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(event);
  } catch (err: any) {
    console.log(err.message)
    res.status(500).json({ error: err.message });
  }
});

// GET / - Fetch all events and their outcomes
router.get('/', async (_: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.eventMetadata.findMany({
      include: { outcomes: true },
    });

    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(
  '/:eventId',
  async (
    req: Request<{ eventId: string }>,
    res: Response
  ): Promise<void> => {
    const eventIdNum = Number(req.params.eventId);

    try {
      // Transactionally delete Bets, Outcomes, then the Event
      const [betsDeleted, outcomesDeleted, eventDeleted] =
        await prisma.$transaction([
          prisma.betLog.deleteMany({ where: { eventId: eventIdNum } }),
          prisma.outcome.deleteMany({ where: { eventId: eventIdNum } }),
          prisma.eventMetadata.delete({
            where: { eventId: eventIdNum },
          }),
        ]);

      res.json({
        message: 'Event and all related data deleted.',
        deleted: {
          bets: betsDeleted.count,
          outcomes: outcomesDeleted.count,
          event: eventDeleted,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2025') {
        // Either no bets/outcomes to delete, or the event wasn't found
        res.status(404).json({ error: 'Event not found' });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  }
);


export default router;
