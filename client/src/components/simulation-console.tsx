import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useZGBroker } from "@/hooks/use-0g-broker";
import { 
  Play, 
  Square, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3
} from "lucide-react";

interface SimulationLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  amount: string;
  status: "success" | "pending" | "analyzing";
}

interface SimulationSettings {
  marketConditions: string;
  simulationSpeed: string;
  virtualCapital: string;
}

export function SimulationConsole() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [settings, setSettings] = useState<SimulationSettings>({
    marketConditions: "normal",
    simulationSpeed: "1x",
    virtualCapital: "10000",
  });

  const { toast } = useToast();
  const { requestInference, uploadToStorage } = useZGBroker();

  // Simulate trading activity
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const agents = ["AlphaTrend Pro", "DeepSeek Arbitrage", "Llama DeFi Scout"];
      const actions = ["BUY ETH/USDC", "SELL BTC/USDT", "ANALYZING", "ADD LIQUIDITY"];
      const amounts = ["$500.00", "$1,200.00", "$800.00", "$300.00"];

      const newLog: SimulationLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        agent: agents[Math.floor(Math.random() * agents.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        status: Math.random() > 0.7 ? "analyzing" : Math.random() > 0.5 ? "pending" : "success",
      };

      setLogs(prev => [newLog, ...prev.slice(0, 9)]); // Keep last 10 logs
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const startSimulation = async () => {
    try {
      setIsRunning(true);
      toast({
        title: "Simulation Started",
        description: "Running AI trading simulation with 0G Compute",
      });

      // Simulate an AI inference request
      if (requestInference) {
        await requestInference({
          provider: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
          prompt: "Analyze current market conditions for ETH/USDC trading pair",
          model: "llama-3.3-70b-instruct",
        });
      }
    } catch (error) {
      console.error("Failed to start simulation:", error);
      setIsRunning(false);
    }
  };

  const stopSimulation = () => {
    setIsRunning(false);
    toast({
      title: "Simulation Stopped",
      description: "All trading simulations have been stopped",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <TrendingUp className="w-3 h-3 text-success" />;
      case "pending":
        return <Clock className="w-3 h-3 text-warning" />;
      case "analyzing":
        return <Activity className="w-3 h-3 text-primary" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-success";
      case "pending":
        return "text-warning";
      case "analyzing":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card data-testid="card-simulation-console">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Trading Simulation Console</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Button
              onClick={startSimulation}
              disabled={isRunning}
              className="bg-success hover:bg-success/90"
              data-testid="button-start-simulation"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Simulation
            </Button>
            <Button
              onClick={stopSimulation}
              disabled={!isRunning}
              variant="destructive"
              data-testid="button-stop-simulation"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation Controls */}
          <div className="space-y-4">
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Simulation Settings</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Market Conditions</Label>
                    <Select
                      value={settings.marketConditions}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, marketConditions: value }))
                      }
                    >
                      <SelectTrigger className="h-8" data-testid="select-market-conditions">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal Volatility</SelectItem>
                        <SelectItem value="high">High Volatility</SelectItem>
                        <SelectItem value="bull">Bull Market</SelectItem>
                        <SelectItem value="bear">Bear Market</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Simulation Speed</Label>
                    <Select
                      value={settings.simulationSpeed}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, simulationSpeed: value }))
                      }
                    >
                      <SelectTrigger className="h-8" data-testid="select-simulation-speed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1x">1x Real-time</SelectItem>
                        <SelectItem value="10x">10x Accelerated</SelectItem>
                        <SelectItem value="100x">100x Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Virtual Capital</Label>
                    <Input
                      type="number"
                      value={settings.virtualCapital}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, virtualCapital: e.target.value }))
                      }
                      className="h-8"
                      data-testid="input-virtual-capital"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulation Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-secondary/30">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-success" data-testid="stat-total-pnl">
                    +$1,247
                  </div>
                  <div className="text-xs text-muted-foreground">Total PnL</div>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold" data-testid="stat-trades-count">
                    {logs.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Live Trading Feed */}
          <div className="lg:col-span-2">
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Live Trading Feed</h3>
                  {isRunning && (
                    <Badge className="bg-success/10 text-success flex items-center space-x-1">
                      <Activity className="w-3 h-3 animate-pulse" />
                      <span>Running</span>
                    </Badge>
                  )}
                </div>
                <div className="h-48 overflow-y-auto space-y-2 text-xs">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center space-y-2">
                        <Activity className="w-8 h-8 mx-auto" />
                        <p>Start simulation to see trading activity</p>
                      </div>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between py-2 px-3 bg-card rounded border border-border hover:bg-muted/20 transition-colors"
                        data-testid={`log-entry-${log.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(log.status)}
                          <span className="font-medium" data-testid={`log-timestamp-${log.id}`}>
                            {log.timestamp}
                          </span>
                          <span data-testid={`log-agent-${log.id}`}>
                            {log.agent}
                          </span>
                        </div>
                        <div className="text-right">
                          <div 
                            className={`font-medium ${getStatusColor(log.status)}`}
                            data-testid={`log-action-${log.id}`}
                          >
                            {log.action}
                          </div>
                          {log.amount && (
                            <div 
                              className="text-muted-foreground"
                              data-testid={`log-amount-${log.id}`}
                            >
                              {log.amount}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
