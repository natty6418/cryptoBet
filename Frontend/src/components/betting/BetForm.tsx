import React, { useState, useEffect } from 'react';
import { Outcome } from '../../types';

interface BetFormProps {
  selectedOutcome: Outcome;
  onSubmit: (amount: number) => void;
}

const BetForm: React.FC<BetFormProps> = ({ selectedOutcome, onSubmit }) => {
  const [amount, setAmount] = useState<string>('0.1');
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);
  
  useEffect(() => {
    const betAmount = parseFloat(amount) || 0;
    setPotentialWinnings(betAmount * selectedOutcome.odds);
  }, [amount, selectedOutcome]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const betAmount = parseFloat(amount);
    if (betAmount > 0) {
      onSubmit(betAmount);
    }
  };

  const quickAmounts = [0.01, 0.05, 0.1, 0.5, 1];
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-2">
          Bet amount (ETH)
        </label>
        <input
          type="number"
          className="input w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.001"
          step="0.001"
        />
        
        <div className="flex flex-wrap gap-2 mt-2">
          {quickAmounts.map((quickAmount) => (
            <button
              type="button"
              key={quickAmount}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-sm"
              onClick={() => setAmount(quickAmount.toString())}
            >
              {quickAmount} ETH
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">Your bet</span>
          <span className="font-medium">{amount} ETH</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">Outcome</span>
          <span className="font-medium">{selectedOutcome.name}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">Odds</span>
          <span className="font-medium">x{selectedOutcome.odds.toFixed(2)}</span>
        </div>
        <div className="border-t border-slate-700 my-2 pt-2"></div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Potential winnings</span>
          <span className="font-medium text-emerald-400">
            {potentialWinnings.toFixed(4)} ETH
          </span>
        </div>
      </div>
      
      <button 
        type="submit" 
        className="btn btn-secondary w-full"
      >
        Place Bet
      </button>
      
      <div className="mt-4 text-xs text-slate-400 text-center">
        By placing this bet, you agree to our Terms of Service. 
        All bets are final and cannot be cancelled.
      </div>
    </form>
  );
};

export default BetForm;