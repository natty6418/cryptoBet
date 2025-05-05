// src/components/BetForm.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import type { Bet, Event } from '../../types';

interface BetFormProps {
  event: Event;
  selectedOutcomeId: string;
  onSubmit: (bet: Bet) => void;
  placingBet?: boolean;
  alreadyBet?: boolean;
}

const BetForm: React.FC<BetFormProps> = ({
  event,
  selectedOutcomeId,
  onSubmit,
  placingBet,
  alreadyBet,
}) => {
  const { address } = useWallet();
  const selectedOutcome = event.outcomes.find(
    outcome => outcome.id === selectedOutcomeId
  );

  const [amount, setAmount] = useState<string>('0.1');
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);

  // Compute odds from event + outcome
  const odds =
    selectedOutcome?.amount && selectedOutcome.amount > 0 ? event.pool / selectedOutcome.amount : 0;

  // Recompute potential winnings whenever amount or odds change
  useEffect(() => {
    const betAmt = parseFloat(amount) || 0;
    setPotentialWinnings(betAmt * odds);
  }, [amount, odds]);

  const quickAmounts = [0.01, 0.05, 0.1, 0.5, 1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const betAmt = parseFloat(amount);

    if (!address) {
      alert('Wallet not connected');
      return;
    }
    if (betAmt <= 0) {
      alert('Enter an amount > 0');
      return;
    }

    const newBet: Bet = {
      id: 1234,
      user: address,
      eventId: event.id,
      outcomeId: selectedOutcomeId,
      outcome: selectedOutcome,
      amount: betAmt,
      claimed: false,
      createdAt: new Date().toISOString(),
    };

    onSubmit(newBet);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Amount input */}
      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-2">
          Bet amount (sETH)
        </label>
        <input
          type="number"
          className="input w-full"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min="0.001"
          step="0.001"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {quickAmounts.map(q => (
            <button
              key={q}
              type="button"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-sm"
              onClick={() => setAmount(q.toString())}
            >
              {q} sETH
            </button>
          ))}
        </div>
      </div>

      {/* Summary box */}
      {selectedOutcome && (
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">Your bet</span>
          <span className="font-medium">{amount} sETH</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">Outcome</span>
          <span className="font-medium">{selectedOutcome.name}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">Odds</span>
          <span className="font-medium">x{odds.toFixed(2)}</span>
        </div>
        <div className="border-t border-slate-700 my-2 pt-2" />
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Potential winnings</span>
          <span className="font-medium text-emerald-400">
            {potentialWinnings.toFixed(4)} sETH
          </span>
        </div>
      </div>)
}
      {/* Submit */}
      {alreadyBet? 
      <button
      disabled
      type="button"
      className="btn btn-secondary w-full opacity-50 cursor-not-allowed"
    >
      Already Bet
    </button>
    : placingBet ?
      <button
        disabled
        type="button"
        className="btn btn-secondary w-full opacity-50 cursor-not-allowed"
      >
        Placing Bet...
      </button>
      :
      
      <button disabled={event.status !== 'upcoming'} type="submit" className="btn btn-secondary w-full">
        Place Bet
      </button>}

      {/* Terms */}
      <div className="mt-4 text-xs text-slate-400 text-center">
        By placing this bet, you agree to our Terms of Service. <br />
        All bets are final and cannot be cancelled.
      </div>
    </form>
  );
};

export default BetForm;
