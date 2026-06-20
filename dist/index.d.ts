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
export declare class PayJagaPaymentError extends Error {
    readonly decision: GuardDecision;
    constructor(decision: GuardDecision);
}
export declare class PayJagaClient {
    private guardApiBaseUrl;
    private agentId;
    private apiKey?;
    constructor(options: PayJagaClientOptions);
    evaluate(challenge: PaymentChallenge, body?: unknown): Promise<GuardDecision>;
    guardedFetch(input: string, init?: RequestInit): Promise<{
        initialResponse: Response;
        decision?: GuardDecision;
    }>;
    private parseChallenge;
}
