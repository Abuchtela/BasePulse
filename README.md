# BasePulse: Autonomous Trend-to-Token Agent for Base

BasePulse is a fully autonomous agent that monitors social trends on X and Farcaster, validates them against on-chain metrics, and autonomously deploys themed ERC20 tokens on the Base blockchain—all without human intervention.

## 🚀 Key Features

- **Autonomous Trend Monitoring**: Continuously scans X and Farcaster for Base ecosystem trends using LLM-powered sentiment analysis
- **On-Chain Validation**: Cross-references social trends with DexScreener metrics to ensure deployment quality
- **Autonomous Token Deployment**: Deploys ERC20 tokens with Uniswap V4 liquidity pools using Clanker SDK
- **Treasury Management**: Automatically collects trading fees and reinvests them into Base ecosystem initiatives
- **Real-Time Dashboard**: Web-based interface for monitoring agent operations, deployed tokens, and treasury
- **Community Interaction**: Autonomous social media posting and community engagement
- **Comprehensive Logging**: Full audit trail of all decisions, deployments, and transactions

## 🏗️ Architecture

BasePulse consists of three main components:

### 1. **Trend Monitor Skill**
Analyzes social media posts using Claude AI to extract trending themes and sentiment scores. Validates trends against on-chain volume data before triggering deployments.

### 2. **Token Deployer Module**
Handles autonomous ERC20 token deployment on Base using the Clanker SDK. Manages wallet interactions, transaction execution, and treasury accounting.

### 3. **Autonomous Loop Orchestrator**
Coordinates the entire workflow, running at regular intervals to scan trends, validate them, and trigger deployments. Includes safety limits and error handling.

## 📊 On-Chain Primitives

BasePulse implements several key blockchain primitives:

- **ERC20 Token Creation**: Deploy custom tokens with metadata and social links
- **Uniswap V4 Integration**: Create liquidity pools with anti-sniper protection
- **Treasury Management**: On-chain fund tracking and reinvestment logic
- **Fee Collection**: Automatic fee harvesting from deployed tokens
- **Transaction Tracking**: Full audit trail of all on-chain operations

## 🎯 Use Case: Autonomous Venture Agent

Unlike traditional chatbots, BasePulse acts as a venture agent that:
1. Identifies promising trends in the Base ecosystem
2. Deploys capital (tokens) to capture those opportunities
3. Manages the resulting treasury autonomously
4. Reinvests profits into new initiatives

This creates a self-sustaining economic loop where the agent generates value without human direction.

## 🛠️ Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL with Drizzle ORM
- **Blockchain**: Viem + Clanker SDK for Base network
- **AI/LLM**: OpenAI Claude for trend analysis
- **Agent Framework**: OpenClaw for autonomous operations

## 📦 Installation

### Prerequisites
- Node.js 22+
- pnpm
- MySQL database
- Base network RPC endpoint
- Private key with ETH for gas
- OpenAI API key

### Setup

```bash
# Clone repository
git clone https://github.com/basepulse/agent.git
cd basepulse-agent

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

## 🚀 Usage

### Start the Agent

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

### Access Dashboard

Open `http://localhost:3000/dashboard` to monitor:
- Deployed tokens and their performance
- Treasury balance and transaction history
- Real-time trend analysis and sentiment scores
- Community interactions and agent responses

### Configure Autonomous Loop

Edit the configuration in `server/agent/autonomousLoop.ts`:

```typescript
const config = {
  enabled: true,
  intervalMinutes: 15,              // Run every 15 minutes
  minSentimentScore: 60,            // 0-100 scale
  minMentions: 5,                   // Minimum mentions
  minVolume24hUSD: 100000,          // Minimum on-chain volume
  maxDeploymentsPerDay: 10,         // Safety limit
};
```

## 📚 Documentation

- **[Agent Architecture](./AGENT_ARCHITECTURE.md)** - Detailed technical architecture and design
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment and configuration
- **[API Reference](./server/routers.ts)** - tRPC API endpoints

## 🗄️ Database Schema

BasePulse uses the following main tables:

- **deployed_tokens**: Tracks all tokens deployed by the agent
- **trend_analysis**: Historical trend analysis results
- **treasury_transactions**: All treasury movements
- **social_interactions**: Community engagement records
- **agent_metrics**: Performance and operational metrics

## 🔐 Security

- Private keys stored securely in environment variables
- Rate limiting on deployments (max 10 per day)
- Multiple validation checks before deployment
- Comprehensive error handling and logging
- Owner notifications for all significant events

## 📈 Performance Metrics

The dashboard displays:
- Total tokens deployed
- Treasury balance and growth
- Deployment success rate
- Average sentiment score of deployed tokens
- Community engagement metrics

## 🔄 Autonomous Loop Workflow

1. **Scan** - Fetch recent posts from X/Farcaster
2. **Analyze** - Extract trends and sentiment using LLM
3. **Validate** - Check on-chain metrics and thresholds
4. **Deploy** - Create token if conditions met
5. **Collect** - Harvest trading fees
6. **Reinvest** - Allocate treasury funds
7. **Report** - Log metrics and notify owner

## 🎮 Dashboard Features

### Pulse Board
View all deployed tokens with:
- Token name, symbol, and trend theme
- Sentiment score and market cap
- 24h volume and holder count
- Current status (pending, deployed, active, inactive)

### Treasury Stats
Monitor financial health:
- Total available balance
- Fee collection history
- Reinvestment tracking
- Transaction details

### Sentiment Meter
Track trending themes:
- Real-time sentiment scores
- Mention counts
- On-chain volume validation
- Deployment triggers

### Community Interactions
Engage with users:
- Recent social media posts
- Sentiment analysis (positive/neutral/negative)
- Agent responses
- Engagement metrics

## 🏆 Competition Submission

This agent was built for the **Base Build OpenClaw Agent Competition** with a 5ETH prize pool. It demonstrates:

✅ **Implementation of On-Chain Primitives**
- Token deployment with Uniswap V4
- Treasury management on-chain
- Fee collection and reinvestment

✅ **Novelty of Use Case**
- Autonomous venture agent model
- Trend-to-token pipeline
- Self-sustaining economic loop

✅ **No-Human-In-The-Loop**
- Fully autonomous decision-making
- Autonomous social posting
- Autonomous fund management

## 📝 Building Process Documentation

The development process included:
1. Research on OpenClaw framework and Base ecosystem
2. Design of autonomous agent architecture
3. Implementation of trend analysis engine
4. Integration of Clanker SDK for token deployment
5. Dashboard development for monitoring
6. Comprehensive testing and validation

See `AGENT_ARCHITECTURE.md` for detailed technical documentation.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **GitHub**: https://github.com/basepulse/agent
- **Base Network**: https://base.org
- **Clanker**: https://clanker.world
- **OpenClaw**: https://openclaw.ai

## 💬 Support

For questions or issues:
- Check the [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- Review [Agent Architecture](./AGENT_ARCHITECTURE.md)
- Open an issue on GitHub

---

**BasePulse** - Autonomous Trend-to-Token Engine for Base Ecosystem

Built with ❤️ for the Base Build OpenClaw Agent Competition
