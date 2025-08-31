# Overview

This is a decentralized trading agent platform built on the 0G (Zero Gravity) network. The application allows users to deploy, manage, and invest in AI-powered trading agents that execute automated trading strategies on various DeFi platforms. The system leverages 0G's compute network for AI inference and storage network for data persistence, creating a trustless environment for algorithmic trading.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses React with TypeScript, implementing a single-page application (SPA) architecture:
- **Framework**: React 18 with Vite for build tooling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
The server follows a RESTful API design pattern:
- **Runtime**: Node.js with Express.js framework
- **Type Safety**: TypeScript throughout the entire stack
- **API Design**: REST endpoints with standardized error handling
- **Development**: Hot reloading with Vite in development mode
- **Build System**: ESBuild for production bundling

## Data Storage Solutions
The application uses a hybrid storage approach:
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Distributed Storage**: 0G Storage network for decentralized data persistence
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

## Authentication and Authorization
The system implements Web3-native authentication:
- **Wallet Integration**: MetaMask and Web3 wallet connectivity
- **Network**: 0G Newton Testnet (Chain ID: 16600)
- **User Identity**: Ethereum wallet addresses as primary user identifiers
- **Session Management**: Traditional server-side sessions for API authentication
- **Authorization**: User-based access control for trading agents and portfolios

## External Dependencies

### Blockchain and Web3
- **0G Network**: Core infrastructure for compute and storage
  - 0G Compute Network for AI model inference
  - 0G Storage Network for decentralized data storage
  - 0G Newton Testnet for blockchain operations
- **Ethers.js**: Ethereum interaction and wallet management
- **MetaMask**: Primary wallet connector for user authentication

### Database and ORM
- **Neon Database**: Serverless PostgreSQL provider
- **Drizzle ORM**: Type-safe database operations and migrations
- **Drizzle Kit**: Schema management and migration tooling

### UI and Styling
- **Radix UI**: Unstyled, accessible component primitives
- **shadcn/ui**: Pre-built component library built on Radix
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development and Build Tools
- **Vite**: Frontend build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Static type checking across the entire codebase
- **Replit**: Development environment with integrated tooling

### Trading and DeFi Integration
- **Multiple DEX Support**: Architecture supports Uniswap, Hyperliquid, and other DeFi platforms
- **Strategy Engine**: Pluggable trading strategy system (momentum, arbitrage, mean reversion)
- **Risk Management**: Configurable risk levels and portfolio allocation limits

The architecture prioritizes decentralization, type safety, and modularity while maintaining developer experience through modern tooling and clear separation of concerns.