import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Event, Bet } from '../types';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import { useBetChain } from '../hooks/useBetChain';
import { getAllEvents } from '../api/eventService';
import { TxError, toTxError } from '../types';
import { getUserBets } from '../api/betServices';
import { placeBet as placeBetOnDb } from '../api/betServices';
import { claimReward as claimRewardDb } from '../api/betServices';
// import { mockEvents, mockUserBets } from '../data/mockData';

interface EventsContextType {
  events: Event[];
  userBets: Bet[];
  placeBet: (eventId: string, amountStr: string, optionStr: string, optionIdx: number) => void;
  claimReward: (betId: string) => void;
  loadingEvents: boolean;
  netErr: string | null;
  loadingUserBets: boolean;
  placingBet: boolean;
  betError: { [key: string]: string | null };
  claimError?: { [key: string]: string | null };
  claimSuccess?: { [key: string]: string | null };
  claimingEventId?: string | null;
  isClaiming?: boolean;
}



const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};

interface EventsProviderProps {
  children: ReactNode;
}

export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingUserBets, setLoadingUserBets] = useState(false);
  const [netErr, setNetErr] = useState<string | null>(null);
  const [placingBet, setPlacingBet] = useState<boolean>(false);
  const [betError, setBetError] = useState<{ [key: string]: string | null }>({});
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<{ [key: string]: string | null }>({});
  const [claimSuccess, setClaimSuccess] = useState<{ [key: string]: string | null }>({});
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const { isConnected, address } = useWallet();
  const contract = useBetChain();
  const provider = contract?.provider;

  const loadUserBets = async (userAddress: string) => {
    if (!contract || !userAddress) return;
  
    setLoadingUserBets(true);
  
    try {
      const bets = await getUserBets(userAddress);
      setUserBets(bets);
    } catch (error) {
      console.error("Error loading user bets:", error);
    } finally {
      setLoadingUserBets(false);
    }
  };
  
  // In a real app, this would call a smart contract function
  const loadEvents = async () => {
    if (!contract) return;
    if (!isConnected) {
      setNetErr("Wallet not connected.");
      setEvents([]);
      return;
    }
  
    setLoadingEvents(true);
    setNetErr(null);
  
    try {
      const code = await contract.provider.getCode(contract.address);
      if (code === "0x") {
        setNetErr(
          "No contract found at this address on the selected network. Please ensure you are on the correct network."
        );
        setEvents([]);
        return;
      }
  
      const backendEvents = await getAllEvents();
      // console.log("Backend events:", backendEvents);
      const backendMap = Object.fromEntries(
        backendEvents.map((e) => [e.eventId, e])
      );
      const nowSec = Math.floor(Date.now() / 1000);
      const computeStatus = (closed: boolean, startSec: number):
        "completed" | "live" | "upcoming" =>
        closed ? "completed" : nowSec >= startSec ? "live" : "upcoming";
  
      const ids: ethers.BigNumber[] = await contract.getAllEventIds();
      const mergedEvents = await Promise.all(
        ids.map(async (idBN: ethers.BigNumber) => {
          const id = idBN.toString();
          // console.log("Event ID:", id);
          const chainData = await contract.events(idBN);
          const isClosed = chainData.isClosed;
          const winningOption = isClosed
            ? ethers.BigNumber.from(chainData.winningOption).toNumber()
            : undefined;
  
          const backend = backendMap[id];
          // console.log("Backend data:", backend);
          const eventTimeSec = ethers.BigNumber.from(chainData.eventTime).toNumber();
          const pool = ethers.BigNumber.from(chainData.totalPool).toString();
          return {
            id,
            eventId: parseInt(id, 10),
            name: chainData.name,
            eventTime: eventTimeSec,
            isClosed,
            pool: parseFloat(ethers.utils.formatEther(pool)),
            winningOutcome: winningOption ? backend?.outcomes[winningOption]?.id : undefined,
            title: backend?.title || chainData.name,
            description: backend?.description || "",
            longDescription: backend?.longDescription,
            category: backend?.category || "",
            status: computeStatus(isClosed, eventTimeSec),
            date:  backend?.date || chainData.eventTime,
            outcomes: backend?.outcomes || [],
            totalBets: backend?.totalBets || 0,
          };
        })
      );
  
      mergedEvents.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      // console.log("Merged Events:", mergedEvents);
      
      setEvents(mergedEvents);
      
    } catch (err: unknown) {
      console.log("Error loading events:", err);
      const error: TxError = toTxError(err);
      const message =
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("failed to detect network")
          ? "Network error. Please check your connection and selected network in MetaMask."
          : `Failed to load events. ${
              error.reason || error.message || "Unknown error"
            }`;
      setNetErr(message);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  
  
  


  useEffect(() => {
    if (contract && isConnected) {
      loadEvents();
      loadUserBets(address!);
    } else {
      setEvents([]);
    }
  }, [contract, isConnected]);


  const placeBet = async (eventId: string, amountStr: string, optionStr: string, optionIdx: number ) => {
    if (!contract || !address) return alert("Please connect your wallet first.");
    
  
    if (!amountStr || !optionStr)
      return alert("Please enter both bet amount and select an option.");
  
    let amountInWei: ethers.BigNumber;
    let amount: number;
  
    try {
      amountInWei = ethers.utils.parseEther(amountStr);
      if (amountInWei.lte(0)) throw new Error("Amount must be positive.");
      amount = parseFloat(amountStr);
    } catch (e) {
      return alert(
        `Invalid bet amount: ${
          e instanceof Error ? e.message : "Please enter a valid number in ETH."
        }`
      );
    }
  
    const option = optionIdx;
    if (isNaN(option) || option < 0) {
      return alert("Invalid option selected. Please enter a valid option index.");
    }
  
    if (provider) {
      try {
        const balance = await provider.getBalance(address);
        if (balance.lt(amountInWei)) {
          return alert(`Insufficient balance. You need ${amountStr} ETH to place this bet.`);
        }
      } catch (balanceError) {
        console.warn("Could not check balance:", balanceError);
      }
    }
  
    setPlacingBet(true);
    setBetError((prev) => ({ ...prev, [eventId]: null }));
  
    try {
      const eventIdBN = ethers.BigNumber.from(eventId);
      const tx = await contract.placeBet(eventIdBN, option, { value: amountInWei });
      console.log(`Place bet transaction sent for event ${eventId}:`, tx.hash);
  
      alert(`Transaction sent (${tx.hash}). Waiting for confirmation...`);
      await tx.wait();
      console.log(`Transaction confirmed for event ${eventId}.`);
  
      // Local frontend state update (simulates backend write)
      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.id === eventId) {
            const updatedOutcomes = [...event.outcomes];
            updatedOutcomes[option] = {
              ...updatedOutcomes[option],
              amount: updatedOutcomes[option].amount + amount,
            };
            return {
              ...event,
              pool: event.pool + amount,
              totalBets: event.totalBets + 1,
              outcomes: updatedOutcomes,
            };
          }
          return event;
        })
      );
  
      const event = events.find((e) => e.id === eventId);
      if (event) {
        const newBet: Bet = {
          id: 1234,
          eventId,
          amount,
          claimed: false,
          user: address!,
          outcomeId: event.outcomes[option].id,
          outcome: event.outcomes[option],
          createdAt: new Date().toISOString(),
          event: event,
        };
  
        const bet = await placeBetOnDb(newBet);
        setUserBets((prevBets) => [...prevBets, bet]);
      }
  
      // Reset input fields
      
      // Optional: reload events or user bets from source of truth
      await loadEvents(); // includes userBets if hooked
  
      alert(`Bet successfully placed on event #${eventId}!`);
    } catch (err: unknown) {
      const error = err as Error & {
        reason?: string;
        code?: string;
        data?: { message?: string };
      };
      console.error(`Error placing bet on event ${eventId}:`, error);
  
      let message = `Failed to place bet: `;
      if (error.code === "4001") {
        message = "Transaction rejected by user.";
      } else if (error.reason) {
        message += error.reason;
      } else if (error.data?.message) {
        message += error.data.message.replace("execution reverted: ", "");
      } else if (error.message) {
        message += error.message;
      } else {
        message += "Unknown error.";
      }
  
      setBetError((prev) => ({ ...prev, [eventId]: message }));
    } finally {
      setPlacingBet(false);
    }
  };
  

  // Claim Reward Handler
