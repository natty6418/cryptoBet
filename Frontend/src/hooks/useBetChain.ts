import { useMemo } from 'react';
import { ethers } from 'ethers';
import BetChainABI from '../contracts/BetChain.json';
import { useWallet } from '../contexts/WalletContext';

const CONTRACT_ADDRESS = '0x0xd9145CCE52D386f254917e481eB44e9943F39138';

export const useBetChain = () => {
  const { isConnected } = useWallet();

  const contract = useMemo(() => {
    if (!isConnected || !window.ethereum) return null;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, BetChainABI.abi, signer);
  }, [isConnected]);

  return contract;
};