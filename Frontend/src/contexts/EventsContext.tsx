import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Event, Bet } from '../types';
import { mockEvents, mockUserBets } from '../data/mockData';

interface EventsContextType {
  events: Event[];
  userBets: Bet[];
  placeBet: (eventId: string, outcomeIndex: number, amount: number) => void;
  claimReward: (betId: string) => void;
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
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [userBets, setUserBets] = useState<Bet[]>(mockUserBets);
  
  // In a real app, this would call a smart contract function
  const placeBet = (eventId: string, outcomeIndex: number, amount: number) => {
    setEvents(prevEvents => {
      return prevEvents.map(event => {
        if (event.id === eventId) {
          const updatedOutcomes = [...event.outcomes];
          updatedOutcomes[outcomeIndex] = {
            ...updatedOutcomes[outcomeIndex],
            amount: updatedOutcomes[outcomeIndex].amount + amount,
          };
          
          // Recalculate percentages
          const totalAmount = updatedOutcomes.reduce((sum, outcome) => sum + outcome.amount, 0);
          updatedOutcomes.forEach(outcome => {
            outcome.percentage = totalAmount > 0 
              ? Math.round((outcome.amount / totalAmount) * 100) 
              : 0;
          });
          
          return {
            ...event,
            pool: event.pool + amount,
            totalBets: event.totalBets + 1,
            outcomes: updatedOutcomes,
          };
        }
        return event;
      });
    });
    
    // Add to user bets
    const event = events.find(e => e.id === eventId);
    if (event) {
      const newBet: Bet = {
        id: `bet-${Date.now()}`,
        eventId,
        eventName: event.title,
        eventDate: event.date || new Date().toISOString(),
        outcome: event.outcomes[outcomeIndex].name,
        amount,
        odds: event.outcomes[outcomeIndex].odds,
        status: event.status,
        won: false,
        claimed: false,
        winnings: 0,
      };
      
      setUserBets(prevBets => [...prevBets, newBet]);
    }
  };
  
  // In a real app, this would call a smart contract function
  const claimReward = (betId: string) => {
    setUserBets(prevBets => {
      return prevBets.map(bet => {
        if (bet.id === betId) {
          return {
            ...bet,
            claimed: true,
          };
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
  };
  
  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};