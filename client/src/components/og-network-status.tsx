import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Zap, Database, Layers, Check, AlertCircle } from "lucide-react";

interface NetworkStatus {
  id: string;
  computeNetworkStatus: string;
  storageNetworkStatus: string;
  daLayerStatus: string;
  lastSyncAt: string;
}

export function OGNetworkStatus() {
  const { data: networkStatus, isLoading, refetch } = useQuery<NetworkStatus>({
    queryKey: ["/api/network/status"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Check className="w-3 h-3" />;
      case "offline":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success/10 text-success";
      case "offline":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-warning/10 text-warning";
    }
  };

  const services = [
    {
      name: "Compute Network",
      status: networkStatus?.computeNetworkStatus || "offline",
      icon: Zap,
      description: "AI inference services",
    },
    {
      name: "Storage Network", 
      status: networkStatus?.storageNetworkStatus || "offline",
      icon: Database,
      description: "Decentralized data storage",
    },
    {
      name: "DA Layer",
      status: networkStatus?.daLayerStatus || "offline", 
      icon: Layers,
      description: "Data availability",
    },
  ];

  return (
    <Card data-testid="card-og-network-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold" data-testid="title-network-status">
            0G Network Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between"
                data-testid={`service-${service.name.toLowerCase().replace(' ', '-')}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted/20 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm" data-testid={`text-service-name-${service.name}`}>
                      {service.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.description}
                    </div>
                  </div>
                </div>
                <Badge 
                  className={`${getStatusColor(service.status)} flex items-center space-x-1`}
                  data-testid={`badge-status-${service.name.toLowerCase().replace(' ', '-')}`}
                >
                  {getStatusIcon(service.status)}
                  <span className="capitalize">{service.status}</span>
                </Badge>
              </div>
            );
          })}
          
          {networkStatus && (
            <div className="pt-4 border-t border-border">
              <div 
                className="text-xs text-muted-foreground"
                data-testid="text-last-sync"
              >
                Last sync: {new Date(networkStatus.lastSyncAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
