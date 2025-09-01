import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, RefreshCcw, ShieldCheck, Database, Link as LinkIcon, Hash, Activity } from "lucide-react";

type RecentArb = {
  asset: string;
  result?: {
    storageHash: string;
    aiDecisionHash: string;
    txHash: string;
    opportunity: {
      expectedProfit: number;
      spread: number;
      amount: number;
      source: { chain: string; exchange: string; ask: number };
      target: { chain: string; exchange: string; bid: number };
    }
  };
  top?: any;
  at: number;
};

function HashLink({ hash, prefix }: { hash: string; prefix?: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      {prefix ? <span className="text-muted-foreground">{prefix}:</span> : null}
      <span className="truncate">{hash}</span>
      <Button variant="ghost" size="icon" asChild>
        <a href="#" onClick={(e) => e.preventDefault()}>
          <LinkIcon className="w-4 h-4" />
        </a>
      </Button>
    </div>
  );
}

export function ArbDashboard() {
  const [data, setData] = useState<RecentArb[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterAsset, setFilterAsset] = useState("ETH/USDC");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/arbitrage/recent");
      const json = await res.json();
      setData(json || []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => load(), 8000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((x) => !filterAsset || x.asset?.toLowerCase().includes(filterAsset.toLowerCase()));
  }, [data, filterAsset]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Arbitrage Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Real-time, verifiable arbitrage operations with OG storage and on-chain settlement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)} className="w-40" placeholder="Filter asset" />
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Decisions (24h)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">{filtered.length}</div>
            <Activity className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Spread</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">
              {filtered.length ? (filtered.reduce((s, x) => s + (x.result?.opportunity?.spread || 0), 0) / filtered.length * 100).toFixed(2) : "0.00"}%
            </div>
            <ArrowUpRight className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Profit</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">
              ${filtered.length ? (filtered.reduce((s, x) => s + (x.result?.opportunity?.expectedProfit || 0), 0) / filtered.length).toFixed(2) : "0.00"}
            </div>
            <Badge variant="secondary">Simulated</Badge>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">OG Storage</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">{filtered.filter((x) => x.result?.storageHash).length}</div>
            <Database className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card className="bg-card/60 backdrop-blur border-border">
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Spread</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Hashes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No recent operations
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((row, i) => {
                      const r = row.result;
                      return (
                        <TableRow key={i} className="hover:bg-secondary/30">
                          <TableCell className="whitespace-nowrap">
                            {new Date(row.at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>{row.asset}</TableCell>
                          <TableCell className="text-xs">
                            {r ? `${r.opportunity.source.exchange}@${r.opportunity.source.chain} $${r.opportunity.source.ask.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r ? `${r.opportunity.target.exchange}@${r.opportunity.target.chain} $${r.opportunity.target.bid.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell>
                            {r ? `${(r.opportunity.spread * 100).toFixed(2)}%` : "—"}
                          </TableCell>
                          <TableCell>${r ? r.opportunity.expectedProfit.toFixed(2) : "—"}</TableCell>
                          <TableCell className="space-y-1">
                            {r ? (
                              <TooltipProvider>
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="font-mono text-[10px]">
                                        <Hash className="w-3 h-3 mr-1" />
                                        aiDecision
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                      <HashLink hash={r.aiDecisionHash} />
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="font-mono text-[10px]">
                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                        tx
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                      <HashLink hash={r.txHash} />
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="font-mono text-[10px]">
                                        <Database className="w-3 h-3 mr-1" />
                                        storage
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                      <HashLink hash={r.storageHash} />
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Data auto-refresh is {autoRefresh ? "enabled" : "disabled"}.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setAutoRefresh((v) => !v)}>
            {autoRefresh ? "Disable Auto-Refresh" : "Enable Auto-Refresh"}
          </Button>
        </div>
      </div>
    </div>
  );
}