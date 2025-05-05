"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
/**
 * POST /bets
 * Body: { user: string, eventId: number, outcomeId: number, amount: number }
 */
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, eventId, outcomeId, amount } = req.body;
    try {
        // Create bet log
        console.log('Placing bet:', { user, eventId, outcomeId, amount });
        const bets = yield prisma.betLog.findMany({
            where: {
                user,
                eventId,
            },
        });
        if (bets.length > 0) {
            throw new Error('User has already placed a bet on this event');
        }
        const bet = yield prisma.betLog.create({
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
        yield prisma.outcome.update({
            where: { id: outcomeId },
            data: {
                amount: { increment: amount },
            },
        });
        // Update event pool and total bets
        yield prisma.eventMetadata.update({
            where: { eventId },
            data: {
                pool: { increment: amount },
                totalBets: { increment: 1 },
            },
        });
        res.status(201).json(bet);
    }
    catch (err) {
        console.error('Error placing bet:', err);
        res.status(400).json({ error: err.message });
    }
}));
router.get('/user/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const bets = yield prisma.betLog.findMany({
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
    }
    catch (err) {
        console.error('Error fetching user bets:', err);
        res.status(500).json({ error: err.message });
    }
}));
/**
 * GET /bets/:eventId
 * Returns all bets for a specific event
 */
router.post('/:betId/claim', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const betId = Number(req.params.betId);
    try {
        const bet = yield prisma.betLog.update({
            where: { id: betId },
            data: {
                claimed: true,
            },
        });
        res.json({ message: 'Bet claimed successfully', bet });
    }
    catch (err) {
        console.error('Error claiming bet:', err);
        res.status(400).json({ error: err.message });
    }
}));
router.get('/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = Number(req.params.eventId);
    try {
        const bets = yield prisma.betLog.findMany({
            where: { eventId },
            include: {
                event: true,
                outcome: true,
            },
        });
        res.json(bets);
    }
    catch (err) {
        console.error('Error fetching bets:', err);
        res.status(500).json({ error: err.message });
    }
}));
exports.default = router;
