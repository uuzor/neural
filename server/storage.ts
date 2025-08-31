import { 
  type User, 
  type InsertUser, 
  type TradingAgent, 
  type InsertTradingAgent,
  type TradingSession,
  type InsertTradingSession,
  type Portfolio,
  type InsertPortfolio,
  type OgNetworkStatus,
  type TradingLog,
  type InsertTradingLog,
  type InvestmentAllocation,
  type InsertInvestmentAllocation
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trading Agents
  getTradingAgent(id: string): Promise<TradingAgent | undefined>;
  getTradingAgentsByUser(userId: string): Promise<TradingAgent[]>;
  getAllTradingAgents(): Promise<TradingAgent[]>;
  createTradingAgent(agent: InsertTradingAgent): Promise<TradingAgent>;
  updateTradingAgent(id: string, updates: Partial<TradingAgent>): Promise<TradingAgent | undefined>;

  // Trading Sessions
  getTradingSession(id: string): Promise<TradingSession | undefined>;
  getActiveTradingSessions(): Promise<TradingSession[]>;
  getTradingSessionsByAgent(agentId: string): Promise<TradingSession[]>;
  createTradingSession(session: InsertTradingSession): Promise<TradingSession>;
  updateTradingSession(id: string, updates: Partial<TradingSession>): Promise<TradingSession | undefined>;

  // Portfolios
  getPortfolioByUser(userId: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined>;

  // Network Status
  getNetworkStatus(): Promise<OgNetworkStatus | undefined>;
  updateNetworkStatus(updates: Partial<OgNetworkStatus>): Promise<OgNetworkStatus>;

  // Trading Logs
  getTradingLogsBySession(sessionId: string): Promise<TradingLog[]>;
  createTradingLog(log: InsertTradingLog): Promise<TradingLog>;

  // Investments
  getInvestmentsByUser(userId: string): Promise<InvestmentAllocation[]>;
  createInvestment(investment: InsertInvestmentAllocation): Promise<InvestmentAllocation>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private tradingAgents: Map<string, TradingAgent> = new Map();
  private tradingSessions: Map<string, TradingSession> = new Map();
  private portfolios: Map<string, Portfolio> = new Map();
  private networkStatus: OgNetworkStatus;
  private tradingLogs: Map<string, TradingLog> = new Map();
  private investmentAllocations: Map<string, InvestmentAllocation> = new Map();

  constructor() {
    // Initialize with default network status
    this.networkStatus = {
      id: randomUUID(),
      computeNetworkStatus: "online",
      storageNetworkStatus: "online",
      daLayerStatus: "online",
      lastSyncAt: new Date(),
    };

    // Seed some sample data
    this.seedData();
  }

  private seedData() {
    // Create sample user
    const sampleUser: User = {
      id: "user-1",
      walletAddress: "0x1234567890123456789012345678901234567890",
      username: "demo_user",
      createdAt: new Date(),
    };
    this.users.set(sampleUser.id, sampleUser);

    // Create sample portfolio
    const samplePortfolio: Portfolio = {
      id: "portfolio-1",
      userId: sampleUser.id,
      totalValue: "12847.32",
      dailyPnl: "347.82",
      ogBalance: "0.847",
      activeAgentsCount: 3,
      updatedAt: new Date(),
    };
    this.portfolios.set(sampleUser.id, samplePortfolio);

    // Create sample trading agents
    const sampleAgents: TradingAgent[] = [
      {
        id: "agent-1",
        userId: sampleUser.id,
        name: "AlphaTrend Pro",
        strategy: "momentum",
        ogComputeModel: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
        contractAddress: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
        initialFunding: "1.0",
        riskLevel: "medium",
        isActive: true,
        performanceScore: "8.7",
        totalReturn: "24.7",
        sharpeRatio: "2.34",
        maxDrawdown: "-8.2",
        aum: "2300000",
        minInvestment: "100",
        rating: "4.8",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "agent-2",
        userId: sampleUser.id,
        name: "DeepSeek Arbitrage",
        strategy: "arbitrage",
        ogComputeModel: "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
        contractAddress: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
        initialFunding: "0.8",
        riskLevel: "low",
        isActive: true,
        performanceScore: "7.9",
        totalReturn: "18.3",
        sharpeRatio: "1.87",
        maxDrawdown: "-5.1",
        aum: "1800000",
        minInvestment: "50",
        rating: "4.6",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "agent-3",
        userId: sampleUser.id,
        name: "Llama DeFi Scout",
        strategy: "yieldfarm",
        ogComputeModel: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
        contractAddress: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
        initialFunding: "0.5",
        riskLevel: "high",
        isActive: true,
        performanceScore: "6.8",
        totalReturn: "15.9",
        sharpeRatio: "1.56",
        maxDrawdown: "-12.4",
        aum: "892000",
        minInvestment: "25",
        rating: "4.2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleAgents.forEach(agent => {
      this.tradingAgents.set(agent.id, agent);
    });

    // Create sample trading sessions
    const sampleSessions: TradingSession[] = [
      {
        id: "session-1",
        agentId: "agent-1",
        platform: "Uniswap V3",
        position: "ETH/USDC Long",
        entryPrice: "2450.00",
        currentPrice: "2497.45",
        pnl: "127.45",
        status: "active",
        ogStorageHash: "0x7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
        ogComputeRequestId: "req-1234",
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        endedAt: null,
      },
      {
        id: "session-2",
        agentId: "agent-2",
        platform: "Hyperliquid",
        position: "BTC/USDT Short",
        entryPrice: "42000.00",
        currentPrice: "41956.79",
        pnl: "-43.21",
        status: "monitoring",
        ogStorageHash: "0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
        ogComputeRequestId: "req-1235",
        startedAt: new Date(Date.now() - 7200000), // 2 hours ago
        endedAt: null,
      },
    ];

    sampleSessions.forEach(session => {
      this.tradingSessions.set(session.id, session);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Trading Agent methods
  async getTradingAgent(id: string): Promise<TradingAgent | undefined> {
    return this.tradingAgents.get(id);
  }

  async getTradingAgentsByUser(userId: string): Promise<TradingAgent[]> {
    return Array.from(this.tradingAgents.values()).filter(agent => agent.userId === userId);
  }

  async getAllTradingAgents(): Promise<TradingAgent[]> {
    return Array.from(this.tradingAgents.values());
  }

  async createTradingAgent(insertAgent: InsertTradingAgent): Promise<TradingAgent> {
    const id = randomUUID();
    const agent: TradingAgent = {
      ...insertAgent,
      id,
      isActive: false,
      performanceScore: "0",
      totalReturn: "0",
      sharpeRatio: "0",
      maxDrawdown: "0",
      aum: "0",
      rating: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tradingAgents.set(id, agent);
    return agent;
  }

  async updateTradingAgent(id: string, updates: Partial<TradingAgent>): Promise<TradingAgent | undefined> {
    const agent = this.tradingAgents.get(id);
    if (!agent) return undefined;

    const updatedAgent = { ...agent, ...updates, updatedAt: new Date() };
    this.tradingAgents.set(id, updatedAgent);
    return updatedAgent;
  }

  // Trading Session methods
  async getTradingSession(id: string): Promise<TradingSession | undefined> {
    return this.tradingSessions.get(id);
  }

  async getActiveTradingSessions(): Promise<TradingSession[]> {
    return Array.from(this.tradingSessions.values()).filter(session => 
      session.status === "active" || session.status === "monitoring"
    );
  }

  async getTradingSessionsByAgent(agentId: string): Promise<TradingSession[]> {
    return Array.from(this.tradingSessions.values()).filter(session => session.agentId === agentId);
  }

  async createTradingSession(insertSession: InsertTradingSession): Promise<TradingSession> {
    const id = randomUUID();
    const session: TradingSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      endedAt: null,
    };
    this.tradingSessions.set(id, session);
    return session;
  }

  async updateTradingSession(id: string, updates: Partial<TradingSession>): Promise<TradingSession | undefined> {
    const session = this.tradingSessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.tradingSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Portfolio methods
  async getPortfolioByUser(userId: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(userId);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    const portfolio: Portfolio = {
      ...insertPortfolio,
      id,
      updatedAt: new Date(),
    };
    this.portfolios.set(portfolio.userId, portfolio);
    return portfolio;
  }

  async updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) return undefined;

    const updatedPortfolio = { ...portfolio, ...updates, updatedAt: new Date() };
    this.portfolios.set(userId, updatedPortfolio);
    return updatedPortfolio;
  }

  // Network Status methods
  async getNetworkStatus(): Promise<OgNetworkStatus | undefined> {
    return this.networkStatus;
  }

  async updateNetworkStatus(updates: Partial<OgNetworkStatus>): Promise<OgNetworkStatus> {
    this.networkStatus = { ...this.networkStatus, ...updates, lastSyncAt: new Date() };
    return this.networkStatus;
  }

  // Trading Log methods
  async getTradingLogsBySession(sessionId: string): Promise<TradingLog[]> {
    return Array.from(this.tradingLogs.values()).filter(log => log.sessionId === sessionId);
  }

  async createTradingLog(insertLog: InsertTradingLog): Promise<TradingLog> {
    const id = randomUUID();
    const log: TradingLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.tradingLogs.set(id, log);
    return log;
  }

  // Investment methods
  async getInvestmentsByUser(userId: string): Promise<InvestmentAllocation[]> {
    return Array.from(this.investmentAllocations.values()).filter(investment => investment.userId === userId);
  }

  async createInvestment(insertInvestment: InsertInvestmentAllocation): Promise<InvestmentAllocation> {
    const id = randomUUID();
    const investment: InvestmentAllocation = {
      ...insertInvestment,
      id,
      allocatedAt: new Date(),
    };
    this.investmentAllocations.set(id, investment);
    return investment;
  }
}

export const storage = new MemStorage();
