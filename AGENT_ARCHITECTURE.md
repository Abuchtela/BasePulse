# BasePulse Agent Architecture

## Overview

BasePulse is an autonomous agent system that monitors social trends on X and Farcaster, validates them against on-chain metrics, and autonomously deploys themed ERC20 tokens on the Base blockchain. The system operates without human intervention, making deployment decisions based on validated trend data and treasury management rules.

## System Architecture

### Core Components

#### 1. Trend Monitor Skill (`server/agent/trendMonitor.ts`)
The trend monitoring component continuously analyzes social media posts using LLM-powered sentiment analysis. It extracts trending themes, calculates sentiment scores, and validates trends against on-chain metrics.

**Key Functions:**
- `analyzeSocialTrends()` - Uses Claude to extract themes and sentiment from social posts
- `validateTrendThreshold()` - Checks if trend meets deployment criteria
- `storeTrendAnalysis()` - Persists trend data to database
- `generateTokenMetadata()` - Creates token name, symbol, and description from trend

**Configuration:**
```typescript
{
  minSentimentScore: 60,        // 0-100 scale
  minMentions: 5,               // Minimum mentions to consider
  minVolume24hUSD: 100000,      // Minimum on-chain volume in USD
}
```

#### 2. Token Deployer Module (`server/agent/tokenDeployer.ts`)
Handles the autonomous deployment of ERC20 tokens on Base using the Clanker SDK. Manages wallet interactions, transaction execution, and treasury accounting.

**Key Functions:**
- `deployToken()` - Deploys token with Uniswap V4 liquidity pool
- `collectTradingFees()` - Collects fees from deployed tokens
- `reinvestTreasuryFunds()` - Reinvests treasury balance into new initiatives

**Features:**
- Secure private key handling via environment variables
- Transaction tracking and error handling
- Automatic owner notifications on deployment events
- Treasury transaction logging

#### 3. Autonomous Loop Orchestrator (`server/agent/autonomousLoop.ts`)
Coordinates the entire autonomous workflow, running at regular intervals to scan trends, validate them, and trigger deployments.

**Loop Cycle:**
1. Fetch recent social posts from X/Farcaster
2. Analyze posts using LLM to extract trends
3. For each trend:
   - Fetch on-chain metrics from DexScreener
   - Validate against deployment thresholds
   - Deploy token if conditions met
   - Store analysis results
4. Collect trading fees from existing tokens
5. Check treasury balance and reinvest if needed
6. Record metrics and log activity

**Configuration:**
```typescript
{
  enabled: true,
  intervalMinutes: 15,              // Run every 15 minutes
  minSentimentScore: 60,
  minMentions: 5,
  minVolume24hUSD: 100000,
  maxDeploymentsPerDay: 10,         // Safety limit
}
```

### Data Models

#### Deployed Tokens Table
Tracks all tokens deployed by the agent with metadata and performance metrics.

```sql
CREATE TABLE deployed_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tokenAddress VARCHAR(42) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  description TEXT,
  imageUrl VARCHAR(512),
  trendTheme VARCHAR(255) NOT NULL,
  sentimentScore DECIMAL(5,2),
  deploymentTxHash VARCHAR(66) NOT NULL,
  deploymentBlockNumber INT,
  initialLiquidity DECIMAL(20,8),
  currentMarketCap DECIMAL(20,8),
  totalVolume24h DECIMAL(20,8),
  holders INT,
  status ENUM('pending', 'deployed', 'active', 'inactive'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Trend Analysis Table
Stores historical trend analysis results for auditing and analytics.

```sql
CREATE TABLE trend_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  theme VARCHAR(255) NOT NULL,
  sentimentScore DECIMAL(5,2) NOT NULL,
  mentionCount INT NOT NULL,
  onChainVolume DECIMAL(20,8),
  onChainVolumeUSD DECIMAL(20,2),
  deploymentTriggered BOOLEAN DEFAULT FALSE,
  deployedTokenId INT,
  rawData JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Treasury Transactions Table
Tracks all treasury movements including fees, deployments, and reinvestments.

