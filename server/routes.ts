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

  // 0G Compute integration routes
  app.post("/api/0g/compute/inference", async (req, res) => {
    try {
      const { provider, prompt, model } = req.body;
      
      // This would integrate with actual 0G Compute SDK
      // For now, return a mock response
      const mockResponse = {
        requestId: `req-${Date.now()}`,
        provider,
        model,
        response: "Market analysis suggests bullish momentum for ETH/USDC pair based on technical indicators.",
        timestamp: new Date().toISOString(),
        cost: "0.001",
        verified: true
      };
      
      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to process inference", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/0g/compute/providers", async (req, res) => {
    try {
      // Mock 0G Compute providers based on documentation
      const providers = [
        {
          provider: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
          model: "llama-3.3-70b-instruct",
          serviceType: "LLM",
          inputPrice: "100000000000000", // 0.0001 OG per request
          outputPrice: "200000000000000", // 0.0002 OG per response
          verifiability: "TeeML",
          status: "online"
        },
        {
          provider: "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
          model: "deepseek-r1-70b",
          serviceType: "LLM",
          inputPrice: "150000000000000", // 0.00015 OG per request
          outputPrice: "300000000000000", // 0.0003 OG per response
          verifiability: "TeeML",
          status: "online"
        }
      ];
      
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get providers", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // 0G Storage integration routes
  app.post("/api/0g/storage/upload", async (req, res) => {
    try {
      const { data, filename } = req.body;
      
      // Mock storage upload - would use actual 0G Storage SDK
      const mockUpload = {
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        filename,
        size: JSON.stringify(data).length,
        timestamp: new Date().toISOString(),
        verified: true
      };
      
      res.json(mockUpload);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload to storage", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/0g/storage/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      
      // Mock storage retrieval
      const mockData = {
        hash,
        data: { tradingDecision: "BUY", confidence: 0.87, timestamp: new Date().toISOString() },
        retrievedAt: new Date().toISOString()
      };
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve from storage", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
