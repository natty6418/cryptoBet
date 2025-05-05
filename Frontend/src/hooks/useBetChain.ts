//useBetChain.ts
import { useMemo } from 'react';
import { ethers } from 'ethers';
import BetChainABI from '../contracts/BetChain.json';
import { useWallet } from '../contexts/WalletContext';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;

export const useBetChain = () => {
  const { isConnected } = useWallet();

  const contract = useMemo(() => {
    if (!window.ethereum) return null;

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    return  new ethers.Contract(CONTRACT_ADDRESS, BetChainABI.abi, provider.getSigner());

    // return { read, write };
  }, [isConnected]);

  return contract;
};
