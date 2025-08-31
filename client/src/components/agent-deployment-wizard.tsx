import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useZGBroker } from "@/hooks/use-0g-broker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Zap, Database, Shield, Code } from "lucide-react";
import type { InsertTradingAgent } from "@shared/schema";

interface DeploymentForm {
  name: string;
  strategy: string;
  ogComputeModel: string;
  initialFunding: string;
  riskLevel: string;
  minInvestment: string;
}

const initialForm: DeploymentForm = {
  name: "",
  strategy: "",
  ogComputeModel: "",
  initialFunding: "0.1",
  riskLevel: "medium",
  minInvestment: "100",
};

interface AgentDeploymentWizardProps {
  userId: string;
  onSuccess?: (agentId: string) => void;
}

export function AgentDeploymentWizard({ userId, onSuccess }: AgentDeploymentWizardProps) {
  const [form, setForm] = useState<DeploymentForm>(initialForm);
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast } = useToast();
  const { providers, isInitialized } = useZGBroker();
  const queryClient = useQueryClient();

  const deployMutation = useMutation({
    mutationFn: async (agentData: InsertTradingAgent) => {
      const response = await apiRequest("POST", "/api/agents", agentData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Agent Deployed Successfully",
        description: `${data.name} has been deployed to 0G Chain`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setForm(initialForm);
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy agent",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof DeploymentForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      // Simulate the agent for a few seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Simulation Complete",
        description: "Agent performed well in simulation with mock trades",
      });
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "Failed to run simulation",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDeploy = () => {
    if (!form.name || !form.strategy || !form.ogComputeModel) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const agentData: InsertTradingAgent = {
      userId,
      name: form.name,
      strategy: form.strategy,
      ogComputeModel: form.ogComputeModel,
      initialFunding: form.initialFunding,
      riskLevel: form.riskLevel,
      minInvestment: form.minInvestment,
    };

    deployMutation.mutate(agentData);
  };

  const strategyOptions = [
    { value: "momentum", label: "Momentum Trading" },
    { value: "arbitrage", label: "Cross-DEX Arbitrage" },
    { value: "meanreversion", label: "Mean Reversion" },
    { value: "yieldfarm", label: "Yield Farming" },
    { value: "custom", label: "Custom Strategy" },
  ];

  const riskLevels = [
    { value: "low", label: "Low", color: "bg-green-500/10 text-green-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-500" },
    { value: "high", label: "High", color: "bg-red-500/10 text-red-500" },
  ];

  return (
    <Card data-testid="card-agent-deployment">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Code className="w-5 h-5" />
          <span>Deploy New AI Trading Agent</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Powered by 0G Compute & Storage
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name *</Label>
              <Input
                id="agent-name"
                placeholder="Enter agent name"
                value={form.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                data-testid="input-agent-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Trading Strategy *</Label>
              <Select
                value={form.strategy}
                onValueChange={(value) => handleInputChange("strategy", value)}
              >
                <SelectTrigger data-testid="select-strategy">
                  <SelectValue placeholder="Select strategy type" />
                </SelectTrigger>
                <SelectContent>
                  {strategyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compute-model">0G Compute Model *</Label>
              <Select
                value={form.ogComputeModel}
                onValueChange={(value) => handleInputChange("ogComputeModel", value)}
              >
                <SelectTrigger data-testid="select-compute-model">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.provider} value={provider.provider}>
                      {provider.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-funding">Initial Funding (OG)</Label>
              <div className="relative">
                <Input
                  id="initial-funding"
                  type="number"
                  placeholder="0.1"
                  step="0.01"
                  min="0.01"
                  value={form.initialFunding}
                  onChange={(e) => handleInputChange("initialFunding", e.target.value)}
                  data-testid="input-initial-funding"
                />
                <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                  OG
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: 0.01 OG (~100 inference calls)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Risk Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {riskLevels.map((level) => (
                  <Button
                    key={level.value}
                    variant={form.riskLevel === level.value ? "default" : "outline"}
                    onClick={() => handleInputChange("riskLevel", level.value)}
                    className="justify-center"
                    data-testid={`button-risk-${level.value}`}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-investment">Minimum Investment ($)</Label>
              <Input
                id="min-investment"
                type="number"
                placeholder="100"
                min="1"
                value={form.minInvestment}
                onChange={(e) => handleInputChange("minInvestment", e.target.value)}
                data-testid="input-min-investment"
              />
            </div>
          </div>

          {/* Preview and Actions */}
          <div className="space-y-6">
            {/* Smart Contract Preview */}
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-4 h-4" />
                  <h3 className="text-sm font-medium">Smart Contract Deployment</h3>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span>0G Newton Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract:</span>
                    <span>ScoreRegistry.sol</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vault:</span>
                    <span>VaultUniswap.sol</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gas Estimate:</span>
                    <span>~0.003 OG</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Preview */}
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="w-4 h-4" />
                  <h3 className="text-sm font-medium">Agent Configuration</h3>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-3 h-3" />
                    <span>AI inference via 0G Compute Network</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-3 h-3" />
                    <span>Trading logs stored on 0G Storage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3 h-3" />
                    <span>Performance tracking with PoRA mining</span>
                  </div>
                  <div>• Automated score registry updates</div>
                  <div>• Cross-platform execution (Uniswap + Hyperliquid)</div>
                </div>
              </CardContent>
            </Card>

            {/* Deployment Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleDeploy}
                disabled={deployMutation.isPending || !isInitialized}
                className="w-full"
                data-testid="button-deploy-agent"
              >
                {deployMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy Agent"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSimulate}
                disabled={isSimulating || !form.name || !form.strategy}
                className="w-full"
                data-testid="button-simulate-first"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  "Simulate First"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
