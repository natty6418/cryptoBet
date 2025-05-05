import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useBetChain } from '../hooks/useBetChain';
import { createEvent, resolveEvent, getAllEvents } from '../api/eventService';
import { Event } from '../types'; // Assuming Outcome type is defined in types

import { ethers } from 'ethers';
import { TrendingUp, AlertCircle, Lock, DollarSign, CheckCircle } from 'lucide-react';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, connect, address } = useWallet(); // Added signer for potential owner checks later
  const contract = useBetChain();

  // State for Create Event Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    longDescription: '',
    category: '',
    date: '',
    outcomes: [{ name: '', odds: 1 }] // Assuming odds are handled elsewhere or just for display info
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // State for Closing Events
  const [events, setEvents] = useState<Event[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closingEventId, setClosingEventId] = useState<string | null>(null);
  // Store selected winner index for each event: { eventId: winnerIndexString }
  const [selectedWinningOutcomes, setSelectedWinningOutcomes] = useState<{ [key: string]: string }>({});

  // State for Withdrawing Fees
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const allEvents = await getAllEvents();
        // Sort events, maybe newest first or by status
        allEvents.sort((a, b) => {
             if (a.status === 'completed' && b.status !== 'completed') return 1;
             if (a.status !== 'completed' && b.status === 'completed') return -1;
             return new Date(b.date).getTime() - new Date(a.date).getTime();
         });
        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Handle fetch error display if needed
      }
    };

    if (isConnected) { // Only fetch if connected
        fetchEvents();
    }
  }, [isConnected]); // Re-fetch if connection status changes

  // --- Input Handlers for Create Form ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleOutcomeChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newOutcomes = [...prev.outcomes];
      newOutcomes[index] = {
        ...newOutcomes[index],
        // Keep odds handling as before, adjust if needed based on your Outcome type
        [field]: field === 'odds' ? parseFloat(value) || 1 : value
      };
      return { ...prev, outcomes: newOutcomes };
    });
  };

  const addOutcome = () => {
    setFormData(prev => ({
      ...prev,
      outcomes: [...prev.outcomes, { name: '', odds: 1 }]
    }));
  };

  const removeOutcome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter((_, i) => i !== index)
    }));
  };

  // --- Action Handlers ---

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !isConnected) {
      setCreateError('Please connect your wallet first');
      return;
    }

    // Basic validation
    if (formData.outcomes.length < 2) {
        setCreateError('Event must have at least two outcomes.');
        return;
    }
    if (formData.outcomes.some(o => !o.name.trim())) {
        setCreateError('All outcome names must be filled.');
        return;
    }


    setIsCreating(true);
    setCreateError(null);

    try {
      const eventDate = new Date(formData.date);
       if (isNaN(eventDate.getTime())) {
           throw new Error("Invalid date format provided.");
       }
       if (eventDate < new Date()) {
           throw new Error("Event date must be in the future.");
       }
      const unixTimestamp = Math.floor(eventDate.getTime() / 1000);

      // Check if contract owner matches connected signer
      // const owner = await contract.owner(); // Assuming your contract has an owner() function
      // const userAddress = await signer.getAddress();
      // if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      //     throw new Error("Only the contract owner can create events.");
      // }


      // Create event on blockchain
      // Pass outcome names for potential on-chain storage/events if needed
      // const outcomeNames = formData.outcomes.map(o => o.name);
      // const tx = await contract.createEvent(formData.title, unixTimestamp, outcomeNames);
      const tx = await contract.createEvent(formData.title, unixTimestamp); // Use existing signature
      console.log(`Create event tx sent:`, tx.hash);
      const receipt = await tx.wait();
      console.log(`Create event confirmed.`);

      // --- Get Event ID ---
      // Method 1: Parse from logs (replace 'EventCreated' and argument names with your actual event)
      let eventId: string | null = null;
      const eventInterface = new ethers.utils.Interface([
        "event EventCreated(uint256 indexed eventId, string title, uint256 closingTime, address creator)" // Adjust ABI string
      ]);
      receipt.logs?.forEach((log: ethers.providers.Log) => {
          try {
              const parsedLog = eventInterface.parseLog(log);
              if (parsedLog.name === "EventCreated") {
                  eventId = parsedLog.args.eventId.toString();
              }
          } catch (e) { 
            console.log(e);
            /* Ignore logs that don't match */ }
      });


      // Method 2: Fallback using getAllEventIds (less reliable during high activity)
      if (!eventId) {
          console.warn("Could not parse event ID from logs, falling back to getAllEventIds");
          const ids = await contract.getAllEventIds();
          if (ids.length > 0) {
             eventId = ids[ids.length - 1].toString();
          }
      }

      if (!eventId) {
        throw new Error('Failed to retrieve event ID after transaction confirmation.');
      }
      console.log("Retrieved Event ID:", eventId);


      // Create event in backend
       const newEventData: Omit<Event, '_id'> = { // Assuming _id is generated by backend
          id: eventId,
          eventId: parseInt(eventId), // Assuming eventId from contract is numerical string
          title: formData.title,
          description: formData.description,
          longDescription: formData.longDescription,
          category: formData.category,
          status: 'upcoming',
          date: eventDate.toISOString(), // Store ISO string
          pool: 0,
          totalBets: 0,
          outcomes: formData.outcomes.map((outcome, index) => ({
            // Generate a predictable or meaningful ID if possible, otherwise use timestamp
            id: `${eventId}-${index}-${outcome.name.replace(/\s+/g, '-')}`, // Example ID generation
            name: outcome.name,
            amount: 0,
            odds: outcome.odds // Store odds if needed for display later
          })),
          // winningOutcome: null // Initialize winningOutcome as null or undefined
        };

      const createdBackendEvent = await createEvent(newEventData);
      console.log('Event created on backend:', createdBackendEvent);

        // Add to local state immediately for UI update
        // Ensure the structure matches the fetched events (especially _id if needed)
      setEvents(prev => [
        ...prev,
        createdBackendEvent
      ])


      // Reset form
      setFormData({
        title: '',
        description: '',
        longDescription: '',
        category: '',
        date: '',
        outcomes: [{ name: '', odds: 1 }]
      });

      // Optional: Navigate or show success message
      // navigate('/');

    } catch (err) {
      console.error('Error creating event:', err);
       const message = err instanceof Error ? err.message : 'Failed to create event. Check console for details.';
       // Try to parse RPC errors
        if (typeof err === 'object' && err !== null && 'reason' in err) {
             setCreateError(`Transaction failed: ${(err as { reason: string }).reason}`);
        } else if (typeof err === 'object' && err !== null && 'data' in err) {
             // Type the error object with an interface instead of using any
             setCreateError(`Transaction failed: ${(err as { data: { message?: string } }).data?.message || 'Unknown error'}`);
        }
       else {
             setCreateError(message);
       }
    } finally {
      setIsCreating(false);
    }
  };


  const handleCloseEvent = async (
    eventId: string,
    winningOptionIndexStr: string | undefined // Expecting the index as a string
  ) => {
    if (!contract ) {
      setCloseError("Contract not available or wallet not connected.");
      return;
    }
    if (winningOptionIndexStr === undefined || winningOptionIndexStr.trim() === "") {
      setCloseError("Please select the winning outcome.");
      return;
    }

    const winningOptionIndex = parseInt(winningOptionIndexStr, 10);
    if (isNaN(winningOptionIndex) || winningOptionIndex < 0) {
       setCloseError("Invalid winning option selected.");
       return;
     }

    const eventToClose = events.find((ev) => ev.eventId.toString() === eventId);
    if (!eventToClose) {
      setCloseError("Event not found.");
      return;
    }

    // Validate index against actual outcomes
    if (winningOptionIndex >= eventToClose.outcomes.length) {
        setCloseError(`Invalid winning option index (${winningOptionIndex}) for event ${eventId}.`);
        return;
    }


    // Optional UX check: prevent closing before event time (consider timezone issues)
    const eventDate = new Date(eventToClose.date); // Assuming date is stored correctly (ISO string)
    if (eventDate > new Date()) {
         const confirmCloseEarly = window.confirm("This event's date is in the future. Are you sure you want to close it now?");
         if (!confirmCloseEarly) return;
    }

    setClosingEventId(eventId);
    setIsClosing(true);
    setCloseError(null); // Clear previous errors for this section
    setWithdrawSuccess(null); // Clear other section messages

    try {
        // Check ownership if required by contract
        // const owner = await contract.owner();
        // const userAddress = await signer.getAddress();
        // if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        //     throw new Error("Only the contract owner can close events.");
        // }

      const eventIdBN = ethers.BigNumber.from(eventId); // Convert string ID from backend to BN for contract
      const tx = await contract.closeEvent(eventIdBN, winningOptionIndex); // Pass index directly
      console.log(`Close event ${eventId} tx sent:`, tx.hash);
      await tx.wait();
      console.log(`Close event ${eventId} confirmed.`);

      // Update backend with the winner
      const winningOutcome = eventToClose.outcomes[winningOptionIndex];
      if (!winningOutcome) {
          // This should theoretically not happen due to checks above, but good to be safe
          throw new Error(`Winning outcome at index ${winningOptionIndex} not found for event ${eventId}`);
      }
      const winningOutcomeId = winningOutcome.id.toString(); // Get the specific ID of the winning outcome

      await resolveEvent(eventId, winningOutcomeId); // Pass backend event ID and winning outcome ID
      console.log(`Event ${eventId} resolved on backend with winner: ${winningOutcome.name} (ID: ${winningOutcomeId})`);

      // Update local state to reflect the change
      setEvents((prev) =>
        prev.map((ev) =>
          ev.eventId.toString() === eventId ? { ...ev, winningOutcome: winningOutcomeId, status: 'completed' as const } : ev
        ).sort((a, b) => { // Re-sort after updating status
             if (a.status === 'completed' && b.status !== 'completed') return 1;
             if (a.status !== 'completed' && b.status === 'completed') return -1;
             // Handle potentially undefined dates safely
             const dateA = a.date ? new Date(a.date).getTime() : 0;
             const dateB = b.date ? new Date(b.date).getTime() : 0;
             return dateB - dateA;
        })
      );
      // Clear selection for the closed event
      setSelectedWinningOutcomes(prev => {
          const newState = {...prev};
          delete newState[eventId];
          return newState;
      })


    } catch (err: unknown) {
      console.error(`Error closing event ${eventId}:`, err);
       const error = err as Error & {
             reason?: string;
             data?: { message?: string };
           };
       let message = `Failed to close event #${eventId}: `;
       if (error.reason) {
         message += error.reason;
       } else if (error.data?.message) {
           // Extract nested error message if present
           const nestedMatch = error.data.message.match(/execution reverted: (.*)/);
           message += nestedMatch ? nestedMatch[1] : error.data.message;
       } else if (error.message) {
            message += error.message;
       }
       else {
         message += "Unknown error. Check console.";
       }
       setCloseError(message);
    } finally {
      setIsClosing(false);
      setClosingEventId(null);
    }
  };


  const handleWithdrawFees = async () => {
    if (!contract) {
      setWithdrawError("Contract not available or wallet not connected.");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);
    setCreateError(null); // Clear other section messages

    try {
        // Check ownership if required by contract
        // const owner = await contract.owner();
        // const userAddress = await signer.getAddress();
        // if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        //     throw new Error("Only the contract owner can withdraw fees.");
        // }

      const tx = await contract.withdrawFees();
      console.log("Withdraw fees tx sent:", tx.hash);
      await tx.wait();
      console.log("Withdraw fees confirmed.");
      setWithdrawSuccess("Fees withdrawn successfully!");
    } catch (err: unknown) {
       console.error("Error withdrawing fees:", err);
      const error = err as Error & {
        reason?: string;
        data?: { message?: string };
      };
      let message = "Failed to withdraw fees: ";
      if (error.reason) {
        message += error.reason;
      } else if (error.data?.message) {
          const nestedMatch = error.data.message.match(/execution reverted: (.*)/);
           message += nestedMatch ? nestedMatch[1] : error.data.message;
      } else if (error.message) {
           message += error.message;
      } else {
        message += "Unknown error. Check console.";
      }
      setWithdrawError(message);
      // alert(message); // Optionally use alert, but inline message is usually better UX
    } finally {
      setIsWithdrawing(false);
    }
  };

  // --- Render Logic ---

  // Display connect message if wallet is not connected
  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-slate-800 rounded-lg shadow-xl">
          <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2 text-white">Admin Access Required</h2>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to access the admin panel. Ensure you are connected with the owner account.
          </p>
          <button onClick={connect} className="btn btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Filter events for the "Manage Events" section
  const openEvents = events.filter(event => event.status !== 'completed');
  const completedEvents = events.filter(event => event.status === 'completed');

  // Check if the connected address is the admin (or contract owner)
  if (address?.toLowerCase() !== import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-slate-800 rounded-lg shadow-xl">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-slate-400 mb-6">
            You do not have permission to access the admin panel. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  // Main Admin Panel Render
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6">

      {/* --- Create New Event Section --- */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Create New Event</h1>
            <p className="text-slate-400 text-sm">
              Define a new betting event for users.
            </p>
          </div>
          <TrendingUp className="text-indigo-500" size={28} />
        </div>

        <form onSubmit={handleCreateEvent} className="space-y-6">
          {/* Event Details Sub-Card */}
          <div className="p-4 border border-slate-700 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-indigo-400">Event Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input w-full" placeholder="e.g., Premier League: Man City vs Liverpool" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Short Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="input w-full" placeholder="Brief summary (shown on cards)" required maxLength={100}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Detailed Description</label>
                <textarea name="longDescription" value={formData.longDescription} onChange={handleInputChange} className="input w-full h-24" placeholder="Full details about the event..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="input w-full" required>
                    <option value="">Select category...</option>
                    <option value="Sports">Sports</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Politics">Politics</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Esports">Esports</option>
                     <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Event Date & Time (UTC)</label>
                  <input type="datetime-local" name="date" value={formData.date} onChange={handleInputChange} className="input w-full" required />
                </div>
              </div>
            </div>
          </div>

          {/* Outcomes Sub-Card */}
          <div className="p-4 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-indigo-400">Possible Outcomes</h2>
                <button type="button" onClick={addOutcome} className="btn btn-outline btn-sm">
                    Add Outcome
                </button>
            </div>
            <div className="space-y-3">
              {formData.outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-grow">
                    <input type="text" value={outcome.name} onChange={(e) => handleOutcomeChange(index, 'name', e.target.value)} className="input w-full input-sm" placeholder={`Outcome ${index + 1} Name`} required />
                  </div>
                  {/* Removed odds input as it might not be used by contract */}
                  {/* <div className="w-24">
                     <input type="number" value={outcome.odds} onChange={(e) => handleOutcomeChange(index, 'odds', e.target.value)} className="input w-full input-sm" placeholder="Odds" min="1" step="0.01" required />
                   </div> */}
                  {formData.outcomes.length > 1 && ( // Show remove button only if more than one outcome
                    <button type="button" onClick={() => removeOutcome(index)} className="btn btn-outline btn-sm text-red-500 border-red-500 hover:bg-red-500/10">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.outcomes.length < 2 && <p className="text-xs text-amber-500 mt-2">At least two outcomes are required.</p>}
          </div>

          {/* Create Form Error Message */}
          {createError && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{createError}</span>
            </div>
          )}

          {/* Create Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => navigate('/')} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isCreating}>
              {isCreating ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>


      {/* --- Manage Existing Events Section --- */}
       <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                  <h1 className="text-2xl font-bold mb-1">Manage Events</h1>
                  <p className="text-slate-400 text-sm">
                      Close events and set the winning outcome.
                  </p>
              </div>
              <Lock className="text-amber-500" size={28} />
            </div>

            {/* Close Event Error Message */}
            {closeError && (
                <div className="alert alert-error mb-4">
                  <AlertCircle size={18} />
                  <span>{closeError}</span>
                </div>
            )}

            <div className="space-y-4">
               {openEvents.length === 0 && <p className="text-slate-500 italic text-center py-4">No open events to manage.</p>}

                {openEvents.map((event) => (
                    <div key={event.id} className="p-4 border border-slate-700 rounded-lg flex flex-col md:flex-row md:items-center gap-4 justify-between">
                       <div className="flex-grow">
                          <p className="font-semibold">{event.title} <span className="text-xs text-slate-400">(ID: {event.eventId})</span></p>
                          <p className="text-sm text-slate-400">Closes: {new Date(event.date).toLocaleString()}</p>
                       </div>
                       <div className="flex gap-3 items-center flex-wrap">
                            <select
                                value={selectedWinningOutcomes[event.eventId] ?? ""}
                                onChange={(e) => {
                                    const { value } = e.target;
                                    setSelectedWinningOutcomes(prev => ({
                                        ...prev,
                                        [event.eventId.toString()]: value
                                    }));
                                }}
                                className="input input-sm flex-grow min-w-[150px]"
                                disabled={isClosing && closingEventId === event.eventId.toString()}
                            >
                                <option value="" disabled>Select Winner...</option>
                                {event.outcomes.map((outcome, index) => (
                                <option key={outcome.id} value={index.toString()}> {/* Use index as value */}
                                    {outcome.name}
                                </option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleCloseEvent(event.eventId.toString(), selectedWinningOutcomes[event.eventId.toString()])}
                                className="btn btn-warning btn-sm" // Use warning color for potentially irreversible action
                                disabled={!selectedWinningOutcomes[event.eventId] || (isClosing && closingEventId === event.eventId.toString())} // Disable if no winner selected or closing in progress
                            >
                                {isClosing && closingEventId === event.eventId.toString() ? 'Closing...' : 'Close Event'}
                            </button>
                       </div>
                    </div>
                ))}
            </div>

             {/* Display Completed Events (Optional) */}
            {completedEvents.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <h3 className="text-lg font-semibold mb-3 text-slate-400">Completed Events</h3>
                    <ul className="space-y-2 text-sm list-disc list-inside pl-2">
                        {completedEvents.map(event => (
                            <li key={event.id} className="text-slate-500">
                                {event.title} (Closed) - Winner: {event.outcomes.find(o => o.id.toString() === event.winningOutcome)?.name || 'N/A'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
       </div>


      {/* --- Withdraw Fees Section --- */}
       <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                  <h1 className="text-2xl font-bold mb-1">Platform Fees</h1>
                  <p className="text-slate-400 text-sm">
                      Withdraw accumulated fees from the contract.
                  </p>
              </div>
              <DollarSign className="text-emerald-500" size={28} />
            </div>

            {/* Withdraw Feedback Messages */}
             {withdrawError && (
                <div className="alert alert-error mb-4">
                    <AlertCircle size={18}/>
                    <span>{withdrawError}</span>
                </div>
            )}
             {withdrawSuccess && (
                <div className="alert alert-success mb-4">
                   <CheckCircle size={18} />
                    <span>{withdrawSuccess}</span>
                </div>
            )}

            <div className="flex justify-end">
                 <button
                    onClick={handleWithdrawFees}
                    className="btn btn-success" // Use success color for withdrawal
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? 'Withdrawing...' : 'Withdraw Fees'}
                  </button>
            </div>
       </div>

    </div>
  );
};

export default Admin;

// --- Add to your src/types.ts (or wherever Event/Outcome types are defined) ---
/*
export interface Outcome {
  id: string;         // Unique identifier for the outcome within the event (e.g., "eventId-index-name")
  name: string;       // Display name of the outcome (e.g., "Team A Wins", "Price > $50k")
  amount: number;     // Total amount bet on this outcome (in wei or smallest unit, potentially a string for BigNumber)
  odds?: number;      // Optional: odds if stored/used in frontend (may not be on-chain)
  // betIds?: string[]; // Optional: If tracking individual bets per outcome
}

export interface Event {
  _id?: string;        // Optional: Database ID if using MongoDB or similar
  id: string;         // Blockchain Event ID (corresponds to uint256 from contract)
  eventId: number;    // Blockchain Event ID as number
  title: string;
  description: string;  // Short description
  longDescription?: string; // Detailed description
  category: string;
  status: 'upcoming' | 'open' | 'closed' | 'completed' | 'cancelled'; // Event lifecycle status
  date: string;       // Event date/time (ISO string format recommended: `new Date().toISOString()`)
  pool: number;       // Total pool size (in wei or smallest unit, potentially string)
  totalBets: number;  // Count of total bets placed
  outcomes: Outcome[];
  winningOutcome?: string | null; // ID of the winning outcome after resolution
  // createdAt?: string; // Optional: Timestamp from backend
  // updatedAt?: string; // Optional: Timestamp from backend
}
*/