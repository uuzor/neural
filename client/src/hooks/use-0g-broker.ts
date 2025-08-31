import { useState, useEffect } from 'react';
import { zgComputeClient, type ComputeProvider, type InferenceRequest, type InferenceResponse } from '@/lib/0g-compute';
import { zgStorageClient } from '@/lib/0g-storage';
import { useWallet } from './use-wallet';
import { useToast } from './use-toast';

export function useZGBroker() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [providers, setProviders] = useState<ComputeProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useWallet();
  const { toast } = useToast();

  const initialize = async (privateKey?: string) => {
    try {
      setIsLoading(true);
      await zgComputeClient.initialize(privateKey);
      await zgStorageClient.initialize();
      setIsInitialized(true);
      
      toast({
        title: "0G Network Connected",
        description: "Successfully connected to 0G Compute and Storage networks",
      });
    } catch (error) {
      console.error('Failed to initialize 0G broker:', error);
      toast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize 0G services",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const availableProviders = await zgComputeClient.getAvailableProviders();
      setProviders(availableProviders);
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast({
        title: "Failed to Load Providers",
        description: "Could not fetch available compute providers",
        variant: "destructive",
      });
    }
  };

  const requestInference = async (request: InferenceRequest): Promise<InferenceResponse | null> => {
    try {
      if (!isInitialized) {
        throw new Error('0G Broker not initialized');
      }

      const response = await zgComputeClient.requestInference(request);
      
      // Upload the inference result to 0G Storage
      await zgStorageClient.uploadTradingLog({
        requestId: response.requestId,
        provider: response.provider,
        model: response.model,
        prompt: request.prompt,
        response: response.response,
        timestamp: response.timestamp,
        cost: response.cost,
      });

      toast({
        title: "Inference Completed",
        description: `AI model ${request.model} processed your request`,
      });

      return response;
    } catch (error) {
      console.error('Failed to request inference:', error);
      toast({
        title: "Inference Failed",
        description: error instanceof Error ? error.message : "Failed to process inference request",
        variant: "destructive",
      });
      return null;
    }
  };

  const checkComputeBalance = async (): Promise<string> => {
    try {
      return await zgComputeClient.checkBalance();
    } catch (error) {
      console.error('Failed to check balance:', error);
      return '0';
    }
  };

  const addFunds = async (amount: string): Promise<void> => {
    try {
      await zgComputeClient.addFunds(amount);
      toast({
        title: "Funds Added",
        description: `Added ${amount} OG to your compute balance`,
      });
    } catch (error) {
      console.error('Failed to add funds:', error);
      toast({
        title: "Failed to Add Funds",
        description: error instanceof Error ? error.message : "Could not add funds",
        variant: "destructive",
      });
    }
  };

  const uploadToStorage = async (data: any, filename: string) => {
    try {
      const result = await zgStorageClient.uploadData(data, filename);
      toast({
        title: "Data Uploaded",
        description: `Successfully uploaded ${filename} to 0G Storage`,
      });
      return result;
    } catch (error) {
      console.error('Failed to upload to storage:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload data",
        variant: "destructive",
      });
      return null;
    }
  };

  const downloadFromStorage = async (hash: string) => {
    try {
      return await zgStorageClient.downloadData(hash);
    } catch (error) {
      console.error('Failed to download from storage:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download data",
        variant: "destructive",
      });
      return null;
    }
  };

  const getStorageStats = async () => {
    try {
      return await zgStorageClient.getStorageStats();
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { used: '0 GB', total: '0 GB', blobCount: 0 };
    }
  };

  // Auto-initialize when wallet is connected
  useEffect(() => {
    if (isConnected && !isInitialized && !isLoading) {
      initialize();
    }
  }, [isConnected, isInitialized, isLoading]);

  // Load providers when initialized
  useEffect(() => {
    if (isInitialized) {
      loadProviders();
    }
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    providers,
    initialize,
    loadProviders,
    requestInference,
    checkComputeBalance,
    addFunds,
    uploadToStorage,
    downloadFromStorage,
    getStorageStats,
  };
}
