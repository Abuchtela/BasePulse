# ClaimBot x402 verified opportunities API

## Buyer checkout and receipt verification

Open `/` to inspect report availability, connect a browser wallet and buy a report.
Checkout accepts at most 0.10 USDC and pins the report URL, network, recipient,
USDC contract, exact amount and signing domain before requesting an EIP-3009
signature. Base Sepolia remains the default; test USDC is not revenue.

The paid response must include an x402 settlement transaction. The browser then
reads its mined receipt from the selected Base network and verifies both the
USDC `Transfer` event (payer, recipient, amount) and `AuthorizationUsed` event
(payer and the unique signed nonce). A facilitator success alone is not marked
onchain verified. Download the report and receipt before closing the page.
The SHA-256 digest identifies the downloaded report bytes; the content is not
committed onchain. There is no durable purchase history or server-side report
recovery yet. After a submission with an unknown outcome, checkout stops and
shows the authorization details instead of retrying or charging again.

`/api/opportunities/preview?project=BasePulse` exposes titles and IDs only.
Zero signed records disables checkout. `/publisher-draft` supplies a public,
unsigned research draft; it never substitutes for a trusted Arkiv record.
The verified draft is Arbitrum Mentorship Cohort 2 (official article and linked
application checked November 22, 2026). Fit depends on an Arbitrum/Robinhood
Chain commitment. The Base Builder Grant candidate was excluded because its
linked official application said Round 2 was closed, despite its documentation.

Publisher workflow: open `/publish.html`, load the verified draft, review its
official sources, connect the designated publisher, and sign the Arkiv record.
The page reads the entity back before reporting publication. It requires test
GLM for the network fee. Then return to `/` and use Base Sepolia test USDC for
the paid request. These wallet signatures must be provided by the wallet owner.

Records can explicitly specify `deadlineType: "not-published"` and
`deadline: null` when the official source gives no closing date. They still
require source verification within seven days. Dated records without a closing
time stop selling conservatively at the beginning of the date in UTC.

Build committed browser assets with `npm run build:browser --prefix claimbot-x402`.
CI rebuilds them and rejects a mismatch. Tests use isolated unit vectors;
passing them does not establish a real payment or Arkiv publication.

The seller responds with **real, trusted-publisher Arkiv records**, not mock opportunities.
It filters for eligible, unexpired, HTTPS-source opportunities.

## Setup (Node.js 22+)

From the repository root:

```sh
npm ci --prefix claimbot-arkiv
npm install --prefix claimbot-x402
npm run check --prefix claimbot-x402
npm test --prefix claimbot-x402
npm run start --prefix claimbot-x402
```

`X402_PAY_TO`: optional explicit payout override. ClaimBot's configured receiving address defaults to `0x748f6614Ea6289664bC8BeB84835E2F24fE52482` (public address supplied by the project owner). Verify it is correct before accepting real payments. The address is also recorded in `.env.example`.
`ARKIV_TRUSTED_PUBLISHER`: optional explicit override. The owner-designated publisher defaults to `0x4aBAf297bd37bb3FA0036b45976A92a46d903688`. The seller accepts only records created by that address; supplying the address alone does not publish any records.
Both addresses are **public addresses**, not private keys, and now have configured defaults. A valid publishing transaction must actually come from the trusted address before reports become available.

Defaults: Base Sepolia test USDC; $0.10/request; public testnet facilitator.
Optional: `ARKIV_RPC_URL`, `X402_FACILITATOR_URL`, `X402_PRICE`, `PORT`.

```sh
curl -i http://localhost:4021/health
curl -i 'http://localhost:4021/api/opportunities?project=ClaimBot'
```

An invalid project returns 400, unavailable Arkiv data returns 503, and zero eligible verified records return 404. All three happen **before a payment is requested**. With records present, requests without payment receive HTTP 402. A compatible client can pay and obtain the preflighted report.

## Mainnet

Require all of `X402_NETWORK=base`, `ALLOW_MAINNET_X402_SELLER=true`, and `X402_FACILITATOR_URL` set to an HTTPS facilitator supporting Base mainnet. Do this only after a verified Base Sepolia 402 -> 200 round trip, correct USDC settlement and receiver balance, and confirmed source records. This seller never creates Arkiv records; run the separate `claimbot-arkiv` publisher.

The shared BasePulse buyer remains `x402-agent` with independent spending safeguards. GitHub unit tests do not demonstrate a real settlement or production deployment.

## Vercel preview deployment

This seller is also a Vercel Node API with `api/index.ts`; `src/app.ts` exports the same Express app used locally. Set the Vercel project Root Directory to `claimbot-x402` and enable its default install. `vercel.json` rewrites the public `/health` and `/api/opportunities?project=ClaimBot` routes to that handler.

The live source probe is `npm run probe:arkiv --prefix claimbot-x402` (from repository root). It only reads trusted-writer records from Arkiv Tiramisu; it never manufactures opportunities or signs transactions. Empty results will prevent paid calls. ClaimBot's older hardcoded Arkiv grant was due on October 18, 2026 and cannot be used for a current sale. A current, verified record must be published and signed by the designated Arkiv writer to unlock the x402 paid endpoint.

**No real-money transactions are activated by this project.** Base Sepolia and its test USDC are the defaults. Never paste wallet private keys or recovery phrases into a chat or source repository.

Records older than **7 days** since `verifiedAt` are rejected before a payment challenge; re-check official opportunities and publish a new signed current record to keep reports active. The live probe respects `ARKIV_TRUSTED_PUBLISHER` if explicitly overridden.

## Wallet-connected publishing

Open `/publish.html` on the deployed ClaimBot site in MetaMask's in-app browser or a desktop browser with MetaMask installed. The publishing form is public but rejects every account except `0x4aBAf297bd37bb3FA0036b45976A92a46d903688`. It never asks for a signing key or secret. Check every opportunity against the organizer before signing. Arkiv Tiramisu test GLM from the [official faucet](https://hub.arkiv.network/faucet) is needed in that publisher wallet.

Build the on-site browser client via `npm run build:publisher --prefix claimbot-x402`. The tested browser code is committed as `src/publisherBundle.ts` and served at `/publisher.js`; Vercel's Build Command should be unset. To change the browser code, run `npm run build:publisher` and commit the regenerated bundle. Publishing must be approved inside the connected wallet. Until a real transaction is confirmed and queried, the paid endpoint correctly returns 404 and cannot charge a customer.
