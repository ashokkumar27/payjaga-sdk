export type PayJagaDecision = "ALLOW_DIRECT" | "BLOCK" | "HUMAN_APPROVAL" | "ESCROW_REQUIRED";

export type GuardDecision = {
  payment_intent_id: string;
  payment_intent_hash: string;
  decision: PayJagaDecision;
  status: string;
  merchant_trust_score: number;
  merchant_trust_tier: string;
  risk_score: number;
  reason_codes: string[];
  onchain_action: string | null;
  expires_at: string;
};

export type PaymentChallenge = {
  merchant_id: string;
  merchant_domain: string;
  merchant_wallet: string;
  endpoint: string;
  method: string;
  amount_usd: number;
  token?: string;
  chain?: string;
  quote_id?: string;
  nonce?: string;
  raw_challenge?: Record<string, unknown>;
};

export type PayJagaClientOptions = {
  guardApiBaseUrl: string;
  agentId: string;
  apiKey?: string;
};

export class PayJagaPaymentError extends Error {
  constructor(
    public readonly decision: GuardDecision
  ) {
    super(`PayJaga payment not allowed: ${decision.decision} (${decision.reason_codes.join(", ")})`);
  }
}

export class PayJagaClient {
  private guardApiBaseUrl: string;
  private agentId: string;
  private apiKey?: string;

  constructor(options: PayJagaClientOptions) {
    this.guardApiBaseUrl = options.guardApiBaseUrl.replace(/\/$/, "");
    this.agentId = options.agentId;
    this.apiKey = options.apiKey;
  }

  async evaluate(challenge: PaymentChallenge, body?: unknown): Promise<GuardDecision> {
    const payload = {
      agent_id: this.agentId,
      merchant_id: challenge.merchant_id,
      merchant_domain: challenge.merchant_domain,
      merchant_wallet: challenge.merchant_wallet,
      endpoint: challenge.endpoint,
      method: challenge.method || "GET",
      amount_usd: challenge.amount_usd,
      token: challenge.token || "USDC",
      chain: challenge.chain || "solana",
      quote_id: challenge.quote_id,
      nonce: challenge.nonce || crypto.randomUUID().replace(/-/g, "").slice(0, 16),
      body,
      raw_challenge: challenge.raw_challenge || challenge
    };

    const headers = new Headers({ "content-type": "application/json" });
    if (this.apiKey) {
      headers.set("x-payjaga-key", this.apiKey);
    }

    const res = await fetch(`${this.guardApiBaseUrl}/v1/guard/evaluate`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`PayJaga evaluate failed: ${res.status} ${await res.text()}`);
    }

    return res.json();
  }

  async guardedFetch(input: string, init: RequestInit = {}): Promise<{ initialResponse: Response; decision?: GuardDecision }> {
    const initialResponse = await fetch(input, init);
    if (initialResponse.status !== 402) {
      return { initialResponse };
    }

    const challengeBody = await initialResponse.clone().json();
    const challenge = this.parseChallenge(input, init, challengeBody);
    const decision = await this.evaluate(challenge, init.body || undefined);

    if (decision.decision !== "ALLOW_DIRECT") {
      throw new PayJagaPaymentError(decision);
    }

    return { initialResponse, decision };
  }

  private parseChallenge(input: string, init: RequestInit, body: any): PaymentChallenge {
    const url = new URL(input);
    return {
      merchant_id: body.merchant_id || url.hostname,
      merchant_domain: body.merchant_domain || url.hostname,
      merchant_wallet: body.merchant_wallet || body.payTo || body.recipient || "unknown_wallet",
      endpoint: body.endpoint || url.pathname,
      method: body.method || init.method || "GET",
      amount_usd: Number(body.amount_usd || body.amount || 0),
      token: body.token || body.asset || "USDC",
      chain: body.chain || body.network || "solana",
      quote_id: body.quote_id,
      nonce: body.nonce || crypto.randomUUID().replace(/-/g, "").slice(0, 16),
      raw_challenge: body
    };
  }

}
