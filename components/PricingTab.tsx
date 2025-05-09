"use client";
import React from 'react';
import { Container, Box } from '@mui/material';
import { TabDemo } from '@/components/ui/pricing-tab';

const plans = [
  {
    name: 'Free',
    price: 0,
    features: [
      'Scan up to 5 cards/month',
      'Basic OCR with English only',
      'Limited news feed',
      'Basic card management',
    ],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 9.99,
    features: [
      'Unlimited card scans',
      'Advanced OCR (multi-language)',
      'Full news feed access',
      'Organization chart view',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 49.99,
    features: [
      'All Pro features',
      'Custom branding',
      'API access',
      'Advanced analytics',
      'Dedicated support',
      'Team management',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function PricingTab() {
  return <TabDemo />;
} 