import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity } from "lucide-react";

interface PerformanceChartProps {
  timeframe?: "24H" | "7D" | "30D";
  onTimeframeChange?: (timeframe: "24H" | "7D" | "30D") => void;
}

export function PerformanceChart({ timeframe = "24H", onTimeframeChange }: PerformanceChartProps) {
  // Mock chart data - in a real app, this would come from actual trading data
  const mockDataPoints = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    }),
    value: 12000 + Math.random() * 2000 - 1000 + (i * 30), // Trending upward
  }));

  return (
    <Card className="lg:col-span-2" data-testid="card-performance-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold" data-testid="title-portfolio-performance">
            Portfolio Performance
          </CardTitle>
          <div className="flex items-center space-x-2">
            {(["24H", "7D", "30D"] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                onClick={() => onTimeframeChange?.(tf)}
                data-testid={`button-timeframe-${tf}`}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gradient-to-r from-background/50 to-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Gradient background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-success/10 to-primary/10 opacity-50" />
          
          {/* Mock chart visualization */}
          <div className="absolute inset-4 flex items-end justify-between">
            {mockDataPoints.map((point, index) => (
              <div
                key={index}
                className="bg-primary/30 rounded-t"
                style={{
                  height: `${Math.max(10, (point.value - 11000) / 2000 * 200)}px`,
                  width: '3px',
                }}
                data-testid={`chart-bar-${index}`}
              />
            ))}
          </div>
          
          {/* Chart overlay content */}
          <div className="relative z-10 text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 text-success">
              <TrendingUp className="w-8 h-8" />
              <div className="text-2xl font-bold">+12.4%</div>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">
                Real-time performance visualization
              </p>
              <p className="text-xs text-muted-foreground">
                Data from 0G Storage & Compute Network
              </p>
            </div>
          </div>
        </div>
        
        {/* Performance metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-success" data-testid="metric-total-return">
              +24.7%
            </div>
            <div className="text-xs text-muted-foreground">Total Return</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold" data-testid="metric-sharpe-ratio">
              2.34
            </div>
            <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-destructive" data-testid="metric-max-drawdown">
              -8.2%
            </div>
            <div className="text-xs text-muted-foreground">Max Drawdown</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold" data-testid="metric-win-rate">
              73%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
