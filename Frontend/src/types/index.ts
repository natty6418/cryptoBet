export interface Outcome {
  id: string;           // unique ID for the outcome (can be hash or combination)
  name: string;         // e.g., "Team A", "Yes", "Candidate X"
  amount: number;       // total amount bet on this outcome (e.g., in ETH or USD)
  eventId?: number;    // ID of the event this outcome belongs to
}


export interface Event {
  id: string;                        // event ID (from contract, typically a uint)
  eventId: number;                  // event ID (from contract, typically a uint)
  title: string;                    // event name/title
  description: string;              // short description
  longDescription?: string;         // optional long-form description
  category: string;                 // e.g., "sports", "politics", etc.
  status: 'live' | 'upcoming' | 'completed';
  date: string;                    // ISO date string or undefined
  pool: number;                     // total pool size (in ETH or USD)
  totalBets: number;                // total number of individual bets placed
  outcomes: Outcome[];             // all possible outcomes for this event
  winningOutcome?: string;         // outcome index (e.g., 0, 1, 2) after closure
}




export interface Bet {
  id: number ;                        // unique bet ID (can be hash or combination)
  user: string;                     // user ID or wallet address
  eventId: string;                  // ID of the event this bet is for
  outcomeId: string;              // index of the selected outcome
  outcome?: Outcome;                 // name of the selected outcome
  amount: number;                  // amount wagered
  claimed?: boolean;                // whether the winnings were claimed
  createdAt?: string;            // timestamp of when the bet was placed
  event?: Event;                     // optional event details
}


export interface Category {
  id: string;
  name: string;
}
/**
 * Extra fields that ethers.js & MetaMask often put on errors.
 */
export interface TxError extends Error {
  /** Human-readable revert reason (ethers.js) */
  reason?: string;
  /** Error code like NETWORK_ERROR, ACTION_REJECTED … */
  code?: string;
  /** Nested data that sometimes carries the Solidity revert string */
  data?: { message?: string };
}
export function toTxError(err: unknown): TxError {
  return err as TxError;      // one central cast, not many scattered ones
}
