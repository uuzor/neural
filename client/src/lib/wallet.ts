import { ethers } from 'ethers';

export const OG_NETWORK_CONFIG = {
  chainId: '0x40D0', // 16600 in hex
  chainName: '0G Newton Testnet',
  nativeCurrency: {
    name: 'A0GI',
    symbol: 'A0GI',
    decimals: 18,
  },
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  blockExplorerUrls: ['https://chainscan-newton.0g.ai/'],
};

export interface WalletState {
  isConnected: boolean;
  address: string;
  balance: string;
  chainId: number;
}

export class WalletManager {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(): Promise<WalletState> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Switch to 0G Newton Testnet
      await this.switchToOGNetwork();

      // Get wallet state
      const address = accounts[0];
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        isConnected: true,
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async switchToOGNetwork(): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OG_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [OG_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to add 0G network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to 0G network:', switchError);
        throw switchError;
      }
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
        data,
      });

      return tx.hash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  disconnect(): void {
    this.provider = null;
    this.signer = null;
  }
}

export const walletManager = new WalletManager();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
