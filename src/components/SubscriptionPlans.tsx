import React from 'react';
import { Button, Grid, Typography, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface Feature {
  name: string;
  freePlan: boolean | string;
  proPlan: boolean | string;
}

export const SubscriptionPlans: React.FC = () => {
  const features: Feature[] = [
    { name: 'Scan Business Cards', freePlan: true, proPlan: true },
    { name: 'Store Cards', freePlan: 'Up to 100', proPlan: 'Unlimited' },
    { name: 'Basic Search', freePlan: true, proPlan: true },
    { name: 'Advanced OCR', freePlan: false, proPlan: true },
    { name: 'Org Chart Visualization', freePlan: false, proPlan: true },
    { name: 'News Consolidation', freePlan: false, proPlan: true },
    { name: 'API Access', freePlan: false, proPlan: true },
    { name: 'Priority Support', freePlan: false, proPlan: true }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container>
        {/* Header Row */}
        <Grid item xs={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" color="text.secondary">Feature</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Free Plan</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ p: 2, bgcolor: '#f5f1ff', position: 'relative' }}>
            <Typography variant="h6">Pro Plan</Typography>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                right: 16,
                transform: 'translateY(-50%)',
                bgcolor: '#8B3DFF',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 4,
                fontSize: '0.875rem'
              }}
            >
              Best Value
            </Box>
          </Box>
        </Grid>

        {/* Feature Rows */}
        {features.map((feature, index) => (
          <React.Fragment key={index}>
            <Grid item xs={4}>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography>{feature.name}</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                {typeof feature.freePlan === 'boolean' ? (
                  feature.freePlan ? 
                    <CheckIcon sx={{ color: 'success.main' }} /> : 
                    <CloseIcon sx={{ color: 'error.main' }} />
                ) : (
                  <Typography>{feature.freePlan}</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: '#f5f1ff' }}>
                {typeof feature.proPlan === 'boolean' ? (
                  feature.proPlan ? 
                    <CheckIcon sx={{ color: 'success.main' }} /> : 
                    <CloseIcon sx={{ color: 'error.main' }} />
                ) : (
                  <Typography>{feature.proPlan}</Typography>
                )}
              </Box>
            </Grid>
          </React.Fragment>
        ))}

        {/* Price Row */}
        <Grid item xs={4}>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Price</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6">$0/month</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: '#f5f1ff' }}>
            <Typography variant="h6">$19.99/month</Typography>
            <Button 
              variant="contained"
              fullWidth
              sx={{ 
                mt: 2,
                bgcolor: '#8B3DFF',
                borderRadius: '50px',
                '&:hover': {
                  bgcolor: '#7B2FEF'
                }
              }}
              component="a"
              href="https://buy.stripe.com/test_bIY3eN9mh9hv95SbIJ"
              target="_blank"
              rel="noopener noreferrer"
            >
              Upgrade to Pro
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};