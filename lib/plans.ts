export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'pro';
  description: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  limits: {
    scansPerMonth: number;
    companiesTracked: number;
  };
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    tier: 'free',
    description: 'For individual users',
    price: {
      monthly: null,
      yearly: null
    },
    limits: {
      scansPerMonth: 5,
      companiesTracked: 3
    },
    features: [
      'Basic OCR',
      'CSV Export',
      'Basic Card Management'
    ]
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    tier: 'basic',
    description: 'For small businesses',
    price: {
      monthly: 9,
      yearly: 89
    },
    limits: {
      scansPerMonth: 30,
      companiesTracked: 10
    },
    features: [
      'Enhanced OCR',
      'CSV & PDF Export',
      'Enhanced Card Management',
      'Duplicate Removal',
      'Basic News Updates'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tier: 'pro',
    description: 'For power users',
    price: {
      monthly: 19,
      yearly: 189
    },
    limits: {
      scansPerMonth: Infinity,
      companiesTracked: Infinity
    },
    features: [
      'Advanced OCR',
      'All Export Formats',
      'Advanced Card Management',
      'Duplicate Removal',
      'Real-time News + Alerts',
      'Team Sharing',
      'Custom Annotations',
      'Priority Support'
    ]
  }
}; 