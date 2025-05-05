// src/startEventListener.ts
import { ethers } from 'ethers';
import axios from 'axios';
import BetChainABI from './contracts/BetChain.json'; // using resolveJsonModule
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const RPC_URL = process.env.RPC_URL!;

export const startEventListener = () => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, BetChainABI.abi, provider);

  console.log('[🔌] Listening for blockchain events...');

  contract.on('EventCreated', async (eventId, name, eventTime) => {
    console.log(`[📡] EventCreated: ${eventId} — ${name} @ ${eventTime}`);

    try {
      await axios.post(`http://localhost:${process.env.PORT || 3000}/events`, {
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
    } catch (err: any) {
      console.error(`[✖] Backend sync failed:`, err.message);
    }
  });
};
