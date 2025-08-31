import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { TradingSession } from "@shared/schema";

interface EnrichedTradingSession extends TradingSession {
  agent?: {
    name: string;
    initials: string;
    id: string;
  };
}

interface TradingSessionRowProps {
  session: EnrichedTradingSession;
  onViewDetails?: (sessionId: string) => void;
}

export function TradingSessionRow({ session, onViewDetails }: TradingSessionRowProps) {
  const pnlValue = parseFloat(session.pnl || "0");
  const isPositive = pnlValue >= 0;

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    monitoring: "bg-warning/10 text-warning",
    closed: "bg-muted/10 text-muted-foreground",
  };

  return (
    <tr 
      className="border-b border-border hover:bg-muted/20 transition-colors"
      data-testid={`row-session-${session.id}`}
    >
      <td className="py-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span 
              className="text-xs font-medium"
              data-testid={`text-agent-initials-${session.id}`}
            >
              {session.agent?.initials || "AI"}
            </span>
          </div>
          <div>
            <div 
              className="font-medium text-sm"
              data-testid={`text-agent-name-${session.id}`}
            >
              {session.agent?.name || "Unknown Agent"}
            </div>
            <div 
              className="text-xs text-muted-foreground font-mono"
              data-testid={`text-agent-id-${session.id}`}
            >
              {session.agent?.id || session.agentId}
            </div>
          </div>
        </div>
      </td>
      <td 
        className="py-4 px-4 text-sm"
        data-testid={`text-platform-${session.id}`}
      >
        {session.platform}
      </td>
      <td 
        className="py-4 px-4 text-sm"
        data-testid={`text-position-${session.id}`}
      >
        {session.position}
      </td>
      <td className="py-4 px-4 text-sm">
        <span 
          className={`font-medium flex items-center space-x-1 ${
            isPositive ? "text-success" : "text-destructive"
          }`}
          data-testid={`text-pnl-${session.id}`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{isPositive ? "+" : ""}${pnlValue.toFixed(2)}</span>
        </span>
      </td>
      <td className="py-4 px-4">
        <Badge 
          className={`${statusColors[session.status]} flex items-center space-x-1`}
          data-testid={`badge-status-${session.id}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${
            session.status === 'active' ? 'bg-success' :
            session.status === 'monitoring' ? 'bg-warning' : 'bg-muted-foreground'
          }`} />
          <span className="capitalize">{session.status}</span>
        </Badge>
      </td>
      <td className="py-4 px-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails?.(session.id)}
          data-testid={`button-view-session-${session.id}`}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

interface TradingSessionsTableProps {
  sessions: EnrichedTradingSession[];
  onViewDetails?: (sessionId: string) => void;
  onRefresh?: () => void;
}

export function TradingSessionsTable({ sessions, onViewDetails, onRefresh }: TradingSessionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="table-trading-sessions">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Agent
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Platform
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Position
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              PnL
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                <div className="flex flex-col items-center space-y-2">
                  <Activity className="w-8 h-8" />
                  <p>No active trading sessions</p>
                  <Button variant="outline" size="sm" onClick={onRefresh}>
                    Refresh
                  </Button>
                </div>
              </td>
            </tr>
          ) : (
            sessions.map((session) => (
              <TradingSessionRow
                key={session.id}
                session={session}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