```sql
CREATE TABLE treasury_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('fee_collection', 'reinvestment', 'deployment_cost', 'reward'),
  amount DECIMAL(20,8) NOT NULL,
  amountUSD DECIMAL(20,2),
  tokenAddress VARCHAR(42),
  txHash VARCHAR(66),
  description TEXT,
  status ENUM('pending', 'confirmed', 'failed'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Social Interactions Table
Records community interactions and agent responses for analytics.

```sql
CREATE TABLE social_interactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  platform ENUM('twitter', 'farcaster') NOT NULL,
  postId VARCHAR(255) NOT NULL,
  postContent TEXT,
  sentiment ENUM('positive', 'neutral', 'negative'),
  engagementCount INT,
  mentionedTokenId INT,
  agentResponse TEXT,
  responsePostId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints (tRPC)

#### Token Management
- `basepulse.tokens.list` - Get all deployed tokens
- `basepulse.tokens.getById` - Get specific token details

#### Trend Analysis
- `basepulse.trends.recent` - Get recent trend analysis

#### Treasury
- `basepulse.treasury.balance` - Get current treasury balance
- `basepulse.treasury.transactions` - Get transaction history

#### Social
- `basepulse.social.interactions` - Get community interactions

### Dashboard Features

The web dashboard provides real-time monitoring of agent operations:

1. **Deployed Tokens Board** - Lists all deployed tokens with sentiment scores and market data
2. **Treasury Stats** - Real-time display of available funds and transaction history
3. **Sentiment Meter** - Visualization of current trends and their sentiment scores
4. **Community Interactions** - Recent social media posts and agent responses
5. **Performance Metrics** - Charts and analytics on deployment success rates

## Deployment Configuration

### Environment Variables

```bash
# Agent Wallet
AGENT_PRIVATE_KEY=0x...              # Private key for token deployment

# Database
DATABASE_URL=mysql://...             # MySQL connection string

# LLM
OPENAI_API_KEY=sk-...                # For trend analysis

# Notifications
BUILT_IN_FORGE_API_KEY=...           # For owner notifications

# Social Media (Optional for future integration)
TWITTER_API_KEY=...
FARCASTER_API_KEY=...
```

### Autonomous Loop Scheduling

The autonomous loop runs at configurable intervals (default: 15 minutes). To start the loop:

```typescript
import { scheduleAutonomousLoop } from "./server/agent/autonomousLoop";

const config = {
  enabled: true,
  intervalMinutes: 15,
  minSentimentScore: 60,
  minMentions: 5,
  minVolume24hUSD: 100000,
  maxDeploymentsPerDay: 10,
};

scheduleAutonomousLoop(config);
```

## Security Considerations

1. **Private Key Management** - Private keys are stored in environment variables and never exposed in logs or responses
2. **Rate Limiting** - Maximum deployments per day prevents runaway spending
3. **Threshold Validation** - Multiple validation checks prevent deployment of low-quality trends
4. **Error Handling** - All errors are caught and logged with owner notifications
5. **Transaction Tracking** - All on-chain transactions are tracked and verified

## On-Chain Primitives

### Token Deployment (Clanker SDK)
- Creates ERC20 tokens with Uniswap V4 liquidity pools
- Supports custom metadata and social links
- Implements anti-sniper protection with fee decay
- Handles vesting and airdrop configurations

### Treasury Management
- Collects trading fees from deployed tokens
- Tracks all treasury transactions on-chain
- Implements reinvestment logic for sustainable growth

### Community Interaction
- Posts deployment announcements on X/Farcaster
- Responds to community questions about deployed tokens
- Tracks sentiment and engagement metrics

## Monitoring & Analytics

The system provides comprehensive monitoring through:

1. **Real-time Dashboard** - Live view of agent operations
2. **Database Analytics** - Historical trend and deployment data
3. **Owner Notifications** - Alerts for deployments, errors, and treasury events
4. **Metrics Tracking** - Performance data on deployment success rates and ROI

## Future Enhancements

1. **Multi-chain Support** - Extend to Ethereum, Arbitrum, and other chains
2. **Advanced Hedging** - Implement portfolio hedging strategies
3. **Community Governance** - Allow token holders to vote on deployment parameters
4. **Yield Farming** - Automatically stake tokens in high-yield protocols
5. **NFT Integration** - Mint NFTs for milestone achievements
