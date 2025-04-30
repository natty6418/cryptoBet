import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '../contexts/EventsContext';
import { useWallet } from '../contexts/WalletContext';
import { ArrowLeft, Users, Clock, Trophy, AlertCircle } from 'lucide-react';
import BetForm from '../components/betting/BetForm';
import { useBetChain } from '../hooks/useBetChain';
import { ethers } from 'ethers';


const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, placeBet } = useEvents();
  const { isConnected } = useWallet();
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const contract = useBetChain();
  
  const event = events.find(e => e.id === id);
  
  if (!event) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-slate-400 mb-4">This event may have been removed or never existed.</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            Browse Markets
          </button>
        </div>
      </div>
    );
  }
  
  const handleSelectOutcome = (index: number) => {
    setSelectedOutcome(index);
  };
  
  const handlePlaceBet = async (amount: number) => {
    if (selectedOutcome === null || !contract) return;
  
    try {
      const tx = await contract.placeBet(parseInt(id!), selectedOutcome, {
        value: ethers.utils.parseEther(amount.toString()),
      });
      await tx.wait();

      placeBet(id!, selectedOutcome, amount);
      console.log('✅ Bet confirmed!');
    } catch (err) {
      console.error('❌ Bet failed:', err);
    }
  };
  
  
  
  return (
    <div>
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to Markets
      </button>
      
      <div className="bg-slate-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="flex items-center space-x-2 mb-3">
              {event.status === 'live' && (
                <span className="badge badge-live flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                  LIVE
                </span>
              )}
              {event.status === 'upcoming' && (
                <span className="badge badge-upcoming">
                  UPCOMING
                </span>
              )}
              {event.status === 'completed' && (
                <span className="badge badge-completed">
                  COMPLETED
                </span>
              )}
              <span className="text-slate-400 text-sm">{event.category}</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            <p className="text-slate-300 mb-6">{event.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-4 flex items-center">
                <Users className="text-indigo-400 mr-3" size={20} />
                <div>
                  <div className="text-sm text-slate-400">Total Bets</div>
                  <div className="font-medium">{event.totalBets}</div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4 flex items-center">
                <Trophy className="text-amber-400 mr-3" size={20} />
                <div>
                  <div className="text-sm text-slate-400">Pool Size</div>
                  <div className="font-medium">{event.pool} ETH</div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4 flex items-center">
                <Clock className="text-emerald-400 mr-3" size={20} />
                <div>
                  <div className="text-sm text-slate-400">
                    {event.status === 'completed' ? 'Ended' : 'Closes In'}
                  </div>
                  <div className="font-medium text-amber-400">
                    {event.status === 'completed' ? 'Final' : event.timeRemaining}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Market Details</h2>
              <p className="text-slate-300">
                {event.longDescription || 'No additional details available for this market.'}
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Outcome Distribution</h2>
              <div className="space-y-4">
                {event.outcomes.map((outcome, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{outcome.name}</span>
                      <span className="text-emerald-400">x{outcome.odds.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${outcome.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-slate-400">
                      <span>{outcome.percentage}%</span>
                      <span>{outcome.amount} ETH</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/3">
            {event.status === 'completed' ? (
              <div className="bg-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Event Completed</h2>
                <div className="mb-4">
                  <div className="text-sm text-slate-400 mb-1">Winning Outcome</div>
                  <div className="text-lg font-medium text-emerald-400">
                    {event.outcomes[event.winningOutcome || 0].name}
                  </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Total Pool</span>
                    <span className="font-medium">{event.pool} ETH</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Winning Bets</span>
                    <span className="font-medium">
                      {event.outcomes[event.winningOutcome || 0].amount} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Payout Multiplier</span>
                    <span className="font-medium text-emerald-400">
                      x{event.outcomes[event.winningOutcome || 0].odds.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <button className="btn btn-secondary w-full">
                  View Results
                </button>
              </div>
            ) : (
              <div className="bg-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Place Your Bet</h2>
                
                {!isConnected ? (
                  <div className="text-center p-4 bg-slate-800 rounded-lg mb-4">
                    <AlertCircle className="mx-auto text-amber-400 mb-2" size={24} />
                    <p className="text-slate-300 mb-4">Connect your wallet to place a bet</p>
                    <button className="btn btn-primary">
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm text-slate-300 mb-2">
                        Select an outcome
                      </label>
                      <div className="space-y-2">
                        {event.outcomes.map((outcome, index) => (
                          <div 
                            key={index}
                            className={`
                              border rounded-lg p-3 cursor-pointer transition-all
                              ${selectedOutcome === index 
                                ? 'border-emerald-500 bg-emerald-500/10' 
                                : 'border-slate-600 hover:border-slate-500'}
                            `}
                            onClick={() => handleSelectOutcome(index)}
                          >
                            <div className="flex justify-between items-center">
                              <span>{outcome.name}</span>
                              <span className="text-emerald-400">x{outcome.odds.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {selectedOutcome !== null && (
                      <BetForm 
                        selectedOutcome={event.outcomes[selectedOutcome]} 
                        onSubmit={handlePlaceBet}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;