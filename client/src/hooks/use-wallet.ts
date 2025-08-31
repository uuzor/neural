import { useState, useEffect } from 'react';
import { walletManager, type WalletState } from '@/lib/wallet';
import { useToast } from '@/hooks/use-toast';

const initialState: WalletState = {
  isConnected: false,
  address: '',
  balance: '0',
  chainId: 0,
};

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const connect = async () => {
    try {
      setIsLoading(true);
      const state = await walletManager.connect();
      setWalletState(state);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${state.address.slice(0, 6)}...${state.address.slice(-4)}`,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    walletManager.disconnect();
    setWalletState(initialState);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const switchToOGNetwork = async () => {
    try {
      await walletManager.switchToOGNetwork();
      toast({
        title: "Network Switched",
        description: "Switched to 0G Newton Testnet",
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast({
        title: "Network Switch Failed",
        description: error instanceof Error ? error.message : "Failed to switch network",
        variant: "destructive",
      });
    }
  };

  const refreshBalance = async () => {
    try {
      if (walletState.isConnected && walletState.address) {
        const balance = await walletManager.getBalance(walletState.address);
        setWalletState(prev => ({ ...prev, balance }));
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== walletState.address) {
          // Account changed, reconnect
          connect();
        }
      };

      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setWalletState(prev => ({ ...prev, chainId: newChainId }));
        
        if (newChainId !== 16600) {
          toast({
            title: "Wrong Network",
            description: "Please switch to 0G Newton Testnet",
            variant: "destructive",
          });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [walletState.address]);

  return {
    ...walletState,
    isLoading,
    connect,
    disconnect,
    switchToOGNetwork,
    refreshBalance,
    isCorrectNetwork: walletState.chainId === 16600,
  };
}
