import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const connect = () => {
    // Mock wallet connection
    setIsConnected(true);
    setAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
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