import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useProviders } from "@/hooks/useProviders";
import { useExecuteTrade } from "@/hooks/useExecuteTrade";

type Props = {
  agentId: string;
  defaultModel?: string;
  defaultProvider?: string;
};

export function TradeWithProof({ agentId, defaultModel, defaultProvider }: Props) {
  const [asset, setAsset] = useState<string>("0x0000000000000000000000000000000000000000");
  const [amount, setAmount] = useState<string>("1");
  const [price, setPrice] = useState<string>("1000");
  const [isBuy, setIsBuy] = useState<boolean>(true);
  const [model, setModel] = useState<string>(defaultModel || "llama-3.3-70b-instruct");
  const [provider, setProvider] = useState<string | undefined>(defaultProvider);
  const [auditInfo, setAuditInfo] = useState<{ aiDecisionHash?: string; txHash?: string; storageHash?: string } | null>(null);

  const { providers } = useProviders();
  const { executeTrade, loading, lastResult } = useExecuteTrade();

  const onSubmit = async () => {
    setAuditInfo(null);
    const result = await executeTrade({
      agent: agentId,
      asset,
      amount,
      price,
      isBuy,
      model,
      provider,
      decisionPayload: {
        input: {
          context: "agent-exec",
          hint: "Make a trade decision with verifiable proof",
          market: { asset, price: Number(price) }
        }
      }
    });

    if (result.success) {
      setAuditInfo({
        aiDecisionHash: result.aiDecisionHash,
        txHash: result.txHash,
        storageHash: result.storageHash
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label>Asset (address)</Label>
          <Input value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <Label>Amount</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>Price</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label>Side</Label>
          <Select value={isBuy ? "buy" : "sell"} onValueChange={(v) => setIsBuy(v === "buy")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Model</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="model id e.g. llama-3.3-70b-instruct" />
        </div>
        <div className="md:col-span-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v)}>
            <SelectTrigger><SelectValue placeholder="Select provider (optional)" /></SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.provider} value={p.provider}>
                  {p.provider.slice(0, 8)}… {p.model ? `(${p.model})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={onSubmit} disabled={loading}>
        {loading ? "Submitting…" : "Trade with Proof"}
      </Button>

      {auditInfo && (
        <div className="mt-4 p-4 rounded-lg border border-border bg-secondary/30 font-mono text-xs space-y-2">
          <div><span className="text-muted-foreground">aiDecisionHash:</span> {auditInfo.aiDecisionHash}</div>
          <div><span className="text-muted-foreground">txHash:</span> {auditInfo.txHash}</div>
          <div><span className="text-muted-foreground">storageHash:</span> {auditInfo.storageHash}</div>
        </div>
      )}

      {lastResult && !lastResult.success && (
        <div className="mt-4 p-3 rounded border border-red-400 text-red-600 text-sm">
          {lastResult.error || "Trade failed"}
        </div>
      )}
    </div>
  );
}