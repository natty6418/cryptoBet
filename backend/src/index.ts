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

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true              
  }));

// Correct usage here!
app.use('/events', eventRoutes);
app.use('/bets', betRoutes);

// startEventListener();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
