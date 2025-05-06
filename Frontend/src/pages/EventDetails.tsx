import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "../contexts/EventsContext";
import { useWallet } from "../contexts/WalletContext";
import { ArrowLeft, Users, Clock, Trophy, AlertCircle } from "lucide-react";
import BetForm from "../components/betting/BetForm";
// import { useBetChain } from '../hooks/useBetChain';
// import { ethers } from 'ethers';
import { Bet } from "../types";
// import { ethers } from 'ethers';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, placeBet, placingBet, userBets, claimReward, isClaiming } =
    useEvents();
  const { isConnected } = useWallet();

  if (!isConnected) {
    navigate("/"); // Redirect to home if not connected
  }

  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<
    number | null
  >(null);
  const [closesIn, setClosesIn] = useState<string | null>(null);

  const event = events.find((e) => e.id === id)!;
  const userBet = userBets.find((b) => b.eventId.toString() === id);
  const winningOutcome = event?.outcomes.find(
    (o) => o.id === event.winningOutcome
  );
  const alreadyBet = Boolean(userBet);
  // Did the user pick the winning outcome?
  const didWin = Boolean(
    userBet && winningOutcome && userBet.outcomeId === winningOutcome.id
  );
  // Has the user already claimed?
  const hasClaimed = Boolean(userBet?.claimed);

  // Calculate payout after 2% fee
  let payout: number | null = null;
  if (didWin && userBet && winningOutcome) {
    const netPool = event.pool * 0.98;
    payout = (userBet.amount / winningOutcome.amount) * netPool;
  }

  useEffect(() => {
    if (userBet) {
      setSelectedOutcome(userBet.outcomeId);
      const index = event.outcomes.findIndex((o) => o.id === userBet.outcomeId);
      setSelectedOutcomeIndex(index);
    } else {
      setSelectedOutcome(null);
      setSelectedOutcomeIndex(null);
    }
  }, [userBet, event?.outcomes]);

  // Countdown (for upcoming events)
  useEffect(() => {
    if (!event?.date || event.status !== "upcoming") return;

    let targetTime: Date;
    if (typeof event.date === "string") {
      targetTime = new Date(event.date);
    } else {
      targetTime = new Date(Number(event.date) * 1000);
    }

    if (isNaN(targetTime.getTime())) {
      console.error("❌ Invalid event date:", event.date);
      return;
    }

    const updateCountdown = () => {
      const diff = targetTime.getTime() - Date.now();
      const hrs = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setClosesIn(diff > 0 ? `${hrs}h ${mins}m` : "Closed");
    };

    updateCountdown(); // immediate update
    const iv = setInterval(updateCountdown, 60000);

    return () => {
      clearInterval(iv);
    };
  }, [event?.date, event?.status]);

  if (!event) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-slate-400 mb-4">
            This event may have been removed or never existed.
          </p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Browse Markets
          </button>
        </div>
      </div>
    );
  }

  const handleSelectOutcome = (id: string, index: number) => {
    setSelectedOutcome(id);
    setSelectedOutcomeIndex(index);
  };

  const handlePlaceBet = async (bet: Bet) => {
    console.log("Placing bet:", bet);
    if (!isConnected) {
      alert("Please connect your wallet to place a bet.");
      return;
    }
    try {
      const optionIdx = event.outcomes.findIndex((o) => o.id === bet.outcomeId);
      placeBet(
        bet.eventId,
        bet.amount.toString(),
        bet.outcomeId.toString(),
        optionIdx
      );
    } catch (error) {
      console.error("Error placing bet:", error);
      alert("Failed to place bet. Please try again.");
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate("/")}
        className="flex items-center text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to Markets
      </button>

      <div className="bg-slate-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="flex items-center space-x-2 mb-3">
              {event.status === "live" && (
                <span className="badge badge-live flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                  LIVE
                </span>
              )}
              {event.status === "upcoming" && (
                <span className="badge badge-upcoming">UPCOMING</span>
              )}
              {event.status === "completed" && (
                <span className="badge badge-completed">COMPLETED</span>
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
                  <div className="font-medium">{event.pool} sETH</div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 flex items-center">
                <Clock className="text-emerald-400 mr-3" size={20} />
                <div>
                  <div className="text-sm text-slate-400">
                    {event.status === "completed" ? "Ended" : "Closes In"}
                  </div>
                  <div className="font-medium">{closesIn || "Closed"}</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Market Details</h2>
              <p className="text-slate-300">
                {event.longDescription ||
                  "No additional details available for this market."}
              </p>
            </div>
          </div>

          <div className="lg:w-1/3">
            {event.status === "completed" ? (
              <div className="bg-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Event Completed</h2>

                {/* Winning outcome */}
                <div className="mb-4">
                  <div className="text-sm text-slate-400 mb-1">
                    Winning Outcome
                  </div>
                  <div className="text-lg font-medium text-emerald-400">
                    {winningOutcome?.name}
                  </div>
                </div>

                {/* Pool & winning bets */}
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">Total Pool</span>
                    <span className="font-medium">{event.pool} sETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Winning Bets</span>
                    <span className="font-medium">
                      {winningOutcome?.amount} sETH
                    </span>
                  </div>
                </div>

                {/* User-specific outcome */}
                {userBet ? (
                  didWin ? (
                    <div className="mb-4 text-center">
                      {hasClaimed ? (
                        <p className="text-green-400 font-medium">
                          You claimed {payout?.toFixed(4)} sETH
                        </p>
                      ) : (
                        <>
                          <p className="text-green-400 font-medium mb-2">
                            You won {payout?.toFixed(4)} sETH!
                          </p>
                          <button
                            onClick={() =>
                              claimReward(event.eventId.toString())
                            }
                            className="btn btn-primary w-full"
                            disabled={isClaiming}
                          >
                            Claim Reward
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-400 font-medium text-center">
                      Sorry, you did not win.
                    </p>
                  )
                ) : null}
              </div>
            ) : event.status === "live" ? (
              <div className="bg-slate-700 rounded-xl p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">Event Live</h2>
                <p className="text-slate-300 mb-4">
                  This event is currently live. Betting is closed.
                </p>
              </div>
            ) : (
              <div className="bg-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Place Your Bet</h2>

                {!isConnected ? (
                  <div className="text-center p-4 bg-slate-800 rounded-lg mb-4">
                    <AlertCircle
                      className="mx-auto text-amber-400 mb-2"
                      size={24}
                    />
                    <p className="text-slate-300 mb-4">
                      Connect your wallet to place a bet
                    </p>
                    <button className="btn btn-primary">Connect Wallet</button>
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
                  ${
                    selectedOutcomeIndex === index
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }
                `}
                            onClick={() =>
                              !alreadyBet &&
                              handleSelectOutcome(outcome.id, index)
                            }
                          >
                            <div className="flex justify-between items-center">
                              <span>{outcome.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedOutcome !== null && (
                      <BetForm
                        selectedOutcomeId={selectedOutcome}
                        onSubmit={handlePlaceBet}
                        event={event}
                        placingBet={placingBet}
                        alreadyBet={alreadyBet}
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
