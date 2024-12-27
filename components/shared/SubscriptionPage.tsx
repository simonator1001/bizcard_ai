import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';

const SubscriptionPage = ({ showHeader = true }) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      price: '0',
      features: [
        'Scan up to 5 cards/month',
        'Basic OCR with English language only',
        'View cards in Manage tab',
        'Limited news feed on up to 3 companies'
      ],
      buttonText: 'Upgrade',
      buttonVariant: 'secondary'
    },
    {
      name: 'Pro',
      price: billingInterval === 'monthly' ? '9.99' : '95.90',
      features: [
        'Unlimited card scans',
        'Advanced OCR with multi-language support',
        'Export to CSV/Excel',
        'Full news feed access',
        'Organization chart view',
        'Priority support'
      ],
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'primary',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '49.99',
      features: [
        'All Pro features',
        'Custom branding',
        'API access',
        'Advanced analytics',
        'Dedicated support',
        'Team management'
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {showHeader && (
        <>
          <h1 className="text-4xl font-bold text-center mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-center text-gray-600 mb-8">
            Choose the plan that best fits your needs. All plans include a 7-day free trial.
          </p>
        </>
      )}

      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={billingInterval === 'monthly' ? 'font-semibold' : 'text-gray-500'}>Monthly</span>
        <Switch
          checked={billingInterval === 'yearly'}
          onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
        />
        <div className="flex items-center gap-2">
          <span className={billingInterval === 'yearly' ? 'font-semibold' : 'text-gray-500'}>Yearly</span>
          <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">Save up to 20%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-sm border ${
              plan.popular ? 'relative border-purple-100' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-green-500 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <button
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.buttonVariant === 'primary'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage; 