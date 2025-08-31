import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, AlertTriangle } from "lucide-react";

export function WalletConnect() {
  const { 
    isConnected, 
    address, 
    balance, 
    isLoading, 
    isCorrectNetwork,
    connect, 
    disconnect, 
    switchToOGNetwork 
  } = useWallet();

  if (isLoading) {
    return (
      <Button disabled data-testid="button-wallet-loading">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="destructive" className="flex items-center space-x-1" data-testid="badge-wrong-network">
          <AlertTriangle className="h-3 w-3" />
          <span>Wrong Network</span>
        </Badge>
        <Button onClick={switchToOGNetwork} size="sm" data-testid="button-switch-network">
          Switch to 0G
        </Button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" data-testid="indicator-network-status"></div>
          <span data-testid="text-network-name">0G Newton Testnet</span>
        </div>
        <div className="flex items-center space-x-2 text-sm" data-testid="text-wallet-info">
          <Wallet className="h-4 w-4" />
          <span className="font-mono">{balance.slice(0, 6)} A0GI</span>
        </div>
        <Button 
          variant="outline" 
          onClick={disconnect}
          data-testid="button-disconnect-wallet"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} data-testid="button-connect-wallet">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
