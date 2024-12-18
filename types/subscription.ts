export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface CustomBranding {
  logoUrl: string;
  primaryColor?: string;
  companyName?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paymentProvider?: string;
  paymentProviderSubscriptionId?: string;
  customBranding?: CustomBranding;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionUsage {
  id: string;
  userId: string;
  month: Date;
  scansCount: number;
  companiesTracked: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    scansPerMonth: number;
    companiesTracked: number;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Scan up to 5 cards/month',
      'Basic OCR with English language only',
      'View cards in Manage tab',
      'Limited news feed on up to 3 companies',
    ],
    limits: {
      scansPerMonth: 5,
      companiesTracked: 3,
    },
  },
  {
    tier: 'basic',
    name: 'Basic',
    price: {
      monthly: 5,
      yearly: 50,
    },
    features: [
      'Scan up to 30 cards/month',
      'OCR support for multiple languages',
      'Access to news feed with updates on up to 10 companies',
      'Filter, sort, and remove duplicates in Manage tab',
    ],
    limits: {
      scansPerMonth: 30,
      companiesTracked: 10,
    },
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: {
      monthly: 15,
      yearly: 150,
    },
    features: [
      'Unlimited scans',
      'Advanced OCR with auto-merge for multilingual cards',
      'Full-featured Manage tab',
      'Advanced news feed: AI-curated news, 20 companies',
      'Organizational chart with AI suggestions',
      'Export business cards in PDF/CSV format',
    ],
    limits: {
      scansPerMonth: Infinity,
      companiesTracked: 20,
    },
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: -1, // Custom pricing
      yearly: -1,
    },
    features: [
      'Custom branding',
      'Multi-user accounts with team access',
      'API access',
      'Dedicated customer support and training',
    ],
    limits: {
      scansPerMonth: Infinity,
      companiesTracked: Infinity,
    },
  },
];

export interface SubscriptionPageProps {
  // Add any props if needed
} 