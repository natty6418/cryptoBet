import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext'; // Assuming path is correct
import { useBetChain } from '../hooks/useBetChain'; // Assuming path is correct

// Interface for event data fetched from the contract
interface ChainEvent {
  id: string; // Use string for ID consistency
  name: string;
  eventTime: ethers.BigNumber; // Keep as BigNumber for calculations/display
  isClosed: boolean;
  totalPool: ethers.BigNumber; // Keep as BigNumber for formatting
  winningOption?: number; // Populated only when closed
  betsPerOption: { [option: number]: ethers.BigNumber }; // Store bets per option
}

// Interface for user's bet details on a specific event
interface UserBetInfo {
  amount: ethers.BigNumber;
  option: number;
  claimed: boolean;
}

const UserPage: React.FC = () => {
  // --- Hooks ---
  const { isConnected, connect, address } = useWallet(); // Added provider
  const contract = useBetChain();
  const provider = contract?.provider; // Get provider from contract

  // --- State ---
  // General Page State
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [netErr, setNetErr] = useState<string | null>(null);

  // User Bet Data State
  const [userBets, setUserBets] = useState<{ [eventId: string]: UserBetInfo | null }>({});
  const [loadingUserBets, setLoadingUserBets] = useState(false);

  // Place Bet State (per event)
  const [betAmountInput, setBetAmountInput] = useState<{ [eventId: string]: string }>({});
  const [selectedOptionInput, setSelectedOptionInput] = useState<{ [eventId: string]: string }>({});
  const [placingBetEventId, setPlacingBetEventId] = useState<string | null>(null);
  const [betError, setBetError] = useState<{ [eventId: string]: string | null }>({});

  // Claim Reward State (per event)
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<{ [eventId: string]: string | null }>({});
  const [claimSuccess, setClaimSuccess] = useState<{ [eventId: string]: string | null }>({});


  // --- Data Fetching Functions ---

  // Fetch all events from the contract
  const loadEvents = useCallback(async () => {
    if (!contract || !address) return; // Contract not ready
    if (!isConnected) { // Don't fetch if not connected, clear existing data
        setEvents([]);
        setUserBets({});
        return;
    }

    setLoadingEvents(true);
    setNetErr(null);
    setEvents([]); // Clear previous events before loading
    setUserBets({}); // Clear previous user bets as well

    try {
      const code = await contract.provider.getCode(contract.address);
      if (code === '0x') {
        setNetErr('No contract found at this address on the selected network. Please ensure you are on the correct network.');
        setLoadingEvents(false);
        return;
      }

      const ids: ethers.BigNumber[] = await contract.getAllEventIds();
      const fetchedEventsPromises = ids.map(async (idBN: ethers.BigNumber) => {
        const id = idBN.toString();
        const e = await contract.events(idBN);
        console.log("getUserBet ",id, await contract.getUserBet(id, "0x53AAed39D5837a20eb2d5Cf0b82c0f6306C6753C"));
        console.log("getEventPool", id, await contract.getEventPool(id));
        console.log("getBetAmount", id, await contract.getBetAmount(id, 1));


        // Fetch bets per option (assuming max 2 options for simplicity here, adjust if needed)
        // In a real DApp, you might know the number of options or fetch them dynamically
        let betsPerOptionData: { [option: number]: ethers.BigNumber } = {};
        try {
            const [betsOpt0, betsOpt1] = await Promise.all([
                contract.getBetAmount(idBN, 0),
                contract.getBetAmount(idBN, 1)
            ]);
            betsPerOptionData = { 0: betsOpt0, 1: betsOpt1 };
        } catch (optionErr) {
            console.warn(`Could not fetch bet amounts for event ${id}:`, optionErr);
            // Handle cases with more/fewer options if necessary
            betsPerOptionData = { 0: ethers.BigNumber.from(0), 1: ethers.BigNumber.from(0) };
        }

        


        return {
          id: id,
          name: e.name,
          eventTime: ethers.BigNumber.from(e.eventTime),
          isClosed: e.isClosed,
          totalPool: ethers.BigNumber.from(e.totalPool),
          winningOption: e.isClosed ? ethers.BigNumber.from(e.winningOption).toNumber() : undefined,
          betsPerOption: betsPerOptionData,
        };
      });

      const fetchedEvents = await Promise.all(fetchedEventsPromises);
      fetchedEvents.sort((a, b) => parseInt(b.id) - parseInt(a.id)); // Sort newest first
      setEvents(fetchedEvents);

      // After loading events, load the user's bets for these events
      if (address && fetchedEvents.length > 0) {
          loadUserBets(fetchedEvents.map(ev => ev.id), address);
      }

    } catch (err: unknown) {
      // Handle errors as in AdminPage
       const error = err as Error & { reason?: string; code?: string };
       console.error("Error loading events:", error);
       let message = 'Failed to load events. ';
       if (error.reason) message += error.reason;
       else if (error.message) message += error.message;
       else message += 'Unknown error.';
       if (error.code === 'NETWORK_ERROR' || error.message?.includes('failed to detect network')) {
           message = 'Network error. Please check connection/network.';
       }
       setNetErr(message);
    } finally {
      setLoadingEvents(false);
    }
  }, [contract, isConnected, address]); // Added address dependency


  // Fetch user's bet details for given event IDs
  const loadUserBets = useCallback(async (eventIds: string[], userAddress: string) => {
      if (!contract || !userAddress || eventIds.length === 0) return;

      setLoadingUserBets(true);
      const bets: { [eventId: string]: UserBetInfo | null } = {};
      try {
          await Promise.all(eventIds.map(async (id) => {
              try {
                  const betInfo = await contract.getUserBet(ethers.BigNumber.from(id), userAddress);
                  // Check if a bet exists (amount > 0)
                  if (ethers.BigNumber.from(betInfo.amount).gt(0)) {
                      bets[id] = {
                          amount: ethers.BigNumber.from(betInfo.amount),
                          option: ethers.BigNumber.from(betInfo.option).toNumber(),
                          claimed: betInfo.claimed
                      };
                  } else {
                      bets[id] = null; // No bet placed by user for this event
                  }
              } catch (err) {
                  console.warn(`Failed to get user bet for event ${id}:`, err);
                  bets[id] = null; // Mark as null on error
              }
          }));
          setUserBets(bets);
      } catch (error) {
          console.error("Error loading user bets:", error);
          // Optionally set a general error state for user bets
      } finally {
          setLoadingUserBets(false);
      }
  }, [contract]); // Dependency: contract instance


  // --- Effects ---

  // Load events initially and when connection/contract changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]); // Use the memoized callback

  // Reload user bets if address changes (wallet switch)
  // This depends on loadEvents having already run and populated `events`
  useEffect(() => {
      if (address && events.length > 0) {
          loadUserBets(events.map(ev => ev.id), address);
      } else {
          setUserBets({}); // Clear bets if address is null or no events
      }
  }, [address, events, loadUserBets]); // Use memoized callback


  // --- Action Handlers ---

  const handlePlaceBet = async (eventId: string) => {
    if (!contract || !address) return alert('Please connect your wallet first.');
    const amountStr = betAmountInput[eventId]?.trim();
    const optionStr = selectedOptionInput[eventId]?.trim();

    if (!amountStr || !optionStr) return alert('Please enter both bet amount and select an option.');

    let amountInWei: ethers.BigNumber;
    try {
      amountInWei = ethers.utils.parseEther(amountStr);
      if (amountInWei.lte(0)) throw new Error("Amount must be positive.");
    } catch (e) {
      return alert(`Invalid bet amount: ${e instanceof Error ? e.message : 'Please enter a valid number in ETH.'}`);
    }

    const option = parseInt(optionStr, 10);
    if (isNaN(option) || option < 0) { // Basic validation, assuming options are 0, 1, etc.
      return alert('Invalid option selected. Please enter a valid option number (e.g., 0 or 1).');
    }

    // Check user balance (optional but good UX)
    if (provider) {
        try {
            const balance = await provider.getBalance(address);
            if (balance.lt(amountInWei)) {
                return alert(`Insufficient balance. You need ${amountStr} ETH to place this bet.`);
            }
        } catch (balanceError) {
            console.warn("Could not check balance:", balanceError);
            // Decide if you want to proceed without balance check or halt
        }
    }


    setPlacingBetEventId(eventId);
    setBetError(prev => ({ ...prev, [eventId]: null })); // Clear previous error

    try {
      const eventIdBN = ethers.BigNumber.from(eventId);
      const tx = await contract.placeBet(eventIdBN, option, { value: amountInWei });
      console.log(`Place bet transaction sent for event ${eventId}:`, tx.hash);

      // Provide feedback that transaction is processing
      alert(`Transaction sent (${tx.hash}). Waiting for confirmation...`);

      await tx.wait(); // Wait for confirmation
      console.log(`Place bet transaction confirmed for event ${eventId}.`);

      // Clear inputs for this event
      setBetAmountInput(prev => ({ ...prev, [eventId]: '' }));
      setSelectedOptionInput(prev => ({ ...prev, [eventId]: '' }));

      // Refresh events (to update total pool) and user bets
      await loadEvents(); // This will also trigger loadUserBets

      alert(`Bet successfully placed on event #${eventId}!`);


    } catch (err: unknown) {
      const error = err as Error & { reason?: string; code?: string, data?: { message?: string } };
      console.error(`Error placing bet on event ${eventId}:`, error);
      let message = `Failed to place bet: `;
      if (error.code && Number(error.code) === 4001) { // User rejected transaction
          message = 'Transaction rejected by user.';
      } else if (error.reason) {
           message += error.reason;
      } else if (error.data?.message) {
           message += error.data.message.replace('execution reverted: ', ''); // Clean up common prefix
      } else if (error.message) {
           message += error.message;
      } else {
           message += 'Unknown error.';
      }
      setBetError(prev => ({ ...prev, [eventId]: message }));
      // Don't use alert here, show inline error
    } finally {
      setPlacingBetEventId(null);
    }
  };

  const handleClaimReward = async (eventId: string) => {
    if (!contract || !address) return alert('Please connect your wallet first.');

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

      // Refresh user bets to update claimed status
      await loadUserBets([eventId], address); // Only need to reload this specific bet

      setClaimSuccess(prev => ({ ...prev, [eventId]: 'Reward claimed successfully!' }));
      // No alert needed, success message is shown inline

    } catch (err: unknown) {
       const error = err as Error & { reason?: string; code?: string, data?: { message?: string } };
       console.error(`Error claiming reward for event ${eventId}:`, error);
       let message = `Failed to claim reward: `;
       if (error.code && error.code === '4001') { // User rejected transaction
           message = 'Transaction rejected by user.';
       } else if (error.reason) {
           message += error.reason;
       } else if (error.data?.message) {
           message += error.data.message.replace('execution reverted: ', ''); // Clean up common prefix
       } else if (error.message) {
           message += error.message;
       } else {
           message += 'Unknown error.';
       }
       setClaimError(prev => ({ ...prev, [eventId]: message }));
       // Don't use alert here, show inline error
    } finally {
      setClaimingEventId(null);
    }
  };

  // --- Helper Functions ---
   const formatEth = (amount: ethers.BigNumberish | undefined): string => {
       if (amount === undefined) return 'N/A';
       try {
           return ethers.utils.formatEther(amount);
       } catch {
           return 'Error';
       }
   };

