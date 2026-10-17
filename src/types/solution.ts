export type SolutionId = 'cloudflare-serverless' | 'dujiao-enhanced' | 'domestic-affiliate-shop' | 'global-mor';

export interface SolutionOption {
  id: SolutionId;
  name: string;
  badge: string;
  badgeColor: string;
  rating: number; // out of 5
  recommendedFor: string;
  summary: string;
  keyDelivery: string;
  paymentSupport: string;
  affiliateSupport: string;
  cloudflareIntegration: string;
  maintenanceCost: string;
  developmentEffort: string;
  pros: string[];
  cons: string[];
  verdict: string;
}

export interface PaymentMethod {
  name: string;
  targetAudience: string;
  qualification: string;
  rate: string;
  stability: '极高 (官方直连)' | '高 (合规代收)' | '中 (聚合渠道)' | '低/风险 (个人免签)';
  settlement: string;
  features: string[];
  setupCost: string;
  recommended: boolean;
}

export interface ArchitectureStep {
  stepNumber: number;
  title: string;
  actor: 'User' | 'PaymentGateway' | 'StoreOrWorker' | 'CloudflareD1' | 'SoftwareClient';
  action: string;
  dataPayload?: string;
  criticalSecurityRule: string;
}
