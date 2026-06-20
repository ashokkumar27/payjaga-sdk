# @payjaga/sdk

Thin TypeScript client for PayJaga Guard API. The SDK does not include merchant trust logic, risk scoring rules, database models, escrow resolver code, or Pay.sh signing logic. Those stay server-side in the hosted Guard API.

## Install

```bash
npm install @payjaga/sdk
```

## Usage

```ts
import { PayJagaClient } from "@payjaga/sdk";

const payjaga = new PayJagaClient({
  guardApiBaseUrl: "https://api.payjaga.com",
  agentId: "agent_123",
});

const decision = await payjaga.evaluate({
  merchant_id: "merchant_123",
  merchant_domain: "api.example.com",
  merchant_wallet: "MerchantWalletAddress",
  endpoint: "/paid/resource",
  method: "GET",
  amount_usd: 0.01,
  token: "USDC",
  chain: "solana",
  nonce: "unique-payment-nonce",
});
```

For browser apps, prefer routing requests through your own backend instead of exposing a privileged PayJaga API key in client code.

## Package Boundary

Public package contents are limited to `dist/`, this README, and `package.json`. Demo scripts and x402/Express dependencies are development-only and are not shipped in the npm package.
