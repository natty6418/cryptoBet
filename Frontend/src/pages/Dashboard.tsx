// src/components/Dashboard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ChevronRight, Award, Clock } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useEvents } from '../contexts/EventsContext';
import type { Bet } from '../types';

const Dashboard: React.FC = () => {
  const { isConnected, address, connect } = useWallet();
  const { userBets, claimReward } = useEvents();

  // Enforce our Bet type
  const bets = userBets as Bet[];

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Active = events not yet completed
  const activeBets = bets.filter(b => b.event?.status !== 'completed');
  // History = events completed
  const historyBets = bets.filter(b => b.event?.status === 'completed');

  const displayBets = activeTab === 'active' ? activeBets : historyBets;

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Wallet className="mx-auto text-indigo-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">
            Connect your Ethereum wallet to see your bets, claims, and rewards.
          </p>
          <button onClick={connect} className="btn btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Helper to format address
  const shortAddr = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : '';

  // Totals for the cards
  const totalWinnings = bets.reduce((sum, b) => {
    const won = b.event?.winningOutcome === b.outcomeId;
    return sum + (won ? b.amount * 2 : 0); // replace 2× with your actual payout logic
  }, 0);

  const totalWinningBets = bets.filter(b =>
    b.event?.status === 'completed' && b.event?.winningOutcome === b.outcomeId
  ).length;

  const totalActiveValue = activeBets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Your Dashboard</h1>
        <p className="text-slate-400">Track your bets, claims, and rewards.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Wallet */}
        <div className="card flex flex-col">
          <Wallet className="text-indigo-500 mb-3" size={24} />
          <h3 className="text-lg font-semibold mb-1">Connected Wallet</h3>
          <p className="text-slate-400 text-sm mb-2">{shortAddr}</p>
          <div className="mt-auto pt-2">
            <button className="text-indigo-400 text-sm hover:text-indigo-300">
              View on Etherscan <ChevronRight size={14} className="inline" />
            </button>
          </div>
        </div>

        {/* Total Winnings */}
        <div className="card flex flex-col">
          <Award className="text-emerald-500 mb-3" size={24} />
          <h3 className="text-lg font-semibold mb-1">Total Winnings</h3>
          <p className="text-emerald-400 font-semibold text-xl mb-2">
            {totalWinnings.toFixed(4)} ETH
          </p>
          <div className="mt-auto pt-2">
            <span className="text-slate-400 text-sm">
              {totalWinningBets} winning bets
            </span>
          </div>
        </div>

        {/* Active Bets */}
        <div className="card flex flex-col">
          <Clock className="text-amber-500 mb-3" size={24} />
          <h3 className="text-lg font-semibold mb-1">Active Bets</h3>
          <p className="text-amber-400 font-semibold text-xl mb-2">
            {activeBets.length}
          </p>
          <div className="mt-auto pt-2">
            <span className="text-slate-400 text-sm">
              Total value: {totalActiveValue.toFixed(4)} ETH
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-xl overflow-hidden mb-6">
        <div className="flex border-b border-slate-700">
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'active'
                ? 'text-white bg-slate-700 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active Bets
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'history'
                ? 'text-white bg-slate-700 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Betting History
          </button>
        </div>

        {/* Bets Table */}
        <div className="p-6">
          {displayBets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400">
                {activeTab === 'active'
                  ? 'You have no active bets.'
                  : 'Your betting history is empty.'}
              </p>
              <Link to="/" className="btn btn-primary mt-4 inline-block">
                Browse Markets
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-3 text-slate-400 font-medium">Event</th>
                    <th className="pb-3 text-slate-400 font-medium">Prediction</th>
                    <th className="pb-3 text-slate-400 font-medium">Amount</th>
                    <th className="pb-3 text-slate-400 font-medium">
                      {activeTab === 'active' ? 'Potential Reward' : 'Result'}
                    </th>
                    <th className="pb-3 text-slate-400 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayBets.map(bet => {
                    const won = bet.event?.winningOutcome === bet.outcomeId;
                    const potentialReward = bet.amount * 2; // replace with real calc
                    const winnings = won ? potentialReward : 0;

                    return (
                      <tr
                        key={bet.id}
                        className="border-b border-slate-700 last:border-b-0"
                      >
                        <td className="py-4">
                          <Link
                            to={`/event/${bet.eventId}`}
                            className="text-white hover:text-indigo-400"
                          >
                            {bet.event?.title}
                          </Link>
                          <div className="text-sm text-slate-400">
                            {bet.event?.date
                              ? new Date(bet.event.date).toLocaleString()
                              : '-'}
                          </div>
                        </td>
                        <td className="py-4">
                          {bet.outcome?.name || 'Unknown Outcome'}
                        </td>
                        <td className="py-4">{bet.amount.toFixed(4)} ETH</td>
                        <td className="py-4">
                          {activeTab === 'active' ? (
                            <span className="text-emerald-400">
                              {potentialReward.toFixed(4)} ETH
                            </span>
                          ) : (
                            <span
                              className={
                                won ? 'text-emerald-400' : 'text-red-400'
                              }
                            >
                              {won
                                ? `+${winnings.toFixed(4)} ETH`
                                : `-${bet.amount.toFixed(4)} ETH`}
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          {bet.event?.status === 'completed' &&
                            won &&
                            !bet.claimed && (
                              <button
                                onClick={() => claimReward(bet.id)}
                                className="btn btn-secondary py-1 px-4"
                              >
                                Claim
                              </button>
                            )}
                          {bet.event?.status === 'completed' &&
                            bet.claimed && (
                              <span className="text-sm text-slate-400">
                                Claimed
                              </span>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
