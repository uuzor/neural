import { hashDecision, getTradingContract } from "./contracts.js";
import { runInference } from "./ogBroker.js";
import { storeObject } from "./ogStorage.js";

// Simple HTTP fetcher
async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

export type PricePoint = {
  chain: string;
  exchange: string;
  asset: string;
  bid: number; // highest buy
  ask: number; // lowest sell
  timestamp: number;
};

export type ArbitrageOpportunity = {
  asset: string;
  source: PricePoint; // buy from
  target: PricePoint; // sell to
  spread: number; // (target.bid - source.ask) / source.ask
  amount: number;
  expectedProfit: number; // net after slippage and fees (simulated)
  slippage: number;
  feesBps: number;
};

export type ExecuteArbInput = {
  agent: string;
  asset: string;
  amount: number;
  model: string;
  provider?: string;
  slippage?: number;
  feesBps?: number;
};

const DEFAULT_SLIPPAGE = 0.01; // 1%
const DEFAULT_FEES_BPS = 20; // 20 bps total assumed fees

// naive price collectors (replace with robust integrations later)
async function getEthUsdFromCoingecko(): Promise<number> {
  const data = await fetchJson("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
  return data?.ethereum?.usd ?? 0;
}

async function getBinanceTicker(symbol: string): Promise<{ bid: number; ask: number }> {
  const data = await fetchJson(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`);
  return { bid: Number(data.bidPrice), ask: Number(data.askPrice) };
}

async function getCoinbaseTicker(product: string): Promise<{ bid: number; ask: number }> {
  const data = await fetchJson(`https://api.exchange.coinbase.com/products/${product}/book?level=1`);
  return { bid: Number(data.bids?.[0]?.[0] || 0), ask: Number(data.asks?.[0]?.[0] || 0) };
}

// Simple cross-"chain/exchange" abstraction for an asset like ETH/USDC
export async function getPricesAcrossChains(asset: string): Promise<PricePoint[]> {
  const now = Date.now();
  const points: PricePoint[] = [];

  if (asset === "ETH/USDC" || asset === "ETHUSD") {
    // Binance uses ETHUSDT - close enough for MVP
    const bin = await getBinanceTicker("ETHUSDT");
    points.push({ chain: "bsc", exchange: "binance", asset, bid: bin.bid, ask: bin.ask, timestamp: now });

    // Coinbase uses ETH-USD
    const cb = await getCoinbaseTicker("ETH-USD");
    points.push({ chain: "ethereum", exchange: "coinbase", asset, bid: cb.bid, ask: cb.ask, timestamp: now });

    // Derive OG as a synthetic price with tiny variance (demo)
    const ethUsd = await getEthUsdFromCoingecko();
    const ogBid = ethUsd * 0.999;
    const ogAsk = ethUsd * 1.001;
    points.push({ chain: "og", exchange: "synthetic", asset, bid: ogBid, ask: ogAsk, timestamp: now });
  } else {
    // Fallback synthetic quotes for unknown pairs
    const price = 100;
    points.push({ chain: "og", exchange: "synthetic", asset, bid: price * 0.999, ask: price * 1.001, timestamp: now });
    points.push({ chain: "ethereum", exchange: "synthetic", asset, bid: price * 1.0, ask: price * 1.002, timestamp: now });
  }

  return points;
}

export async function findArbOpportunities(params: {
  asset: string;
  minSpread?: number; // e.g., 0.003 = 0.3%
  slippage?: number;
  feesBps?: number;
  amount?: number;
}): Promise<ArbitrageOpportunity[]> {
  const { asset, minSpread = 0.003, slippage = DEFAULT_SLIPPAGE, feesBps = DEFAULT_FEES_BPS, amount = 1 } = params;
  const prices = await getPricesAcrossChains(asset);
  const opps: ArbitrageOpportunity[] = [];

  for (let i = 0; i < prices.length; i++) {
    for (let j = 0; j < prices.length; j++) {
      if (i === j) continue;
      const source = prices[i];
      const target = prices[j];
      const spread = (target.bid - source.ask) / source.ask;
      if (spread <= minSpread) continue;

      // simulate net after slippage and fees
      const buyPrice = source.ask * (1 + slippage);
      const sellPrice = target.bid * (1 - slippage);
      const gross = (sellPrice - buyPrice) * amount;
      const fees = ((buyPrice + sellPrice) * amount) * (feesBps / 10000);
      const expectedProfit = gross - fees;

      if (expectedProfit > 0) {
        opps.push({
          asset,
          source,
          target,
          spread,
          amount,
          expectedProfit,
          slippage,
          feesBps
        });
      }
    }
  }

  // sort by expected profit desc
  opps.sort((a, b) => b.expectedProfit - a.expectedProfit);
  return opps;
}

export async function executeArb(input: ExecuteArbInput, opportunity?: ArbitrageOpportunity) {
  const { agent, asset, amount, model, provider, slippage = DEFAULT_SLIPPAGE, feesBps = DEFAULT_FEES_BPS } = input;

  // 1) If no precomputed opp provided, compute best
  const opp = opportunity || (await findArbOpportunities({ asset, amount, slippage, feesBps }))?.[0];
  if (!opp) throw new Error("No profitable opportunity found");

  // 2) Ask 0G model to validate/confirm execution (proof-enabled)
  const inference = await runInference({
    model,
    provider,
    generateProof: true,
    input: {
      task: "arbitrage-execution",
      asset,
      amount,
      source: { chain: opp.source.chain, exchange: opp.source.exchange, ask: opp.source.ask },
      target: { chain: opp.target.chain, exchange: opp.target.exchange, bid: opp.target.bid },
      spread: opp.spread,
      expectedProfit: opp.expectedProfit,
      slippage,
      feesBps,
      timestamp: Date.now()
    }
  });

  // 3) Build an execution plan envelope
  const plan = {
    type: "simulated-arbitrage",
    asset,
    amount,
    source: opp.source,
    target: opp.target,
    slippage,
    feesBps,
    modelHash: inference.modelHash,
    provider: inference.provider,
    requestId: inference.requestId,
    decision: inference.output,
    expectedProfit: opp.expectedProfit,
    timestamp: Date.now()
  };

  // 4) Persist plan to 0G storage
  const storageHash = await storeObject(plan);

  // 5) Compute hash for on-chain commit
  const aiDecisionHash = hashDecision({
    asset,
    amount,
    source: { chain: opp.source.chain, exchange: opp.source.exchange, ask: opp.source.ask },
    target: { chain: opp.target.chain, exchange: opp.target.exchange, bid: opp.target.bid },
    modelHash: inference.modelHash,
    requestId: inference.requestId,
    provider: inference.provider,
    storageHash,
    timestamp: plan.timestamp
  });

  // 6) Simulate settlement: commit to OG chain via executeTrade
  const trading = getTradingContract();
  const tx = await trading.executeTrade(
    agent,
    // using asset string as address placeholder in MVP; in real flow this should be ERC20 address on OG
    "0x0000000000000000000000000000000000000000",
    BigInt(Math.floor(amount * 1e6)), // arbitrary fixed-point for MVP
    BigInt(Math.floor(opp.source.ask * 1e6)), // buy price basis
    true, // isBuy at source
    aiDecisionHash,
    inference.proof || "0x"
  );
  const receipt = await tx.wait();

  return {
    storageHash,
    aiDecisionHash,
    txHash: receipt?.hash || tx.hash,
    opportunity: opp,
    plan
  };
}

// simple in-memory log of arbitrage operations for dashboard
const recentArbs: any[] = [];
export function recordArb(op: any) {
  recentArbs.unshift(op);
  if (recentArbs.length > 100) recentArbs.pop();
}
export function getRecentArbs() {
  return recentArbs;
}

let timer: any = null;
export function startArbScanner(config: { enabled: boolean; intervalMs?: number; assets?: string[]; agent?: string; model: string; provider?: string }) {
  if (!config.enabled) return;
  const interval = config.intervalMs ?? 15000;
  const assets = config.assets ?? ["ETH/USDC"];

  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    try {
      for (const asset of assets) {
        const opps = await findArbOpportunities({ asset, minSpread: 0.003, amount: 0.1 });
        if (opps.length === 0) continue;

        // take top
        const top = opps[0];
        if (config.agent) {
          const result = await executeArb({ agent: config.agent, asset, amount: top.amount, model: config.model, provider: config.provider });
          recordArb({ asset, result, at: Date.now() });
        } else {
          recordArb({ asset, top, at: Date.now() });
        }
      }
    } catch (e) {
      // swallow errors to keep scanner alive
      // eslint-disable-next-line no-console
      console.error("Arb scanner error:", (e as any)?.message || e);
    }
  }, interval);
}

export function stopArbScanner() {
  if (timer) clearInterval(timer);
  timer = null;
}