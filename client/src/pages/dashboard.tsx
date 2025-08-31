import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet-connect";
import { AgentCard } from "@/components/agent-card";
import { TradingSessionsTable } from "@/components/trading-session";
import { PerformanceChart } from "@/components/performance-chart";
import { OGNetworkStatus } from "@/components/og-network-status";
import { AgentDeploymentWizard } from "@/components/agent-deployment-wizard";
import { SimulationConsole } from "@/components/simulation-console";
import { useWallet } from "@/hooks/use-wallet";
import { useZGBroker } from "@/hooks/use-0g-broker";
import { Link } from "wouter";
import { 
  DollarSign, 
  Bot, 
  Zap, 
  TrendingUp,
  Plus,
  Activity,
  Database,
  Shield,
  Code
} from "lucide-react";
import type { TradingAgent, Portfolio, TradingSession, User } from "@shared/schema";

interface EnrichedTradingSession extends TradingSession {
  agent?: {
    name: string;
    initials: string;
    id: string;
  };
}

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "30D">("24H");
  const { isConnected, address } = useWallet();
  const { getStorageStats } = useZGBroker();

  // Fetch user data when wallet is connected
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", address],
    enabled: !!address,
  });

  const { data: portfolio } = useQuery<Portfolio>({
    queryKey: ["/api/portfolio", user?.id],
    enabled: !!user?.id,
  });

  const { data: userAgents = [] } = useQuery<TradingAgent[]>({
    queryKey: ["/api/agents/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: marketplaceAgents = [] } = useQuery<TradingAgent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: activeSessions = [] } = useQuery<EnrichedTradingSession[]>({
    queryKey: ["/api/sessions/active"],
  });

  const portfolioMetrics = {
    totalValue: portfolio?.totalValue || "0",
    dailyPnl: portfolio?.dailyPnl || "0",
    ogBalance: portfolio?.ogBalance || "0", 
    activeAgentsCount: portfolio?.activeAgentsCount || 0,
  };

  const featuredAgents = marketplaceAgents.slice(0, 3);

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
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors" data-testid="link-dashboard">
                  Dashboard
                </Link>
                <Link href="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-marketplace">
                  Marketplace
                </Link>
                <Link href="/agents" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-agents">
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
        {/* Portfolio Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="section-portfolio-overview">
          <Card className="bg-card rounded-xl border border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Total Portfolio Value</h3>
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-success" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold" data-testid="text-portfolio-value">
                  ${parseFloat(portfolioMetrics.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <span className="text-success">+${portfolioMetrics.dailyPnl}</span>
                  <span className="text-success">(+{((parseFloat(portfolioMetrics.dailyPnl) / parseFloat(portfolioMetrics.totalValue)) * 100).toFixed(2)}%)</span>
                  <span className="text-muted-foreground">24h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-xl border border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Active Agents</h3>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold" data-testid="text-active-agents">
                  {portfolioMetrics.activeAgentsCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  {userAgents.filter(agent => agent.isActive).length} performing above benchmark
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-xl border border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">0G Compute Balance</h3>
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold" data-testid="text-og-balance">
                  {portfolioMetrics.ogBalance} OG
                </div>
                <div className="text-sm text-muted-foreground">
                  ~{Math.floor(parseFloat(portfolioMetrics.ogBalance) * 10000)} inference calls
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-xl border border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Today's PnL</h3>
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-success" data-testid="text-daily-pnl">
                  +${portfolioMetrics.dailyPnl}
                </div>
                <div className="text-sm text-muted-foreground">Sharpe: 2.34</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Chart */}
          <PerformanceChart timeframe={timeframe} onTimeframeChange={setTimeframe} />

          {/* Network Status and Quick Actions */}
          <div className="space-y-6">
            <OGNetworkStatus />

            {/* Quick Actions */}
            <Card className="bg-card rounded-xl border border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/agents" data-testid="link-deploy-agent">
                    <Button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-left">
                      <div className="flex items-center space-x-3">
                        <Plus className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Deploy New Agent</div>
                          <div className="text-sm opacity-80">Create AI trading agent</div>
                        </div>
                      </div>
                    </Button>
                  </Link>
                  <Button className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-left">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Add Funds</div>
                        <div className="text-sm opacity-80">Top up 0G balance</div>
                      </div>
                    </div>
                  </Button>
                  <Button className="w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors text-left">
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5" />
                      <div>
                        <div className="font-medium">View Logs</div>
                        <div className="text-sm opacity-80">Check trading history</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Agent Marketplace Preview */}
        <section className="bg-card rounded-xl p-6 border border-border" data-testid="section-marketplace-preview">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Featured AI Agents</h2>
            <Link href="/marketplace">
              <Button variant="outline" data-testid="button-view-all-agents">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAgents.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bot className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">No agents available</p>
                <p className="text-sm">Check back later for new AI trading agents</p>
              </div>
            ) : (
              featuredAgents.map((agent) => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent}
                  onViewDetails={(agentId) => console.log("View details:", agentId)}
                  onInvest={(agentId) => console.log("Invest in:", agentId)}
                />
              ))
            )}
          </div>
        </section>

        {/* Active Trading Sessions */}
        <section className="bg-card rounded-xl p-6 border border-border" data-testid="section-trading-sessions">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Active Trading Sessions</h2>
            <Button 
              variant="outline"
              size="sm"
              data-testid="button-refresh-sessions"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <TradingSessionsTable 
            sessions={activeSessions}
            onViewDetails={(sessionId) => console.log("View session:", sessionId)}
          />
        </section>

        {/* 0G Integration Dashboard */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-testid="section-0g-integration">
          {/* 0G Compute Network Integration */}
          <Card className="bg-card rounded-xl border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">0G Compute Network</h2>
                <div className="flex items-center space-x-2 text-sm text-success">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>Connected</span>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Available Providers</span>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Refresh
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">llama-3.3-70b-instruct</span>
                        <span className="text-success">Available</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">deepseek-r1-70b</span>
                        <span className="text-success">Available</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-2">Recent Inference Calls</div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Market analysis request</span>
                        <span>2 min ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trading signal generation</span>
                        <span>5 min ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk assessment</span>
                        <span>8 min ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full" data-testid="button-test-inference">
                  Test AI Inference
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 0G Storage & DA Integration */}
          <Card className="bg-card rounded-xl border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Storage & Data Availability</h2>
                <div className="flex items-center space-x-2 text-sm text-success">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>Synced</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-secondary/30">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium mb-1">Storage Used</div>
                      <div className="text-lg font-bold">2.4 GB</div>
                      <div className="text-xs text-muted-foreground">of 10 GB plan</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/30">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium mb-1">DA Blobs</div>
                      <div className="text-lg font-bold">847</div>
                      <div className="text-xs text-muted-foreground">stored today</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-2">Recent Trading Logs</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-mono">0x7f8e...9a0b</span>
                        <span className="text-success">Verified</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-mono">0x9a0b...1c2d</span>
                        <span className="text-success">Verified</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-mono">0x1c2d...3e4f</span>
                        <span className="text-warning">Pending</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="text-sm" data-testid="button-upload-logs">
                    Upload Logs
                  </Button>
                  <Button variant="outline" className="text-sm" data-testid="button-view-storage">
                    View Storage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Agent Deployment */}
        {isConnected && user && (
          <AgentDeploymentWizard 
            userId={user.id}
            onSuccess={(agentId) => console.log("Agent deployed:", agentId)}
          />
        )}

        {/* Trading Simulation */}
        <SimulationConsole />

        {/* Footer */}
        <footer className="bg-card rounded-xl p-6 border border-border" data-testid="footer-info">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">0G Network Integration</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>• AI inference via 0G Compute Network SDK</div>
                <div>• Decentralized storage with 0G Storage</div>
                <div>• Data availability through 0G DA layer</div>
                <div>• Smart contracts on 0G Chain (EVM)</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Supported Platforms</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>• Uniswap V2/V3 integration</div>
                <div>• Hyperliquid orderbook DEX</div>
                <div>• Cross-chain DEX support</div>
                <div>• ERC-4626 vault compliance</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security & Verification</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>• TEE (TeeML) verified inference</div>
                <div>• PoRA (Proof of Random Access) mining</div>
                <div>• Cryptographic result verification</div>
                <div>• Immutable performance scoring</div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            Built on 0G • Newton Testnet • Chain ID: 16600 • 
            <a href="https://docs.0g.ai" className="text-primary hover:text-primary/80 transition-colors ml-1">
              Documentation
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
