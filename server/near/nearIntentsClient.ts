import {
  OneClickService,
  OpenAPI,
  QuoteRequest,
  type GetExecutionStatusResponse,
  type QuoteResponse,
  type TokenResponse,
} from "@defuse-protocol/one-click-sdk-typescript";
import type { NearPolicyConfig, TreasuryIntent } from "./types";

export interface NearIntentsClient {
  tokens(): Promise<TokenResponse[]>;
  quote(intent: TreasuryIntent, dry: boolean): Promise<QuoteResponse>;
  submitDepositTx(txHash: string, depositAddress: string): Promise<unknown>;
  getStatus(depositAddress: string, depositMemo?: string): Promise<GetExecutionStatusResponse>;
}

export class OneClickNearIntentsClient implements NearIntentsClient {
  constructor(
    private readonly config: NearPolicyConfig,
    private readonly jwt = process.env.ONE_CLICK_JWT,
  ) {}

  private configureSdk(): void {
    OpenAPI.BASE = "https://1click.chaindefuser.com";
    OpenAPI.TOKEN = this.jwt;
  }

  async tokens(): Promise<TokenResponse[]> {
    this.configureSdk();
    return OneClickService.getTokens();
  }

  async quote(intent: TreasuryIntent, dry: boolean): Promise<QuoteResponse> {
    this.configureSdk();
    return OneClickService.getQuote({
      dry,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: intent.slippageBps,
      originAsset: intent.originAsset,
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      destinationAsset: intent.destinationAsset,
      amount: intent.amount,
      refundTo: intent.refundTo,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      recipient: intent.recipient,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      deadline: intent.expiresAt,
      referral: this.config.referral,
      quoteWaitingTimeMs: this.config.quoteWaitingTimeMs,
    });
  }

  async submitDepositTx(txHash: string, depositAddress: string): Promise<unknown> {
    this.configureSdk();
    return OneClickService.submitDepositTx({ txHash, depositAddress });
  }

  async getStatus(depositAddress: string, depositMemo?: string): Promise<GetExecutionStatusResponse> {
    this.configureSdk();
    return OneClickService.getExecutionStatus(depositAddress, depositMemo);
  }
}
