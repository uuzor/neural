import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WalletConnect } from "@/components/wallet-connect";
import { PerformanceChart } from "@/components/performance-chart";
import { useWallet } from "@/hooks/use-wallet";
import { Link } from "wouter";
import { 
  PieChart,
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Calendar,
  ArrowUpDown,
  ExternalLink
} from "lucide-react";
import type { Portfolio, InvestmentAllocation, TradingAgent, User } from "@shared/schema";

interface InvestmentWithAgent extends InvestmentAllocation {
  agent?: TradingAgent;
}

export default function Portfolio() {
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "30D">("30D");
  const [sortBy, setSortBy] = useState("amount");
  const { isConnected, address } = useWallet();

  // Fetch user data when wallet is connected
  const { data: user } = useQuery({
    queryKey: ["/api/users", address],
    enabled: !!address,
  });

  const { data: portfolio } = useQuery<Portfolio>({
    queryKey: ["/api/portfolio", user?.id],
    enabled: !!user?.id,
  });

  const { data: investments = [] } = useQuery<InvestmentAllocation[]>({
    queryKey: ["/api/investments/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: userAgents = [] } = useQuery<TradingAgent[]>({
    queryKey: ["/api/agents/user", user?.id],
    enabled: !!user?.id,
  });

  // Enrich investments with agent data
  const enrichedInvestments: InvestmentWithAgent[] = investments.map(investment => ({
    ...investment,
    agent: userAgents.find(agent => agent.id === investment.agentId)
  }));

  // Sort investments
  const sortedInvestments = [...enrichedInvestments].sort((a, b) => {
    switch (sortBy) {
      case "amount":
        return parseFloat(b.amount) - parseFloat(a.amount);
      case "performance":
        return parseFloat(b.agent?.totalReturn || "0") - parseFloat(a.agent?.totalReturn || "0");
      case "date":
        return new Date(b.allocatedAt).getTime() - new Date(a.allocatedAt).getTime();
      default:
        return 0;
    }
  });

  const portfolioMetrics = {
    totalValue: parseFloat(portfolio?.totalValue || "0"),
    dailyPnl: parseFloat(portfolio?.dailyPnl || "0"),
    totalInvested: investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
    totalReturn: 0, // Would be calculated based on current vs invested amounts
  };

  const performanceMetrics = {
    winRate: userAgents.filter(agent => parseFloat(agent.totalReturn || "0") > 0).length / Math.max(userAgents.length, 1) * 100,
    avgReturn: userAgents.length > 0 ? userAgents.reduce((sum, agent) => sum + parseFloat(agent.totalReturn || "0"), 0) / userAgents.length : 0,
    bestPerformer: userAgents.reduce((best, agent) => 
      parseFloat(agent.totalReturn || "0") > parseFloat(best?.totalReturn || "0") ? agent : best, 
      userAgents[0]
    ),
    sharpeRatio: userAgents.length > 0 ? userAgents.reduce((sum, agent) => sum + parseFloat(agent.sharpeRatio || "0"), 0) / userAgents.length : 0,
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
                <Link href="/agents" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-agents">
                  My Agents
                </Link>
                <Link href="/portfolio" className="text-foreground hover:text-primary transition-colors" data-testid="link-portfolio">
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
            <h1 className="text-3xl font-bold">Portfolio Overview</h1>
            <p className="text-muted-foreground mt-2">
              Track your investments and performance across all AI trading agents
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {!isConnected ? (
          /* Wallet Connection Required */
          <Card className="bg-card border border-border" data-testid="section-connect-wallet">
            <CardContent className="p-12 text-center">
              <PieChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to view your portfolio and investment performance
              </p>
              <WalletConnect />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="section-portfolio-summary">
              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Portfolio Value</h3>
                    <DollarSign className="w-4 h-4 text-success" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold" data-testid="text-total-value">
                      ${portfolioMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                      <span className={portfolioMetrics.dailyPnl >= 0 ? "text-success" : "text-destructive"}>
                        {portfolioMetrics.dailyPnl >= 0 ? "+" : ""}${portfolioMetrics.dailyPnl.toFixed(2)}
                      </span>
                      <span className={portfolioMetrics.dailyPnl >= 0 ? "text-success" : "text-destructive"}>
                        ({((portfolioMetrics.dailyPnl / portfolioMetrics.totalValue) * 100).toFixed(2)}%)
                      </span>
                      <span className="text-muted-foreground">24h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Invested</h3>
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold" data-testid="text-total-invested">
                      ${portfolioMetrics.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Across {investments.length} investments
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Average Return</h3>
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-success" data-testid="text-avg-return">
                      +{performanceMetrics.avgReturn.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Win rate: {performanceMetrics.winRate.toFixed(0)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Best Performer</h3>
                    <Activity className="w-4 h-4 text-warning" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold" data-testid="text-best-performer">
                      {performanceMetrics.bestPerformer?.name || "N/A"}
                    </div>
                    <div className="text-sm text-success">
                      +{performanceMetrics.bestPerformer?.totalReturn || "0"}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <PerformanceChart timeframe={timeframe} onTimeframeChange={setTimeframe} />

            {/* Investment Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Investment List */}
              <div className="lg:col-span-2">
                <Card className="bg-card rounded-xl border border-border" data-testid="section-investments">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="w-5 h-5" />
                        <span>Your Investments</span>
                      </CardTitle>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-40" data-testid="select-sort-investments">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">Sort by Amount</SelectItem>
                          <SelectItem value="performance">Sort by Performance</SelectItem>
                          <SelectItem value="date">Sort by Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sortedInvestments.length === 0 ? (
                      <div className="text-center py-12">
                        <PieChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Start investing in AI trading agents to track your portfolio here
                        </p>
                        <Link href="/marketplace">
                          <Button data-testid="button-browse-agents">
                            Browse Agents
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedInvestments.map((investment) => (
                          <Card key={investment.id} className="bg-secondary/30 border border-border" data-testid={`card-investment-${investment.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                      {investment.agent?.name.split(' ').map(n => n[0]).join('') || "AI"}
                                    </span>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold" data-testid={`text-agent-name-${investment.id}`}>
                                      {investment.agent?.name || "Unknown Agent"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      Invested: ${parseFloat(investment.amount).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                  <div className="text-center">
                                    <div className={`text-lg font-semibold ${
                                      parseFloat(investment.agent?.totalReturn || "0") >= 0 ? "text-success" : "text-destructive"
                                    }`} data-testid={`text-return-${investment.id}`}>
                                      {parseFloat(investment.agent?.totalReturn || "0") >= 0 ? "+" : ""}{investment.agent?.totalReturn}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Return</div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-lg font-semibold" data-testid={`text-current-value-${investment.id}`}>
                                      ${(parseFloat(investment.amount) * (1 + parseFloat(investment.agent?.totalReturn || "0") / 100)).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Current Value</div>
                                  </div>

                                  <div className="text-center">
                                    <div className="text-sm text-muted-foreground" data-testid={`text-invested-date-${investment.id}`}>
                                      {new Date(investment.allocatedAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Invested</div>
                                  </div>

                                  <Button variant="ghost" size="sm" data-testid={`button-view-agent-${investment.id}`}>
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Portfolio Analytics */}
              <div className="space-y-6">
                <Card className="bg-card border border-border" data-testid="section-analytics">
                  <CardHeader>
                    <CardTitle>Portfolio Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                        <span className="font-semibold" data-testid="text-sharpe-ratio">
                          {performanceMetrics.sharpeRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Win Rate</span>
                        <span className="font-semibold" data-testid="text-win-rate">
                          {performanceMetrics.winRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Active Agents</span>
                        <span className="font-semibold" data-testid="text-active-agents-count">
                          {userAgents.filter(agent => agent.isActive).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Agents</span>
                        <span className="font-semibold" data-testid="text-total-agents-count">
                          {userAgents.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border" data-testid="section-allocation">
                  <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {investments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <PieChart className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">No allocations yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sortedInvestments.slice(0, 5).map((investment, index) => {
                          const percentage = (parseFloat(investment.amount) / portfolioMetrics.totalInvested) * 100;
                          return (
                            <div key={investment.id} className="space-y-2" data-testid={`allocation-${investment.id}`}>
                              <div className="flex justify-between text-sm">
                                <span className="truncate">{investment.agent?.name || "Unknown"}</span>
                                <span>{percentage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border" data-testid="section-actions">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Link href="/marketplace" className="block">
                        <Button className="w-full" data-testid="button-invest-more">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Invest in More Agents
                        </Button>
                      </Link>
                      <Link href="/agents" className="block">
                        <Button variant="outline" className="w-full" data-testid="button-manage-agents">
                          <Activity className="w-4 h-4 mr-2" />
                          Manage My Agents
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full" data-testid="button-export-data">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
