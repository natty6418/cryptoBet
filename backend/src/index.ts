import express from 'express';
import eventRoutes from './routes/events';
import betRoutes from './routes/bets';
import * as dotenv from 'dotenv';
import cors from 'cors';
// import { startEventListener } from './listner';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ['http://localhost:5173', 'https://crypto-bet-zeta.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Correct usage here!
app.use('/events', eventRoutes);
app.use('/bets', betRoutes);

// startEventListener();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
