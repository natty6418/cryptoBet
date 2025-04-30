import React, { createContext, useContext, useState, ReactNode } from 'react';

// Add Ethereum interface to Window object
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  
  // In a real application, this would use ethers.js or web3.js to connect to MetaMask
  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install it to use this feature.');
      return;
    }
  
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setAddress(accounts[0]); // First account from MetaMask
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      alert('Connection to MetaMask failed.');
    }
  };
  
  
  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
  };
  
  const value = {
    isConnected,
    address,
    connect,
    disconnect
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};