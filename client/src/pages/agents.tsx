import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletConnect } from "@/components/wallet-connect";
import { AgentDeploymentWizard } from "@/components/agent-deployment-wizard";
import { useWallet } from "@/hooks/use-wallet";
import { Link } from "wouter";
import { 
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Zap,
  Database
} from "lucide-react";
import type { TradingAgent, TradingSession, User } from "@shared/schema";
import { TradeWithProof } from "@/components/trade-with-proof";

interface AgentWithSessions extends TradingAgent {
  sessions?: TradingSession[];
}

export default function Agents() {
  const [showDeployment, setShowDeployment] = useState(false);
  const { isConnected, address } = useWallet();

  // Fetch user data when wallet is connected
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", address],
    enabled: !!address,
  });

  const { data: userAgents = [], isLoading, refetch } = useQuery<TradingAgent[]>({
    queryKey: ["/api/agents/user", user?.id],
    enabled: !!user?.id,
  });

  const handleAgentDeployment = (agentId: string) => {
    console.log("Agent deployed:", agentId);
    setShowDeployment(false);
    refetch();
  };

  const toggleAgentStatus = async (agentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Failed to toggle agent status:", error);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "bg-green-500/10 text-green-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500";
      case "high": return "bg-red-500/10 text-red-500";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      momentum: "Momentum Trading",
      arbitrage: "Cross-DEX Arbitrage", 
      meanreversion: "Mean Reversion",
      yieldfarm: "Yield Farming",
      custom: "Custom Strategy",
    };
    return labels[strategy] || strategy;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">0G</span>
                </div>
                <span className="text-xl font-semibold">AI Trading</span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-dashboard">
                  Dashboard
                </Link>
                <Link href="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-marketplace">
                  Marketplace
                </Link>
                <Link href="/agents" className="text-foreground hover:text-primary transition-colors" data-testid="link-agents">
                  My Agents
                </Link>
                <Link href="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-portfolio">
                  Portfolio
                </Link>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between" data-testid="section-page-header">
          <div>
            <h1 className="text-3xl font-bold">My Trading Agents</h1>
            <p className="text-muted-foreground mt-2">
              Manage your AI trading agents powered by 0G Network
            </p>
          </div>
          <Button 
            onClick={() => setShowDeployment(true)}
            disabled={!isConnected}
            data-testid="button-deploy-new-agent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Deploy New Agent
          </Button>
        </div>

        {!isConnected ? (
          /* Wallet Connection Required */
          <Card className="bg-card border border-border" data-testid="section-connect-wallet">
            <CardContent className="p-12 text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to view and manage your AI trading agents
              </p>
              <WalletConnect />
            </CardContent>
          </Card>
        ) : showDeployment ? (
          /* Agent Deployment Wizard */
          <div className="space-y-6" data-testid="section-deployment">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Deploy New Agent</h2>
              <Button 
                variant="outline"
                onClick={() => setShowDeployment(false)}
                data-testid="button-cancel-deployment"
              >
                Cancel
              </Button>
            </div>
            <AgentDeploymentWizard 
              userId={user?.id || ""} 
              onSuccess={handleAgentDeployment}
            />
          </div>
        ) : (
          /* Agents List */
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="section-agent-stats">
              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="stat-total-agents">
                        {userAgents.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Agents</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success" data-testid="stat-active-agents">
                        {userAgents.filter(agent => agent.isActive).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="stat-total-aum">
                        ${userAgents.reduce((sum, agent) => sum + parseFloat(agent.aum || "0"), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total AUM</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success" data-testid="stat-avg-return">
                        +{userAgents.length > 0 
                          ? (userAgents.reduce((sum, agent) => sum + parseFloat(agent.totalReturn || "0"), 0) / userAgents.length).toFixed(1)
                          : "0"
                        }%
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Return</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agents List */}
            <Card className="bg-card rounded-xl border border-border" data-testid="section-agents-list">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span>Your Trading Agents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-muted/20 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : userAgents.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Deploy your first AI trading agent to get started
                    </p>
                    <Button 
                      onClick={() => setShowDeployment(true)}
                      data-testid="button-deploy-first-agent"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Deploy Your First Agent
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userAgents.map((agent) => (
                      <Card key={agent.id} className="bg-secondary/30 border border-border hover:border-primary/30 transition-colors" data-testid={`card-agent-${agent.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-medium" data-testid={`text-agent-initials-${agent.id}`}>
                                  {agent.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-lg font-semibold" data-testid={`text-agent-name-${agent.id}`}>
                                    {agent.name}
                                  </h3>
                                  <Badge className={getRiskColor(agent.riskLevel)} data-testid={`badge-risk-${agent.id}`}>
                                    {agent.riskLevel}
                                  </Badge>
                                  {agent.isActive ? (
                                    <Badge className="bg-success/10 text-success" data-testid={`badge-status-${agent.id}`}>
                                      <Activity className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" data-testid={`badge-status-${agent.id}`}>
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground" data-testid={`text-agent-strategy-${agent.id}`}>
                                  {getStrategyLabel(agent.strategy)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-8">
                              {/* Performance Metrics */}
                              <div className="grid grid-cols-4 gap-6 text-center">
                                <div>
                                  <div className="text-lg font-semibold" data-testid={`metric-return-${agent.id}`}>
                                    {parseFloat(agent.totalReturn || "0") >= 0 ? "+" : ""}{agent.totalReturn}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">Return</div>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold" data-testid={`metric-sharpe-${agent.id}`}>
                                    {agent.sharpeRatio}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Sharpe</div>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold" data-testid={`metric-aum-${agent.id}`}>
                                    ${(parseFloat(agent.aum || "0") / 1000).toFixed(0)}K
                                  </div>
                                  <div className="text-xs text-muted-foreground">AUM</div>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold" data-testid={`metric-rating-${agent.id}`}>
                                    {agent.rating}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Rating</div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleAgentStatus(agent.id, agent.isActive)}
                                  data-testid={`button-toggle-${agent.id}`}
                                >
                                  {agent.isActive ? (
                                    <>
                                      <Pause className="w-4 h-4 mr-2" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Start
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  data-testid={`button-settings-${agent.id}`}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Agent Details */}
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">0G Model:</span>
                                <div className="font-mono text-xs" data-testid={`text-model-${agent.id}`}>
                                  {agent.ogComputeModel.slice(0, 10)}...
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Contract:</span>
                                <div className="font-mono text-xs" data-testid={`text-contract-${agent.id}`}>
                                  {agent.contractAddress?.slice(0, 10)}...
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Initial Funding:</span>
                                <div data-testid={`text-funding-${agent.id}`}>
                                  {agent.initialFunding} OG
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Created:</span>
                                <div data-testid={`text-created-${agent.id}`}>
                                  {new Date(agent.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {/* Trade with Proof */}
                            <div className="mt-6">
                              <h4 className="text-sm font-semibold mb-2">Execute Trade with OG Proof</h4>
                              <TradeWithProof
                                agentId={agent.contractAddress || agent.id}
                                defaultModel={agent.ogComputeModel}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 0G Integration Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-testid="section-0g-status">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>0G Compute Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Inference Calls Today</span>
                      <span className="font-semibold">247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Models</span>
                      <span className="font-semibold">2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Compute Balance</span>
                      <span className="font-semibold">0.847 OG</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Compute Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>0G Storage Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trading Logs Stored</span>
                      <span className="font-semibold">1,234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Storage Used</span>
                      <span className="font-semibold">2.4 GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">DA Blobs</span>
                      <span className="font-semibold">847</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Storage Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
