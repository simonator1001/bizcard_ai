import { Layout } from '@/components/layout/layout';
import { PricingPlans } from '@/components/subscription/PricingPlans';
import { Typography, Container, Box, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const returnUrl = searchParams?.get('return');

  return (
    <Layout>
      <Box 
        sx={{ 
          background: 'linear-gradient(90deg, #8B3DFF 0%, #E93D82 100%)',
          color: 'white',
          py: 8,
          mb: 4
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            Unlock Pro Features for Maximum Efficiency
          </Typography>
          <Typography variant="h5" align="center" sx={{ mb: 4 }}>
            Upgrade to Pro and enjoy unlimited storage, advanced OCR, and exclusive features.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: '#8B3DFF',
                borderRadius: '50px',
                px: 4,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                }
              }}
              component="a"
              href="https://buy.stripe.com/test_dR6aHf41X51fbe07su"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started with Pro
            </Button>
          </Box>
        </Container>
      </Box>
      <Container maxWidth="lg">
        <PricingPlans />
        {returnUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => router.push(returnUrl)}
            >
              Return to Previous Page
            </Button>
          </Box>
        )}
      </Container>
    </Layout>
  );
} 