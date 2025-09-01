import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTradingAgentSchema, 
  insertTradingSessionSchema,
  insertTradingLogSchema,
  insertInvestmentAllocationSchema 
} from "@shared/schema";
import { hashDecision } from "./services/contracts.js";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const portfolio = await storage.getPortfolioByUser(userId);
      
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to get portfolio", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Trading Agent routes
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllTradingAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agents", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/agents/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const agents = await storage.getTradingAgentsByUser(userId);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user agents", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await storage.getTradingAgent(id);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const agentData = insertTradingAgentSchema.parse(req.body);
      const agent = await storage.createTradingAgent(agentData);
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create agent", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const agent = await storage.updateTradingAgent(id, updates);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update agent", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Trading Session routes
  app.get("/api/sessions/active", async (req, res) => {
    try {
      const sessions = await storage.getActiveTradingSessions();
      
      // Enrich sessions with agent data
      const enrichedSessions = await Promise.all(
        sessions.map(async (session) => {
          const agent = await storage.getTradingAgent(session.agentId);
          return {
            ...session,
            agent: agent ? {
              name: agent.name,
              initials: agent.name.split(' ').map(n => n[0]).join(''),
              id: agent.contractAddress,
            } : null
          };
        })
      );
      
      res.json(enrichedSessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active sessions", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/sessions/agent/:agentId", async (req, res) => {
    try {
      const { agentId } = req.params;
      const sessions = await storage.getTradingSessionsByAgent(agentId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent sessions", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertTradingSessionSchema.parse(req.body);
      const session = await storage.createTradingSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const session = await storage.updateTradingSession(id, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // 0G Network Status routes
  app.get("/api/network/status", async (req, res) => {
    try {
      const status = await storage.getNetworkStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get network status", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/network/status", async (req, res) => {
    try {
      const updates = req.body;
      const status = await storage.updateNetworkStatus(updates);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to update network status", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Trading Log routes
  app.get("/api/logs/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const logs = await storage.getTradingLogsBySession(sessionId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session logs", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const logData = insertTradingLogSchema.parse(req.body);
      const log = await storage.createTradingLog(logData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create log", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Investment routes
  app.get("/api/investments/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const investments = await storage.getInvestmentsByUser(userId);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get investments", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/investments", async (req, res) => {
    try {
      const investmentData = insertInvestmentAllocationSchema.parse(req.body);
      const investment = await storage.createInvestment(investmentData);
      res.status(201).json(investment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create investment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // 0G Compute integration routes (real broker)
  app.post("/api/0g/compute/inference", async (req, res) => {
    try {
      const { provider, input, model, maxTokens, temperature, generateProof } = req.body;
      const { runInference } = await import("./services/ogBroker.js");
      const result = await runInference({
        provider,
        input,
        model,
        maxTokens,
        temperature,
        generateProof
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to process inference", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/0g/compute/providers", async (_req, res) => {
    try {
      const { getProviders } = await import("./services/ogBroker.js");
      const providers = await getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get providers", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // 0G Storage integration routes (real indexer/storage)
  app.post("/api/0g/storage/upload", async (req, res) => {
    try {
      const { data } = req.body;
      const { storeObject } = await import("./services/ogStorage.js");
      const hash = await storeObject(data);
      res.json({ hash, verified: true, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload to storage", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // retrieval via indexer is app-specific; provide a placeholder acknowledging persistence by hash
  app.get("/api/0g/storage/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      res.json({ hash, note: "Data retrievable via 0G indexer client; implement query based on your indexing strategy." });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve from storage", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Arbitrage endpoints
  app.get("/api/arbitrage/find", async (req, res) => {
    try {
      const asset = (req.query.asset as string) || "ETH/USDC";
      const minSpread = req.query.minSpread ? Number(req.query.minSpread) : undefined;
      const amount = req.query.amount ? Number(req.query.amount) : undefined;
      const { findArbOpportunities } = await import("./services/arbitrage.js");
      const opps = await findArbOpportunities({ asset, minSpread, amount });
      res.json(opps);
    } catch (error) {
      res.status(500).json({ message: "Failed to find arbitrage opportunities", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/arbitrage/execute", async (req, res) => {
    try {
      const { agent, asset, amount, model, provider } = req.body as { agent: string; asset: string; amount: number; model: string; provider?: string };
      const { executeArb, recordArb } = await import("./services/arbitrage.js");
      const result = await executeArb({ agent, asset, amount, model, provider });
      recordArb({ asset, result, at: Date.now() });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to execute arbitrage", error: error?.message || "Unknown error" });
    }
  });

  app.get("/api/arbitrage/recent", async (_req, res) => {
    try {
      const { getRecentArbs } = await import("./services/arbitrage.js");
      res.json(getRecentArbs());
    } catch (error) {
      res.status(500).json({ message: "Failed to load recent arbitrage ops", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // On-chain trade execution with 0G proof persistence
  app.post("/api/trades", async (req, res) => {
    try {
      const { agent, asset, amount, price, isBuy, decisionPayload, provider, model } = req.body;

      // 1) Request inference (if client didn't provide proof yet)
      const { runInference } = await import("./services/ogBroker.js");
      const inference = await runInference({
        model,
        provider,
        input: decisionPayload?.input ?? {},
        generateProof: true
      });

      // 2) Compute aiDecisionHash over normalized envelope
      const envelope = {
        action: inference.output?.action,
        asset,
        amount,
        price,
        confidence: inference.output?.confidence,
        modelHash: inference.modelHash,
        requestId: inference.requestId,
        provider: inference.provider,
        timestamp: Date.now()
      };
      const aiDecisionHash = hashDecision(envelope);

      // 3) Persist full inference payload to 0G storage
      const { storeObject } = await import("./services/ogStorage.js");
      const storageHash = await storeObject({
        agent,
        asset,
        amount,
        price,
        isBuy,
        envelope,
        proof: inference.proof,
        rawOutput: inference.output
      });

      // 4) Submit on-chain executeTrade
      const { getTradingContract } = await import("./services/contracts.js");
      const trading = getTradingContract();
      const tx = await trading.executeTrade(
        agent,
        asset,
        amount,
        price,
        isBuy,
        aiDecisionHash,
        inference.proof || "0x"
      );
      const receipt = await tx.wait();

      res.json({
        success: true,
        storageHash,
        aiDecisionHash,
        txHash: receipt?.hash || tx.hash,
        requestId: inference.requestId,
        provider: inference.provider
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to execute trade", error: error?.message || "Unknown error" });
    }
  });

  // Admin endpoints for alignment nodes and violations
  app.post("/api/admin/alignment-node", async (req, res) => {
    try {
      const { node, allowed } = req.body as { node: string; allowed: boolean };
      const { getTradingContract } = await import("./services/contracts.js");
      const trading = getTradingContract();
      const tx = await trading.setAlignmentNode(node, !!allowed);
      await tx.wait();
      res.json({ success: true, node, allowed: !!allowed });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update alignment node", error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/alignment/report", async (req, res) => {
    try {
      const { agent, severityScore, evidence } = req.body as { agent: string; severityScore: number; evidence: any };
      const { getTradingContract } = await import("./services/contracts.js");
      const trading = getTradingContract();
      const evidenceBytes = Buffer.from(JSON.stringify(evidence || {}));
      const tx = await trading.reportAlignmentViolation(agent, evidenceBytes, severityScore);
      await tx.wait();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to report alignment violation", error: error?.message || "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
