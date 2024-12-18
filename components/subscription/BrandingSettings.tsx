import { useState } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { SubscriptionService } from '@/lib/subscription';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { CustomBranding } from '@/types/subscription';
import { useUser } from '@/lib/hooks/useUser';

export function BrandingSettings() {
  const { user } = useUser();
  const { subscription, error } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<CustomBranding>(
    subscription?.customBranding || {
      logoUrl: '',
      primaryColor: '#000000',
      companyName: '',
    }
  );

  if (subscription?.tier !== 'enterprise') {
    return null;
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Implement file upload to your storage service
    // For now, we'll just use a placeholder URL
    setBranding({
      ...branding,
      logoUrl: URL.createObjectURL(file),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const success = await SubscriptionService.updateBranding(user.id, branding);
      if (success) {
        toast({
          title: 'Branding updated',
          description: 'Your custom branding settings have been saved.',
        });
      } else {
        throw new Error('Failed to update branding');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update branding settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Custom Branding</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="logo">Company Logo</Label>
          <div className="flex items-center gap-4">
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                alt="Company Logo"
                className="w-16 h-16 object-contain"
              />
            )}
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={branding.companyName || ''}
            onChange={(e) =>
              setBranding({ ...branding, companyName: e.target.value })
            }
            placeholder="Enter your company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Brand Color</Label>
          <div className="flex items-center gap-4">
            <Input
              id="primaryColor"
              type="color"
              value={branding.primaryColor || '#000000'}
              onChange={(e) =>
                setBranding({ ...branding, primaryColor: e.target.value })
              }
              className="w-20"
            />
            <Input
              value={branding.primaryColor || '#000000'}
              onChange={(e) =>
                setBranding({ ...branding, primaryColor: e.target.value })
              }
              placeholder="#000000"
              className="flex-1"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </form>
    </Card>
  );
} 