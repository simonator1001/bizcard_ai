import React from 'react';
import { Container, Box } from '@mui/material';

// --- Modern PricingTab UI from 21st.dev ---
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

function PricingTab() {
  return (
    <Box sx={{ background: 'linear-gradient(90deg, #8B3DFF 0%, #E93D82 100%)', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <h1 style={{ color: 'white', fontWeight: 800, fontSize: 40, textAlign: 'center', marginBottom: 16 }}>
          Choose Your Plan
        </h1>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? 'white' : 'rgba(255,255,255,0.85)',
                borderRadius: 24,
                boxShadow: plan.highlight ? '0 8px 32px rgba(139,61,255,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
                padding: 32,
                minWidth: 320,
                maxWidth: 360,
                border: plan.highlight ? '2px solid #8B3DFF' : '1px solid #eee',
                transform: plan.highlight ? 'scale(1.05)' : 'none',
                transition: 'transform 0.2s',
                marginTop: plan.highlight ? -24 : 0,
              }}
            >
              <h2 style={{ fontWeight: 700, fontSize: 28, color: plan.highlight ? '#8B3DFF' : '#222', marginBottom: 8 }}>{plan.name}</h2>
              <div style={{ fontSize: 36, fontWeight: 800, color: plan.highlight ? '#E93D82' : '#8B3DFF', marginBottom: 16 }}>
                {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ marginBottom: 8, color: '#444', fontSize: 16, display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8, color: plan.highlight ? '#8B3DFF' : '#E93D82', fontWeight: 700 }}>•</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 12,
                  background: plan.highlight ? 'linear-gradient(90deg, #8B3DFF 0%, #E93D82 100%)' : '#fff',
                  color: plan.highlight ? 'white' : '#8B3DFF',
                  fontWeight: 700,
                  fontSize: 18,
                  border: plan.highlight ? 'none' : '1.5px solid #8B3DFF',
                  boxShadow: plan.highlight ? '0 2px 8px rgba(139,61,255,0.10)' : 'none',
                  cursor: 'pointer',
                  marginTop: 8,
                  marginBottom: 8,
                  transition: 'background 0.2s, color 0.2s',
                }}
                onClick={() => {
                  if (plan.name === 'Pro') {
                    window.open('https://buy.stripe.com/test_dR6aHf41X51fbe07su', '_blank');
                  } else if (plan.name === 'Enterprise') {
                    window.location.href = 'mailto:support@simon-gpt.com?subject=Enterprise%20Plan%20Inquiry';
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </Container>
    </Box>
  );
}

export default PricingTab; 