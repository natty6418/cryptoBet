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
// POST / - Create a new event with outcomes
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, title, description, longDescription, category, status, date, outcomes, } = req.body;
    try {
        const event = yield prisma.eventMetadata.create({
            data: {
                eventId: parseInt(String(id), 10), // Ensure id is treated as an integer
                title,
                description,
                longDescription: longDescription !== null && longDescription !== void 0 ? longDescription : '',
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
    }
    catch (err) {
        console.log(err.message);
        res.status(400).json({ error: err.message });
    }
}));
// GET /category/:categoryId - Fetch all events for a specific category
router.get('/category/:categoryId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    try {
        const events = yield prisma.eventMetadata.findMany({
            where: { category: categoryId },
            include: { outcomes: true },
        });
        res.json(events);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
// GET /:eventId - Fetch one event and its outcomes
router.get('/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    try {
        const event = yield prisma.eventMetadata.findUnique({
            where: { eventId: Number(eventId) },
            include: { outcomes: true },
        });
        if (!event) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(event);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
router.post('/:eventId/resolve', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const { winningOutcome } = req.body;
    try {
        const event = yield prisma.eventMetadata.update({
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
    }
    catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    }
}));
// GET / - Fetch all events and their outcomes
router.get('/', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield prisma.eventMetadata.findMany({
            include: { outcomes: true },
        });
        res.json(events);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
router.delete('/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventIdNum = Number(req.params.eventId);
    try {
        // Transactionally delete Bets, Outcomes, then the Event
        const [betsDeleted, outcomesDeleted, eventDeleted] = yield prisma.$transaction([
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
    }
    catch (err) {
        if (err.code === 'P2025') {
            // Either no bets/outcomes to delete, or the event wasn't found
            res.status(404).json({ error: 'Event not found' });
        }
        else {
            res.status(500).json({ error: err.message });
        }
    }
}));
exports.default = router;