const handleClaimReward = async (eventId: string) => {
  if (!contract || !address) return alert('Please connect your wallet first.');

 
  setIsClaiming(true);
  setClaimingEventId(eventId);
  setClaimError(prev => ({ ...prev, [eventId]: null }));
  setClaimSuccess(prev => ({ ...prev, [eventId]: null }));

  try {
    const eventIdBN = ethers.BigNumber.from(eventId);
    const tx = await contract.claimReward(eventIdBN);
    console.log(`Claim reward transaction sent for event ${eventId}:`, tx.hash);
    alert(`Transaction sent (${tx.hash}). Waiting for confirmation...`);

    await tx.wait();
    console.log(`Claim reward transaction confirmed for event ${eventId}.`);

    // Refresh this specific bet to update claimed status
    await loadUserBets(address);

    setClaimSuccess(prev => ({ ...prev, [eventId]: 'Reward claimed successfully!' }));
  } catch (err: unknown) {
    const error = err as Error & { reason?: string; code?: string; data?: { message?: string } };
    console.error(`Error claiming reward for event ${eventId}:`, error);

    let message = 'Failed to claim reward: ';
    if (error.code === '4001') {
      message = 'Transaction rejected by user.';
    } else if (error.reason) {
      message += error.reason;
    } else if (error.data?.message) {
      message += error.data.message.replace('execution reverted: ', '');
    } else if (error.message) {
      message += error.message;
    } else {
      message += 'Unknown error.';
    }

    setClaimError(prev => ({ ...prev, [eventId]: message }));
  } finally {
    setClaimingEventId(null);
  }
};

  
  // In a real app, this would call a smart contract function
  const claimReward = async (eventId: string) => {

    const bet = userBets.find(b => b.eventId.toString() === eventId);
    if (!bet) return alert("No bet found for this event.");

    await handleClaimReward(eventId);
    await claimRewardDb(bet.id);
    setUserBets(prevBets => {
      return prevBets.map(bet => {
        if (bet.eventId.toString() === eventId) {
          return { ...bet, claimed: true };
        }
        return bet;
      });
    });
  };
  
  const value = {
    events,
    userBets,
    placeBet,
    claimReward,
    loadingEvents,
    netErr,
    loadingUserBets,
    placingBet,
    betError,
    claimError,
    claimSuccess,
    claimingEventId,
    isClaiming,
  };
  
  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};