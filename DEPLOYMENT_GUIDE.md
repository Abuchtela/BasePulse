# BasePulse Deployment Guide

## Prerequisites

- Node.js 22+
- pnpm package manager
- MySQL database
- Base network RPC endpoint (Alchemy, Infura, or similar)
- Private key for agent wallet with some ETH for gas
- OpenAI API key for LLM trend analysis

## Local Development Setup

### 1. Install Dependencies

```bash
cd basepulse-agent
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/basepulse

# Agent Wallet
AGENT_PRIVATE_KEY=0x...  # Private key for Base network transactions

# LLM Configuration
OPENAI_API_KEY=sk-...

# OAuth (Manus)
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...

# Notifications
BUILT_IN_FORGE_API_KEY=...
BUILT_IN_FORGE_API_URL=...
```

### 3. Set Up Database

```bash
# Generate and run migrations
pnpm db:push
```

### 4. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### 1. Build for Production

```bash
pnpm build
```

This creates optimized bundles in the `dist` folder.

### 2. Start Production Server

```bash
pnpm start
```

### 3. Configure Autonomous Loop

In your deployment environment, initialize the autonomous loop in your server startup:

```typescript
// In server/_core/index.ts or similar
import { scheduleAutonomousLoop } from "./agent/autonomousLoop";

const agentConfig = {
  enabled: true,
  intervalMinutes: 15,
  minSentimentScore: 60,
  minMentions: 5,
  minVolume24hUSD: 100000,
  maxDeploymentsPerDay: 10,
};

scheduleAutonomousLoop(agentConfig);
```

## Autonomous Agent Setup

### 1. Create OpenClaw Agent

If deploying as a standalone OpenClaw agent:

```bash
# Install OpenClaw CLI
npm install -g openclaw

# Initialize agent
openclaw onboard --install-daemon

# Configure channels (X, Farcaster)
openclaw channels login
```

### 2. Deploy BasePulse Skills

Create OpenClaw skills directory structure:

```
~/.openclaw/workspace/skills/
├── basepulse-trend-monitor/
│   ├── SKILL.md
│   └── index.ts
├── basepulse-token-deployer/
│   ├── SKILL.md
│   └── index.ts
└── basepulse-treasury/
    ├── SKILL.md
    └── index.ts
```

### 3. Configure Agent Wallet

Set the agent's private key in OpenClaw configuration:

```bash
openclaw configure --section agent
# Set AGENT_PRIVATE_KEY environment variable
```

### 4. Enable Autonomous Loop

Add to agent's system prompt or cron job:

```bash
# Run every 15 minutes
*/15 * * * * /path/to/basepulse-agent/autonomous-loop.sh
```

## Monitoring & Maintenance

### 1. Check Agent Status

```bash
# View agent logs
tail -f ~/.openclaw/logs/agent.log

# Check autonomous loop status
ps aux | grep autonomous-loop
```

### 2. Monitor Database

```bash
# Connect to database
mysql -u user -p basepulse

# Check deployed tokens
SELECT * FROM deployed_tokens ORDER BY createdAt DESC LIMIT 10;

# Check treasury balance
SELECT SUM(amount) FROM treasury_transactions WHERE type IN ('fee_collection', 'reward');
```

### 3. View Dashboard

Access the web dashboard at `https://your-domain.com/dashboard` to monitor:
- Deployed tokens and their performance
- Treasury balance and transactions
- Recent trends and sentiment scores
- Community interactions

## Troubleshooting

### Issue: Autonomous Loop Not Running

**Solution:**
1. Check if the loop is scheduled: `ps aux | grep autonomous-loop`
2. Check logs for errors: `tail -f ~/.openclaw/logs/agent.log`
3. Verify environment variables are set: `env | grep AGENT_PRIVATE_KEY`
4. Restart the loop: `systemctl restart basepulse-agent`

### Issue: Token Deployment Failures

**Solution:**
1. Check wallet balance: `cast balance <wallet-address> --rpc-url <base-rpc>`
2. Verify private key is correct
3. Check on-chain transaction status: `cast tx <tx-hash> --rpc-url <base-rpc>`
4. Review error logs for specific failure reasons

### Issue: LLM Analysis Errors

**Solution:**
1. Verify OpenAI API key is valid
2. Check API rate limits: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
3. Review error logs for specific API errors
4. Consider implementing retry logic with exponential backoff

### Issue: Database Connection Issues

**Solution:**
1. Test database connection: `mysql -u user -p -h host basepulse -e "SELECT 1"`
2. Check DATABASE_URL format: `mysql://user:password@host:3306/database`
3. Verify user permissions: `GRANT ALL PRIVILEGES ON basepulse.* TO 'user'@'%';`
4. Check network connectivity to database server

## Performance Optimization

### 1. Optimize Trend Analysis

- Batch process multiple posts together
- Cache LLM responses for similar themes
- Implement exponential backoff for API calls

### 2. Optimize Database Queries

- Add indexes on frequently queried columns:
  ```sql
  CREATE INDEX idx_deployed_tokens_status ON deployed_tokens(status);
  CREATE INDEX idx_trend_analysis_theme ON trend_analysis(theme);
  CREATE INDEX idx_treasury_type ON treasury_transactions(type);
  ```

### 3. Optimize On-Chain Operations

- Batch token deployments when possible
- Use gas price optimization strategies
- Implement transaction pooling

## Security Best Practices

1. **Rotate Private Keys Regularly**
   - Generate new keys every 3-6 months
   - Use hardware wallets for production

2. **Secure Environment Variables**
   - Use secrets management service (AWS Secrets Manager, Vault)
   - Never commit `.env` files to version control
   - Rotate API keys regularly

3. **Monitor for Suspicious Activity**
   - Set up alerts for unusual deployment patterns
   - Monitor treasury balance changes
   - Review transaction logs regularly

4. **Implement Rate Limiting**
   - Limit deployments per day
   - Implement cooldown periods between deployments
   - Set maximum treasury spending limits

## Scaling Considerations

### Horizontal Scaling

- Deploy multiple agent instances with different trend focuses
- Use load balancer for dashboard traffic
- Implement database replication for read scaling

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database indexes
- Implement caching layer (Redis)

## Backup & Recovery

### 1. Database Backups

```bash
# Daily backup
mysqldump -u user -p basepulse > basepulse-$(date +%Y%m%d).sql

# Automated backup
0 2 * * * mysqldump -u user -p basepulse > /backups/basepulse-$(date +\%Y\%m\%d).sql
```

### 2. Configuration Backups

- Backup `.env` files securely
- Backup OpenClaw configuration
- Maintain version control for all code

### 3. Recovery Procedures

- Test restore procedures regularly
- Document recovery steps
- Maintain off-site backups

## Support & Troubleshooting

For issues or questions:
1. Check logs: `tail -f ~/.openclaw/logs/agent.log`
2. Review documentation: See `AGENT_ARCHITECTURE.md`
3. Check GitHub issues: https://github.com/basepulse/agent
4. Contact support: support@basepulse.dev
