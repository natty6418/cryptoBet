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
exports.startEventListener = void 0;
// src/startEventListener.ts
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
const BetChain_json_1 = __importDefault(require("./contracts/BetChain.json")); // using resolveJsonModule
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const startEventListener = () => {
    const provider = new ethers_1.ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, BetChain_json_1.default.abi, provider);
    console.log('[🔌] Listening for blockchain events...');
    contract.on('EventCreated', (eventId, name, eventTime) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`[📡] EventCreated: ${eventId} — ${name} @ ${eventTime}`);
        try {
            yield axios_1.default.post(`http://localhost:${process.env.PORT || 3000}/events`, {
                eventId,
                title: name,
                description: 'Synced from chain',
                longDescription: '',
                category: 'Auto',
                status: 'upcoming',
                date: new Date(Number(eventTime) * 1000).toISOString(),
                outcomes: [], // no outcomes on-chain
            });
            console.log(`[✔] Synced event ${eventId} to backend`);
        }
        catch (err) {
            console.error(`[✖] Backend sync failed:`, err.message);
        }
    }));
};
exports.startEventListener = startEventListener;
