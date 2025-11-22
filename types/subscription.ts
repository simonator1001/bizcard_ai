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
  user_id: string;
  month: string;
  scansCount: number;
  companiesTracked: number;
  totalCards: number;
  created_at?: string;
  updated_at?: string;
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
    tier: 'pro',
    name: 'Pro',
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    features: [
      'Unlimited card scans',
      'Advanced OCR with multi-language support',
      'Export to CSV/Excel',
      'Full news feed access',
      'Organization chart view',
      'Priority support',
    ],
    limits: {
      scansPerMonth: Infinity,
      companiesTracked: Infinity,
    },
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 49.99,
      yearly: 499.99,
    },
    features: [
      'All Pro features',
      'Custom branding',
      'API access',
      'Advanced analytics',
      'Dedicated support',
      'Team management',
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