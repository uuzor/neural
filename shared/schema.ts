import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradingAgents = pgTable("trading_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  strategy: text("strategy").notNull(), // momentum, arbitrage, meanreversion, etc.
  ogComputeModel: text("og_compute_model").notNull(), // provider address
  contractAddress: text("contract_address"),
  initialFunding: decimal("initial_funding", { precision: 18, scale: 8 }).notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high
  isActive: boolean("is_active").default(false).notNull(),
  performanceScore: decimal("performance_score", { precision: 10, scale: 4 }),
  totalReturn: decimal("total_return", { precision: 10, scale: 4 }),
  sharpeRatio: decimal("sharpe_ratio", { precision: 10, scale: 4 }),
  maxDrawdown: decimal("max_drawdown", { precision: 10, scale: 4 }),
  aum: decimal("aum", { precision: 18, scale: 8 }).default("0"),
  minInvestment: decimal("min_investment", { precision: 18, scale: 8 }).default("0"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tradingSessions = pgTable("trading_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => tradingAgents.id).notNull(),
  platform: text("platform").notNull(), // Uniswap, Hyperliquid
  position: text("position").notNull(), // ETH/USDC Long, etc.
  entryPrice: decimal("entry_price", { precision: 18, scale: 8 }),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }),
  pnl: decimal("pnl", { precision: 18, scale: 8 }).default("0"),
  status: text("status").notNull(), // active, monitoring, closed
  ogStorageHash: text("og_storage_hash"), // 0G Storage log reference
  ogComputeRequestId: text("og_compute_request_id"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalValue: decimal("total_value", { precision: 18, scale: 8 }).default("0"),
  dailyPnl: decimal("daily_pnl", { precision: 18, scale: 8 }).default("0"),
  ogBalance: decimal("og_balance", { precision: 18, scale: 8 }).default("0"),
  activeAgentsCount: integer("active_agents_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ogNetworkStatus = pgTable("og_network_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  computeNetworkStatus: text("compute_network_status").notNull().default("offline"),
  storageNetworkStatus: text("storage_network_status").notNull().default("offline"),
  daLayerStatus: text("da_layer_status").notNull().default("offline"),
  lastSyncAt: timestamp("last_sync_at").defaultNow().notNull(),
});

export const tradingLogs = pgTable("trading_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => tradingSessions.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  action: text("action").notNull(), // BUY, SELL, ANALYZING, etc.
  amount: decimal("amount", { precision: 18, scale: 8 }),
  ogStorageHash: text("og_storage_hash"),
  ogDaBlobId: text("og_da_blob_id"),
  isVerified: boolean("is_verified").default(false),
});

export const investmentAllocations = pgTable("investment_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  agentId: varchar("agent_id").references(() => tradingAgents.id).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  allocatedAt: timestamp("allocated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTradingAgentSchema = createInsertSchema(tradingAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  performanceScore: true,
  totalReturn: true,
  sharpeRatio: true,
  maxDrawdown: true,
  aum: true,
  rating: true,
});

export const insertTradingSessionSchema = createInsertSchema(tradingSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  updatedAt: true,
});

export const insertTradingLogSchema = createInsertSchema(tradingLogs).omit({
  id: true,
  timestamp: true,
});

export const insertInvestmentAllocationSchema = createInsertSchema(investmentAllocations).omit({
  id: true,
  allocatedAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type TradingAgent = typeof tradingAgents.$inferSelect;
export type TradingSession = typeof tradingSessions.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;
export type OgNetworkStatus = typeof ogNetworkStatus.$inferSelect;
export type TradingLog = typeof tradingLogs.$inferSelect;
export type InvestmentAllocation = typeof investmentAllocations.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTradingAgent = z.infer<typeof insertTradingAgentSchema>;
export type InsertTradingSession = z.infer<typeof insertTradingSessionSchema>;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type InsertTradingLog = z.infer<typeof insertTradingLogSchema>;
export type InsertInvestmentAllocation = z.infer<typeof insertInvestmentAllocationSchema>;
