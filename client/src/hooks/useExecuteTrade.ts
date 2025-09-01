import { useState, useCallback } from "react";

export type ExecuteTradeInput = {
  agent: string;
  asset: string;
  amount: string | number;
  price: string | number;
  isBuy: boolean;
  provider?: string;
  model: string;
  decisionPayload?: any; // optional contextual input sent to the model
};

export type ExecuteTradeResult = {
  success: boolean;
  storageHash?: string;
  aiDecisionHash?: string;
  txHash?: string;
  requestId?: string;
  provider?: string;
  error?: string;
};

export function useExecuteTrade() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ExecuteTradeResult | null>(null);

  const executeTrade = useCallback(async (input: ExecuteTradeInput): Promise<ExecuteTradeResult> => {
    setLoading(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (!res.ok) {
        const error = data?.message || "Failed to execute trade";
        const result = { success: false, error };
        setLastResult(result);
        return result;
      }
      const result: ExecuteTradeResult = {
        success: true,
        storageHash: data.storageHash,
        aiDecisionHash: data.aiDecisionHash,
        txHash: data.txHash,
        requestId: data.requestId,
        provider: data.provider
      };
      setLastResult(result);
      return result;
    } catch (e: any) {
      const result = { success: false, error: e?.message || "Unknown error" };
      setLastResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeTrade, loading, lastResult };
}