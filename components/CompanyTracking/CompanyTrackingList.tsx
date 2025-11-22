'use client';

import React, { useState } from 'react';
import { useCompanyTracking } from '@/contexts/CompanyTrackingContext';
import { TrackedCompany, TrackingPreference } from '@/types/company-tracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { trackCompany as trackCompanyAction } from '@/app/actions/company-tracking';

export function CompanyTrackingList() {
    const { state, untrackCompany, updateTrackingPreference } = useCompanyTracking();
    const [newCompany, setNewCompany] = useState({
        company_name: '',
        company_website: '',
        industry: '',
        importance_level: 1,
    });

    const handleTrackCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Use the server action instead of context
            const { data, error } = await trackCompanyAction(newCompany);
            
            if (error) {
                console.error('[CompanyTrackingList] Error tracking company:', error);
                toast.error(`Failed to track company: ${error}`);
                return;
            }
            
            setNewCompany({
                company_name: '',
                company_website: '',
                industry: '',
                importance_level: 1,
            });
            toast.success('Company tracked successfully');
            
            // Refresh the page to update the list with the new company
            window.location.reload();
        } catch (error) {
            console.error('[CompanyTrackingList] Exception tracking company:', error);
            toast.error('Failed to track company');
        }
    };

    const handleUntrackCompany = async (companyId: string) => {
        try {
            await untrackCompany(companyId);
            toast.success('Company untracked successfully');
        } catch (error) {
            toast.error('Failed to untrack company');
        }
    };

    const handleUpdatePreference = async (
        companyId: string,
        preference: Partial<TrackingPreference>
    ) => {
        try {
            await updateTrackingPreference({
                company_id: companyId,
                notification_frequency: preference.notification_frequency || 'daily',
                news_categories: preference.news_categories || ['business'],
                alert_types: preference.alert_types || ['news'],
            });
            toast.success('Tracking preferences updated');
        } catch (error) {
            toast.error('Failed to update tracking preferences');
        }
    };

    if (state.loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Track New Company</h2>
                <form onSubmit={handleTrackCompany} className="space-y-4">
                    <div>
                        <Input
                            type="text"
                            placeholder="Company Name"
                            value={newCompany.company_name}
                            onChange={(e) =>
                                setNewCompany({
                                    ...newCompany,
                                    company_name: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <Input
                            type="url"
                            placeholder="Company Website"
                            value={newCompany.company_website}
                            onChange={(e) =>
                                setNewCompany({
                                    ...newCompany,
                                    company_website: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <Input
                            type="text"
                            placeholder="Industry"
                            value={newCompany.industry}
                            onChange={(e) =>
                                setNewCompany({
                                    ...newCompany,
                                    industry: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <Select
                            value={newCompany.importance_level.toString()}
                            onValueChange={(value) =>
                                setNewCompany({
                                    ...newCompany,
                                    importance_level: parseInt(value),
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select importance level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Low Importance</SelectItem>
                                <SelectItem value="2">Medium Importance</SelectItem>
                                <SelectItem value="3">High Importance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit">Track Company</Button>
                </form>
            </Card>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Tracked Companies</h2>
                {state.trackedCompanies.filter(company => typeof company.id === 'string' && company.id).map((company) => (
                    <Card key={company.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {company.company_name}
                                </h3>
                                {company.company_website && (
                                    <a
                                        href={company.company_website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {company.company_website}
                                    </a>
                                )}
                                {company.industry && (
                                    <Badge className="ml-2">{company.industry}</Badge>
                                )}
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => handleUntrackCompany(company.id)}
                            >
                                Untrack
                            </Button>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Tracking Preferences</h4>
                            <div className="space-y-2">
                                <Select
                                    value={
                                        state.trackingPreferences[company.id]
                                            ?.notification_frequency || 'daily'
                                    }
                                    onValueChange={(value) =>
                                        handleUpdatePreference(company.id, {
                                            notification_frequency: value as any,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select notification frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="realtime">Real-time</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 