//    const calculatePotentialWin = (eventId: string): string => {
//        const event = events.find(ev => ev.id === eventId);
//        const userBet = userBets[eventId];
//        const selectedOptionStr = selectedOptionInput[eventId];

//        if (!event || !userBet || !selectedOptionStr || event.isClosed) return '0.00';

//        const selectedOption = parseInt(selectedOptionStr, 10);
//        if (isNaN(selectedOption)) return '0.00';

//        const betsOnSelectedOption = event.betsPerOption[selectedOption] ?? ethers.BigNumber.from(0);
//        const totalPoolAfterFee = event.totalPool.mul(100 - 2).div(100); // Assuming 2% fee from contract

//        if (betsOnSelectedOption.isZero()) return '0.00'; // Avoid division by zero

//        // Potential win = (Your Bet / Total Bets on Your Option) * (Total Pool After Fee)
//        const potentialWin = userBet.amount.mul(totalPoolAfterFee).div(betsOnSelectedOption);

//        return formatEth(potentialWin);
//    };

    const calculateActualWin = (eventId: string): string => {
        const event = events.find(ev => ev.id === eventId);
        const userBet = userBets[eventId];

        if (!event || !userBet || !event.isClosed || event.winningOption === undefined || userBet.option !== event.winningOption) {
            return '0.00'; // Not a winning bet or event not resolved
        }

        const winningOption = event.winningOption;
        const betsOnWinningOption = event.betsPerOption[winningOption] ?? ethers.BigNumber.from(0);
        const totalPoolAfterFee = event.totalPool.mul(100 - 2).div(100); // Assuming 2% fee

        if (betsOnWinningOption.isZero()) return '0.00'; // Should not happen if user won, but safe check

        const winAmount = userBet.amount.mul(totalPoolAfterFee).div(betsOnWinningOption);
        return formatEth(winAmount);
    };


  // --- Render Logic ---
  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>BetChain Events</h1>

      {/* Connection Button/Status */}
      {!isConnected ? (
        <button onClick={connect} style={styles.buttonConnect} disabled={!!address}>
          {address ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <p style={styles.connected}>Connected: {address}</p>
      )}

      {/* Network Error Display */}
      {netErr && <p style={styles.errorTextGlobal}>{netErr}</p>}

      {/* Loading Indicator */}
      {loadingEvents && <p style={styles.loadingText}>Loading events...</p>}

      {/* Event List */}
      {!loadingEvents && events.length === 0 && !netErr && (
        <p style={styles.infoText}>No events found. The admin may need to create some.</p>
      )}

      {!loadingEvents && events.length > 0 && (
        <div style={styles.eventList}>
          {events.map((ev) => {
            const eventDate = new Date(ev.eventTime.toNumber() * 1000);
            const isEventTimePassed = new Date() > eventDate;
            const userBetInfo = userBets[ev.id];
            const canBet = isConnected && !ev.isClosed && !isEventTimePassed && !userBetInfo; // Can bet if connected, open, not passed, and no prior bet
            const canClaim = isConnected && ev.isClosed && userBetInfo && userBetInfo.option === ev.winningOption && !userBetInfo.claimed;
            const isPlacingCurrentBet = placingBetEventId === ev.id;
            const isClaimingCurrent = claimingEventId === ev.id;

            return (
              <div key={ev.id} style={styles.eventItem}>
                {/* Event Info */}
                <div style={styles.eventHeader}>
                    <h3 style={styles.eventName}>#{ev.id}: {ev.name}</h3>
                    <span style={ev.isClosed ? styles.statusClosed : (isEventTimePassed ? styles.statusPassed : styles.statusOpen)}>
                        {ev.isClosed ? `Closed (Winner: Option ${ev.winningOption ?? 'N/A'})` : (isEventTimePassed ? 'Event Passed (Awaiting Result)' : 'Open')}
                    </span>
                </div>
                 <p style={styles.eventDetail}>🕒 Event Time: {eventDate.toLocaleString()}</p>
                 <p style={styles.eventDetail}>💰 Total Pool: {formatEth(ev.totalPool)} ETH</p>
                 {/* Display bets per option if available */}
                 <p style={styles.eventDetail}>
                    Bets:
                    {Object.entries(ev.betsPerOption).map(([opt, amount]) => (
                        ` Option ${opt}: ${formatEth(amount)} ETH `
                    ))}
                 </p>


                {/* User's Existing Bet Info */}
                {loadingUserBets && <p style={styles.infoText}>Loading your bet status...</p>}
                {!loadingUserBets && userBetInfo && (
                  <div style={styles.userBetInfo}>
                    <p><strong>Your Bet:</strong> {formatEth(userBetInfo.amount)} ETH on Option {userBetInfo.option}</p>
                    {ev.isClosed && userBetInfo.option === ev.winningOption && (
                       <p style={styles.winText}>🎉 You Won! Win Amount: {calculateActualWin(ev.id)} ETH</p>
                    )}
                     {ev.isClosed && userBetInfo.option !== ev.winningOption && (
                       <p style={styles.lossText}>Better luck next time.</p>
                    )}
                    {userBetInfo.claimed && <p style={styles.claimedText}>Reward Claimed</p>}
                  </div>
                )}

                {/* Place Bet Section (only if user can bet) */}
                {canBet && (
                  <div style={styles.actionSection}>
                    <h4 style={styles.actionTitle}>Place Your Bet</h4>
                     <div style={styles.inputGroup}>
                        <input
                            type="number"
                            step="0.01" // Allow reasonable increments
                            min="0"
                            placeholder="Amount (ETH)"
                            value={betAmountInput[ev.id] || ''}
                            onChange={(e) => setBetAmountInput(prev => ({ ...prev, [ev.id]: e.target.value }))}
                            style={styles.input}
                            disabled={isPlacingCurrentBet}
                        />
                         {/* Simple Option Input (Consider Radio Buttons for fixed options) */}
                        <input
                            type="number"
                            min="0"
                            placeholder="Option #"
                            value={selectedOptionInput[ev.id] || ''}
                            onChange={(e) => setSelectedOptionInput(prev => ({ ...prev, [ev.id]: e.target.value }))}
                            style={{...styles.input, width: '120px'}}
                            disabled={isPlacingCurrentBet}
                        />
                    </div>
                    <button
                      style={styles.buttonAction}
                      onClick={() => handlePlaceBet(ev.id)}
                      disabled={isPlacingCurrentBet || !betAmountInput[ev.id]?.trim() || !selectedOptionInput[ev.id]?.trim()}
                    >
                      {isPlacingCurrentBet ? 'Placing Bet...' : 'Place Bet'}
                    </button>
                    {betError[ev.id] && <p style={styles.errorTextAction}>{betError[ev.id]}</p>}
                  </div>
                )}

                {/* Claim Reward Section (only if user can claim) */}
                {canClaim && (
                  <div style={styles.actionSection}>
                     <h4 style={styles.actionTitle}>Claim Your Winnings</h4>
                     <p>You won {calculateActualWin(ev.id)} ETH!</p>
                    <button
                      style={styles.buttonSuccess}
                      onClick={() => handleClaimReward(ev.id)}
                      disabled={isClaimingCurrent}
                    >
                      {isClaimingCurrent ? 'Claiming...' : 'Claim Reward'}
                    </button>
                    {claimError[ev.id] && <p style={styles.errorTextAction}>{claimError[ev.id]}</p>}
                    {/* Success message handled by userBetInfo.claimed changing */}
                  </div>
                )}
                 {/* Show claim success message explicitly if needed */}
                 {claimSuccess[ev.id] && <p style={styles.successTextAction}>{claimSuccess[ev.id]}</p>}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// --- Styles --- (Similar structure to AdminPage, adjust as needed)
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: 800,
        margin: '30px auto',
        padding: '20px 25px',
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#fff',
        borderRadius: 10,
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.07)',
        color: '#444',
    },
    h1: {
        fontSize: 28,
        marginBottom: 25,
        color: '#222',
        textAlign: 'center',
        borderBottom: '1px solid #eee',
        paddingBottom: '15px',
    },
    buttonConnect: {
        padding: '12px 20px',
        fontSize: 16,
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        display: 'block',
        margin: '0 auto 20px auto', // Center button
    },
    connected: {
        color: '#28a745',
        fontWeight: 'bold',
        backgroundColor: '#e9f7ef',
        padding: '10px 15px',
        borderRadius: 6,
        textAlign: 'center',
        marginBottom: '20px',
        wordBreak: 'break-all',
    },
    errorTextGlobal: {
        color: '#dc3545',
        backgroundColor: '#f8d7da',
        padding: '10px 15px',
        borderRadius: 6,
        textAlign: 'center',
        marginBottom: '20px',
    },
    loadingText: {
        textAlign: 'center',
        color: '#666',
        fontSize: '16px',
        padding: '20px',
    },
    infoText: {
        textAlign: 'center',
        color: '#555',
        fontSize: '16px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
    },
    eventList: {
        marginTop: 20,
    },
    eventItem: {
        border: '1px solid #e9ecef',
        backgroundColor: '#fdfdfd',
        padding: '20px',
        marginBottom: 20,
        borderRadius: 8,
        boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
    },
    eventHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        flexWrap: 'wrap', // Allow wrapping
    },
    eventName: {
        margin: 0,
        fontSize: '20px',
        color: '#333',
        marginRight: '10px', // Space between name and status
    },
    eventDetail: {
        fontSize: '14px',
        color: '#555',
        margin: '5px 0',
        lineHeight: 1.5,
    },
    statusOpen: { color: '#28a745', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' },
    statusPassed: { color: '#ffc107', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }, // Yellowish for passed
    statusClosed: { color: '#dc3545', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' },
    userBetInfo: {
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#eef',
        borderRadius: '6px',
        borderLeft: '4px solid #007bff',
    },
    winText: { color: '#28a745', fontWeight: 'bold', margin: '5px 0' },
    lossText: { color: '#6c757d', margin: '5px 0' }, // Grey for loss
    claimedText: { color: '#17a2b8', fontWeight: 'bold', fontStyle: 'italic' }, // Teal for claimed
    actionSection: {
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px dashed #ddd',
    },
    actionTitle: {
        fontSize: '16px',
        marginBottom: '10px',
        color: '#0056b3',
    },
    inputGroup: {
        display: 'flex',
        gap: '10px',
        marginBottom: '10px',
        flexWrap: 'wrap', // Allow inputs to wrap
    },
    input: {
        padding: '10px 12px',
        fontSize: 15,
        borderRadius: 5,
        border: '1px solid #ccc',
        boxSizing: 'border-box',
        flexGrow: 1, // Allow amount input to take more space
    },
    buttonAction: {
        padding: '10px 16px',
        fontSize: 15,
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: 5,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    },
    buttonSuccess: {
        padding: '10px 16px',
        fontSize: 15,
        backgroundColor: '#28a745', // Green for claim
        color: '#fff',
        border: 'none',
        borderRadius: 5,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    },
    errorTextAction: {
        color: '#dc3545',
        fontSize: '14px',
        marginTop: '8px',
    },
    successTextAction: {
       color: '#28a745',
       fontSize: '14px',
       marginTop: '8px',
   },
};

// Add hover/disabled styles (similar to AdminPage)
const styleSheetUser = document.createElement("style");
styleSheetUser.type = "text/css";
styleSheetUser.innerText = `
  button:hover:not(:disabled) { filter: brightness(90%); }
  button:disabled { background-color: #ccc !important; cursor: not-allowed; opacity: 0.7; }
`;
// Ensure it doesn't conflict if AdminPage styles are also loaded
if (!document.getElementById('component-styles')) {
    styleSheetUser.id = 'component-styles';
    document.head.appendChild(styleSheetUser);
}


export default UserPage;
// ```

// **Explanation and Features:**

// 1.  **Interfaces:** Defined `ChainEvent` and `UserBetInfo` to structure the data. `ChainEvent` now includes `betsPerOption`.
// 2.  **State Variables:** Manages loading states, errors, user inputs (bet amount, selected option), and fetched data (events, user bets) separately. Errors and success messages are often tracked per-event ID for better inline feedback.
// 3.  **Data Fetching (`loadEvents`, `loadUserBets`):**
//     * `loadEvents`: Fetches all event details, including the amounts bet on options 0 and 1 (you might need to adjust this if your contract supports more options or provides this differently). It sorts events and triggers `loadUserBets`. Uses `useCallback` for memoization.
//     * `loadUserBets`: Fetches the connected user's specific bet information for each event ID passed to it. Uses `useCallback`.
// 4.  **Effects (`useEffect`):**
//     * Loads events when the component mounts or dependencies (`contract`, `isConnected`, `address`) change.
//     * Loads or clears user bets when the `address` changes or `events` are loaded/cleared.
// 5.  **Action Handlers (`handlePlaceBet`, `handleClaimReward`):**
//     * Include validation for inputs.
//     * Use `ethers.utils.parseEther` to convert user input (ETH) to Wei for the transaction.
//     * Interact with the corresponding contract functions (`placeBet`, `claimReward`).
//     * Provide user feedback during transaction sending and confirmation (using `alert` for sending, inline messages for success/error).
//     * Update relevant state (clear inputs, refresh data) after successful transactions.
//     * Improved error handling to show specific revert reasons or user rejection messages inline.
// 6.  **UI Rendering:**
//     * Conditionally renders content based on connection status, loading states, and errors.
//     * Maps through the `events` array to display each one.
//     * **Event Display:** Shows ID, name, time, total pool, status (Open, Passed, Closed with winner), and amounts bet per option.
//     * **User Bet Info:** If the user has placed a bet on an event, it displays their bet amount/option and indicates if they won/lost/claimed.
//     * **Place Bet Form:** Shown only for open events where the user hasn't bet yet. Includes inputs for amount and option, with a "Place Bet" button. Disables controls during the transaction. Shows inline errors.
//     * **Claim Reward Button:** Shown only for closed events where the user won and hasn't claimed yet. Disables button during the transaction. Shows inline errors or success messages.
// 7.  **Helper Functions:** `formatEth`, `calculateActualWin` for display formatting.
// 8.  **Styling:** Uses inline styles (`styles` object) for layout and appearance, similar to the `AdminPage`. Includes basic hover/disabled effects.

// Remember to place this `UserPage.tsx` file in your components directory and integrate it into your application's routing or main layout. You'll also need the `WalletContext` and `useBetChain` hook set up correctly as assumed by the import pat