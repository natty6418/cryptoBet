import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useEvents } from '../contexts/EventsContext';
import { Link } from 'react-router-dom';
import { Wallet, ChevronRight, Award, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { isConnected, address, connect } = useWallet();
  const { userBets, claimReward } = useEvents();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  const activeBets = userBets.filter(bet => bet.status !== 'completed');
  const historyBets = userBets.filter(bet => bet.status === 'completed');
  
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
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Your Dashboard</h1>
        <p className="text-slate-400">
          Track your bets, claims, and rewards.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <Wallet className="text-indigo-500 mb-3" size={24} />
          <h3 className="text-lg font-semibold mb-1">Connected Wallet</h3>
          <p className="text-slate-400 text-sm mb-2">
            {`${address?.substring(0, 6)}...${address?.substring(address!.length - 4)}`}
          </p>
          <div className="mt-auto pt-2">
            <button className="text-indigo-400 text-sm hover:text-indigo-300">
              View on Etherscan <ChevronRight size={14} className="inline" />
            </button>
          </div>
        </div>
        
        <div className="card">
          <Award className="text-emerald-500 mb-3" size={24} />
          <h3 className="text-lg font-semibold mb-1">Total Winnings</h3>
          <p className="text-emerald-400 font-semibold text-xl mb-2">
            {userBets.reduce((total, bet) => {
              if (bet.status === 'completed' && bet.won) {
                return total + bet.winnings;
              }
              return total;
            }, 0).toFixed(4)} ETH
          </p>
          <div className="mt-auto pt-2">
            <span className="text-slate-400 text-sm">
              {userBets.filter(bet => bet.status === 'completed' && bet.won).length} winning bets
            </span>
          </div>
        </div>
        
        <div className="card">
          <Clock className="text-amber-500 mb-3" size={24} />
          <h3 className="text-lg font-semibold mb-1">Active Bets</h3>
          <p className="text-amber-400 font-semibold text-xl mb-2">
            {activeBets.length}
          </p>
          <div className="mt-auto pt-2">
            <span className="text-slate-400 text-sm">
              Total value: {activeBets.reduce((total, bet) => total + bet.amount, 0).toFixed(4)} ETH
            </span>
          </div>
        </div>
      </div>
      
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
                  {displayBets.map((bet, index) => (
                    <tr key={index} className="border-b border-slate-700 last:border-b-0">
                      <td className="py-4">
                        <Link to={`/event/${bet.eventId}`} className="text-white hover:text-indigo-400">
                          {bet.eventName}
                        </Link>
                        <div className="text-sm text-slate-400">{bet.eventDate}</div>
                      </td>
                      <td className="py-4">
                        {bet.outcome}
                      </td>
                      <td className="py-4">
                        {bet.amount} ETH
                      </td>
                      <td className="py-4">
                        {activeTab === 'active' ? (
                          <span className="text-emerald-400">
                            {(bet.amount * bet.odds).toFixed(4)} ETH
                          </span>
                        ) : (
                          <span 
                            className={bet.won ? 'text-emerald-400' : 'text-red-400'}
                          >
                            {bet.won 
                              ? `+${bet.winnings.toFixed(4)} ETH` 
                              : `-${bet.amount} ETH`}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {bet.status === 'completed' && bet.won && !bet.claimed && (
                          <button 
                            onClick={() => claimReward(bet.id)}
                            className="btn btn-secondary py-1 px-4"
                          >
                            Claim
                          </button>
                        )}
                        {bet.status === 'completed' && bet.claimed && (
                          <span className="text-sm text-slate-400">Claimed</span>
                        )}
                      </td>
                    </tr>
                  ))}
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