export interface Outcome {
  name: string;
  odds: number;
  percentage: number;
  amount: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: string;
  status: 'live' | 'upcoming' | 'completed';
  date?: string;
  pool: number;
  totalBets: number;
  timeRemaining: string;
  outcomes: Outcome[];
  winningOutcome?: number;
}

export interface Bet {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  outcome: string;
  amount: number;
  odds: number;
  status: 'live' | 'upcoming' | 'completed';
  won: boolean;
  claimed: boolean;
  winnings: number;
}

export interface Category {
  id: string;
  name: string;
}