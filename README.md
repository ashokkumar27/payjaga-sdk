# @payjaga/sdk

TypeScript client for checking agent-initiated payment requests with PayJaga before a wallet signs or a payment client retries a paid resource.

Use it when your app, agent, or SDK integration receives a paid API challenge and needs a clear decision:

- `ALLOW_DIRECT`: continue with payment
- `HUMAN_APPROVAL`: pause and ask for approval
- `ESCROW_REQUIRED`: route through escrow before release
- `BLOCK`: stop the payment

## Install

```bash
npm install @payjaga/sdk
```

The package is ESM-first and expects a runtime with `fetch` available, such as modern Node.js, Bun, Deno, or browser environments.

## Quick Start

```ts
import { PayJagaClient } from "@payjaga/sdk";

const payjaga = new PayJagaClient({
  guardApiBaseUrl: "https://api.payjaga.com",
  agentId: "agent_research_001",
  apiKey: process.env.PAYJAGA_API_KEY,
});

const decision = await payjaga.evaluate({
  merchant_id: "sports_data_api",
  merchant_domain: "api.example.com",
  merchant_wallet: "MerchantWalletAddress",
  endpoint: "/fifa/matchday",
  method: "GET",
  amount_usd: 0.01,
  token: "USDC",
  chain: "solana:devnet",
  nonce: crypto.randomUUID(),
  raw_challenge: {
    provider: "x402",
    resource: "/fifa/matchday",
  },
});

if (decision.decision !== "ALLOW_DIRECT") {
  console.log("Payment stopped:", decision.decision, decision.reason_codes);
  return;
}

// Continue with wallet signing or your payment client.
```

## Decision Handling

```ts
switch (decision.decision) {
  case "ALLOW_DIRECT":
    // Safe to continue with payment.
    break;

  case "HUMAN_APPROVAL":
    // Show the user/operator the amount, merchant, and reason codes.
    break;

  case "ESCROW_REQUIRED":
    // Create or route through an escrow flow before delivery/release.
    break;

  case "BLOCK":
    // Do not sign or submit the payment.
    break;
}
```

Useful response fields:

```ts
decision.payment_intent_id
decision.risk_score
decision.merchant_trust_score
decision.reason_codes
decision.expires_at
```

## Guarding a 402 Request

`guardedFetch()` performs an initial request and evaluates the payment challenge if the server returns HTTP 402.

```ts
import { PayJagaClient, PayJagaPaymentError } from "@payjaga/sdk";

const payjaga = new PayJagaClient({
  guardApiBaseUrl: "https://api.payjaga.com",
  agentId: "agent_research_001",
});

try {
  const { initialResponse, decision } = await payjaga.guardedFetch(
    "https://merchant.example.com/fifa/matchday",
  );

  if (decision?.decision === "ALLOW_DIRECT") {
    // Retry the request with your x402/Pay.sh payment client.
  }

  if (initialResponse.status !== 402) {
    // The resource was not payment-gated.
  }
} catch (error) {
  if (error instanceof PayJagaPaymentError) {
    console.log("Payment rejected:", error.decision.decision);
    console.log("Reasons:", error.decision.reason_codes);
  } else {
    throw error;
  }
}
```

## Security Notes

Keep privileged API keys on your backend. Browser apps should call your own backend first, then let the backend call PayJaga. Always use a unique nonce per attempted payment so replay checks can work correctly.

## Development

```bash
npm install
npm run build
```

The SDK source lives in `src/`, compiled output is written to `dist/`, and package exports are defined in `package.json`.
