import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const trackCompanySchema = z.object({
    company_name: z.string().min(1),
    company_website: z.string().url().optional(),
    industry: z.string().optional(),
    importance_level: z.number().min(1).max(5).default(1),
});

export async function POST(request: Request) {
    try {
        const supabase = createServerComponentClient({ cookies });
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate request body
        const body = await request.json();
        const validatedData = trackCompanySchema.parse(body);

        // Check subscription limits
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_type')
            .eq('user_id', session.user.id)
            .single();

        const { data: trackedCount } = await supabase
            .from('tracked_companies')
            .select('id', { count: 'exact' })
            .eq('user_id', session.user.id);

        const maxCompanies = subscription?.plan_type === 'pro' ? 100 : 5;
        if ((trackedCount?.length || 0) >= maxCompanies) {
            return NextResponse.json(
                { error: 'Company tracking limit reached. Please upgrade to Pro for unlimited tracking.' },
                { status: 403 }
            );
        }

        // Insert tracked company
        const { data: company, error } = await supabase
            .from('tracked_companies')
            .insert({
                user_id: session.user.id,
                ...validatedData,
            })
            .select()
            .single();

        if (error) throw error;

        // Create default tracking preferences
        const { error: prefError } = await supabase
            .from('tracking_preferences')
            .insert({
                company_id: company.id,
                notification_frequency: 'daily',
                news_categories: ['business'],
                alert_types: ['news'],
            });

        if (prefError) throw prefError;

        return NextResponse.json(company);
    } catch (error) {
        console.error('Error tracking company:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const supabase = createServerComponentClient({ cookies });
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get tracked companies with preferences
        const { data: companies, error } = await supabase
            .from('tracked_companies')
            .select(`
                *,
                tracking_preferences (*)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(companies);
    } catch (error) {
        console.error('Error fetching tracked companies:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 