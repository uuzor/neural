import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WalletConnect } from "@/components/wallet-connect";
import { AgentCard } from "@/components/agent-card";
import { Link } from "wouter";
import { Search, Filter, Bot, TrendingUp, Shield, Zap } from "lucide-react";
import type { TradingAgent } from "@shared/schema";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("performance");
  const [filterByRisk, setFilterByRisk] = useState("all");
  const [filterByStrategy, setFilterByStrategy] = useState("all");

  const { data: agents = [], isLoading, error } = useQuery<TradingAgent[]>({
    queryKey: ["/api/agents"],
  });

  // Filter and sort agents based on user input
  const filteredAgents = agents
    .filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           agent.strategy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = filterByRisk === "all" || agent.riskLevel === filterByRisk;
      const matchesStrategy = filterByStrategy === "all" || agent.strategy === filterByStrategy;
      
      return matchesSearch && matchesRisk && matchesStrategy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "performance":
          return parseFloat(b.totalReturn || "0") - parseFloat(a.totalReturn || "0");
        case "popularity":
          return parseFloat(b.aum || "0") - parseFloat(a.aum || "0");
        case "risk":
          const riskOrder = { low: 1, medium: 2, high: 3 };
          return riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder];
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const strategyOptions = [
    { value: "all", label: "All Strategies" },
    { value: "momentum", label: "Momentum Trading" },
    { value: "arbitrage", label: "Cross-DEX Arbitrage" },
    { value: "meanreversion", label: "Mean Reversion" },
    { value: "yieldfarm", label: "Yield Farming" },
    { value: "custom", label: "Custom Strategy" },
  ];

  const riskOptions = [
    { value: "all", label: "All Risk Levels" },
    { value: "low", label: "Low Risk" },
    { value: "medium", label: "Medium Risk" },
    { value: "high", label: "High Risk" },
  ];

  const sortOptions = [
    { value: "performance", label: "Best Performance" },
    { value: "popularity", label: "Most Popular" },
    { value: "risk", label: "Lowest Risk" },
    { value: "newest", label: "Newest" },
  ];

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
                <Link href="/marketplace" className="text-foreground hover:text-primary transition-colors" data-testid="link-marketplace">
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
        {/* Page Header */}
        <div className="text-center space-y-4" data-testid="section-page-header">
          <h1 className="text-4xl font-bold">AI Trading Agent Marketplace</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and invest in AI-powered trading agents built on the 0G Network. 
            All agents use verifiable AI inference and store performance data on-chain.
          </p>
          
          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
            <Card className="bg-card/50 border border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{agents.length}</div>
                <div className="text-sm text-muted-foreground">Active Agents</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  ${agents.reduce((sum, agent) => sum + parseFloat(agent.aum || "0"), 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total AUM</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {agents.filter(agent => agent.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Today</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {agents.filter(agent => parseFloat(agent.totalReturn || "0") > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Profitable</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-card rounded-xl border border-border" data-testid="section-filters">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Search & Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents by name or strategy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-agents"
                  />
                </div>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterByStrategy} onValueChange={setFilterByStrategy}>
                <SelectTrigger data-testid="select-filter-strategy">
                  <SelectValue placeholder="Strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterByRisk} onValueChange={setFilterByRisk}>
                <SelectTrigger data-testid="select-filter-risk">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  {riskOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(searchQuery || filterByRisk !== "all" || filterByStrategy !== "all") && (
              <div className="flex items-center space-x-2 mt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setSearchQuery("")}
                    data-testid="button-clear-search"
                  >
                    Search: "{searchQuery}" ×
                  </Button>
                )}
                {filterByRisk !== "all" && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setFilterByRisk("all")}
                    data-testid="button-clear-risk-filter"
                  >
                    Risk: {filterByRisk} ×
                  </Button>
                )}
                {filterByStrategy !== "all" && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setFilterByStrategy("all")}
                    data-testid="button-clear-strategy-filter"
                  >
                    Strategy: {filterByStrategy} ×
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between" data-testid="section-results-summary">
          <div className="text-sm text-muted-foreground">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>All agents verified on 0G Network</span>
          </div>
        </div>

        {/* Agent Grid */}
        <section data-testid="section-agent-grid">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-secondary/50 border border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded"></div>
                      </div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-destructive/5 border border-destructive/20">
              <CardContent className="p-8 text-center">
                <div className="text-destructive mb-2">Failed to load agents</div>
                <div className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "An error occurred"}
                </div>
              </CardContent>
            </Card>
          ) : filteredAgents.length === 0 ? (
            <Card className="bg-card/50 border border-border">
              <CardContent className="p-12 text-center">
                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterByRisk !== "all" || filterByStrategy !== "all" 
                    ? "Try adjusting your search criteria or filters"
                    : "No trading agents are currently available"
                  }
                </p>
                {(searchQuery || filterByRisk !== "all" || filterByStrategy !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setFilterByRisk("all");
                      setFilterByStrategy("all");
                    }}
                    data-testid="button-clear-all-filters"
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onViewDetails={(agentId) => console.log("View agent details:", agentId)}
                  onInvest={(agentId) => console.log("Invest in agent:", agentId)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 0G Network Features */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border border-border" data-testid="section-0g-features">
          <CardContent className="p-8">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl font-bold">Powered by 0G Network</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                All trading agents on our marketplace leverage the 0G ecosystem for verifiable AI inference, 
                decentralized storage, and transparent performance tracking.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">0G Compute</h3>
                <p className="text-sm text-muted-foreground">
                  Verifiable AI inference with TEE security and cryptographic proof of computation
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold">0G Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Decentralized storage for trading logs, model data, and performance history
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-semibold">On-Chain Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  Transparent performance metrics with immutable scoring and PoRA mining
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-card border border-border" data-testid="section-cta">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Connect your wallet to invest in AI trading agents or create your own agent 
              using the 0G Network's powerful infrastructure.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/agents">
                <Button size="lg" data-testid="button-create-agent">
                  Create Your Agent
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" data-testid="button-view-dashboard">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
