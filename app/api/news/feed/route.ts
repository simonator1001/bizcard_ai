import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createServerComponentClient({ cookies });
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get URL parameters
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Check subscription for news history access
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_type')
            .eq('user_id', session.user.id)
            .single();

        const daysLimit = subscription?.plan_type === 'pro' ? 30 : 7;
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - daysLimit);

        // Build query
        let query = supabase
            .from('news_articles')
            .select(`
                *,
                user_news_alerts!inner (
                    id,
                    is_read
                )
            `, { count: 'exact' })
            .eq('user_news_alerts.user_id', session.user.id)
            .gte('published_at', dateLimit.toISOString())
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by company if specified
        if (companyId) {
            query = query.contains('related_companies', [companyId]);
        }

        const { data: articles, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            articles,
            pagination: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching news feed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createServerComponentClient({ cookies });
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Validate and insert news article
        const body = await request.json();
        const { data: article, error } = await supabase
            .from('news_articles')
            .insert(body)
            .select()
            .single();

        if (error) throw error;

        // Create alerts for users tracking related companies
        const { data: usersToAlert } = await supabase
            .from('tracked_companies')
            .select('user_id')
            .contains('related_companies', body.related_companies);

        if (usersToAlert?.length) {
            const alerts = usersToAlert.map(user => ({
                user_id: user.user_id,
                article_id: article.id,
                is_read: false
            }));

            const { error: alertError } = await supabase
                .from('user_news_alerts')
                .insert(alerts);

            if (alertError) throw alertError;
        }

        return NextResponse.json(article);
    } catch (error) {
        console.error('Error creating news article:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 