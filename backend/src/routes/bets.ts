import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /bets
 * Body: { user: string, eventId: number, outcomeId: number, amount: number }
 */
router.post('/', async (req: Request, res: Response) => {
  const { user, eventId, outcomeId, amount } = req.body;

  try {
    // Create bet log
    console.log('Placing bet:', { user, eventId, outcomeId, amount });
    const bets = await prisma.betLog.findMany({
      where: {
        user,
        eventId,
      },
    });
    if (bets.length > 0) {
      throw new Error('User has already placed a bet on this event');
    }
    const bet = await prisma.betLog.create({
      data: {
        user,
        eventId,
        outcomeId,
        amount,
      },
    });
    console.log('Bet placed:', bet);
    // const outcomes = await prisma.outcome.findUnique({
    //   where: { id: parseInt(outcomeId, 10) },
    //   include: {
    //     event: true,
    //   },
    // });
    // if (!outcomes) {
    //   throw new Error('Outcome not found');
    // }

    // Update outcome amount
    await prisma.outcome.update({
      where: { id: outcomeId },
      data: {
        amount: { increment: amount },
      },
    });

    // Update event pool and total bets
    await prisma.eventMetadata.update({
      where: { eventId },
      data: {
        pool: { increment: amount },
        totalBets: { increment: 1 },
      },
    });

    res.status(201).json(bet);
  } catch (err: any) {
    console.error('Error placing bet:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  try {
    const bets = await prisma.betLog.findMany({
      where: { user: userId },
      include: {
        event: {
          include: {
            outcomes: true,
          },
        },
      },
    });
    res.json(bets);
  } catch (err: any) {
    console.error('Error fetching user bets:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /bets/:eventId
 * Returns all bets for a specific event
 */

router.post('/:betId/claim', async (req: Request, res: Response) => {
  const betId = Number(req.params.betId);
  try {
    const bet = await prisma.betLog.update({
      where: { id: betId },
      data: {
        claimed: true,
      },
    });
    res.json({ message: 'Bet claimed successfully', bet });
  } catch (err: any) {
    console.error('Error claiming bet:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/:eventId', async (req: Request, res: Response) => {
  const eventId = Number(req.params.eventId);

  try {
    const bets = await prisma.betLog.findMany({
      where: { eventId },
      include: {
        event: true,
        outcome: true,
      },
    });

    res.json(bets);
  } catch (err: any) {
    console.error('Error fetching bets:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
