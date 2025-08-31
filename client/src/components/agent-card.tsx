import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { TradingAgent } from "@shared/schema";

interface AgentCardProps {
  agent: TradingAgent;
  onInvest?: (agentId: string) => void;
  onViewDetails?: (agentId: string) => void;
}

export function AgentCard({ agent, onInvest, onViewDetails }: AgentCardProps) {
  const isPositive = parseFloat(agent.totalReturn || "0") > 0;
  const strategyLabels: Record<string, string> = {
    momentum: "Momentum & Mean Reversion",
    arbitrage: "Cross-DEX Arbitrage", 
    meanreversion: "Mean Reversion",
    yieldfarm: "Yield Farming & LP",
    custom: "Custom Strategy",
  };

  const riskColors: Record<string, string> = {
    low: "bg-green-500/10 text-green-500",
    medium: "bg-yellow-500/10 text-yellow-500", 
    high: "bg-red-500/10 text-red-500",
  };

  return (
    <Card 
      className="bg-secondary/50 border border-border hover:border-primary/30 transition-colors cursor-pointer group"
      data-testid={`card-agent-${agent.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 
              className="font-semibold group-hover:text-primary transition-colors"
              data-testid={`text-agent-name-${agent.id}`}
            >
              {agent.name}
            </h3>
            <p 
              className="text-sm text-muted-foreground"
              data-testid={`text-agent-strategy-${agent.id}`}
            >
              {strategyLabels[agent.strategy] || agent.strategy}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-warning fill-current" />
              <span 
                className="text-sm font-medium"
                data-testid={`text-agent-rating-${agent.id}`}
              >
                {agent.rating}
              </span>
            </div>
            <Badge 
              className={riskColors[agent.riskLevel]}
              data-testid={`badge-risk-level-${agent.id}`}
            >
              {agent.riskLevel}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">30D Return</span>
            <span 
              className={`font-medium flex items-center space-x-1 ${
                isPositive ? "text-success" : "text-destructive"
              }`}
              data-testid={`text-agent-return-${agent.id}`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>+{agent.totalReturn}%</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sharpe Ratio</span>
            <span 
              className="font-medium"
              data-testid={`text-agent-sharpe-${agent.id}`}
            >
              {agent.sharpeRatio}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Max Drawdown</span>
            <span 
              className="text-destructive font-medium"
              data-testid={`text-agent-drawdown-${agent.id}`}
            >
              {agent.maxDrawdown}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AUM</span>
            <span 
              className="font-medium"
              data-testid={`text-agent-aum-${agent.id}`}
            >
              ${parseFloat(agent.aum || "0").toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Min: <span 
              className="text-foreground font-medium"
              data-testid={`text-min-investment-${agent.id}`}
            >
              ${agent.minInvestment}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {agent.isActive && (
              <div className="flex items-center space-x-1 text-xs text-success">
                <Activity className="w-3 h-3" />
                <span>Active</span>
              </div>
            )}
            <Button 
              size="sm"
              onClick={() => onViewDetails?.(agent.id)}
              variant="outline"
              data-testid={`button-view-details-${agent.id}`}
            >
              View
            </Button>
            <Button 
              size="sm"
              onClick={() => onInvest?.(agent.id)}
              data-testid={`button-invest-${agent.id}`}
            >
              Invest
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
