# PulseIndex Agent (Agent 02)

PulseIndex is an isolated second BasePulse agent. It does not modify or replace
the original Trend Launch Agent.

## Prototype workflow

1. Accept a plain-language portfolio objective, budget, risk level, themes,
   exclusions, position cap, and two-letter country code.
2. Filter and rank a small static demonstration universe.
3. Produce a fully allocated portfolio without exceeding the requested position
   cap.
4. Display jurisdiction, concentration, and execution-safety checks.
5. Keep all output in simulation mode on Base Sepolia. No wallet transaction is
   created.

## Routes

- UI: `/pulseindex`
- tRPC mutation: `basepulse.pulseindex.plan`
- tRPC query: `basepulse.pulseindex.universe`

When deployed on the existing BasePulse host, these resolve to:

- `https://basepulse.manus.space/pulseindex`
- `https://basepulse.manus.space/api/trpc/basepulse.pulseindex.plan`
- `https://basepulse.manus.space/api/trpc/basepulse.pulseindex.universe`

## Safety boundary

The current universe is static and is not a registry of live Coinbase tokenized
stock contracts. The planner never describes a country code as proof of
eligibility. U.S. requests are explicitly blocked from live tokenized-stock
execution, and all other requests still require regulated-provider verification.

Live execution should only be added after an official asset registry, verified
market-data source, KYC/eligibility provider, user approval flow, wallet policy,
and legal review are available.
