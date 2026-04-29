import { NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69efa226000db23fcd89';
const DATABASE_ID = 'bizcard_ai';
const NEWS_COLLECTION = 'news_articles';
const ALERTS_COLLECTION = 'user_news_alerts';

function appwriteHeaders() {
    return {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Fetch news articles from AppWrite
        const res = await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${NEWS_COLLECTION}/documents?orderField=$createdAt&orderType=DESC&limit=${limit}&offset=${offset}`,
            { headers: appwriteHeaders() }
        );

        const data = await res.json();
        if (!res.ok) {
            console.error('[API] Error fetching news feed:', data);
            return NextResponse.json(
                { error: data.message || 'Failed to fetch — check API key scopes (needs databases.read)' },
                { status: res.status }
            );
        }

        let articles = data.documents || [];

        // Filter by company if specified (AppWrite REST API doesn't support array contains)
        if (companyId) {
            articles = articles.filter((a: any) =>
                a.related_companies?.includes?.(companyId)
            );
        }

        const total = data.total || articles.length;

        return NextResponse.json({
            articles,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[API] Error fetching news feed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.title || !body.source) {
            return NextResponse.json(
                { error: 'title and source are required' },
                { status: 400 }
            );
        }

        const docId = `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const res = await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${NEWS_COLLECTION}/documents`,
            {
                method: 'POST',
                headers: appwriteHeaders(),
                body: JSON.stringify({
                    documentId: docId,
                    data: {
                        title: body.title,
                        content: body.content || '',
                        source: body.source,
                        url: body.url || '',
                        published_at: body.published_at || new Date().toISOString(),
                        categories: body.categories || [],
                        related_companies: body.related_companies || [],
                    },
                }),
            }
        );

        const result = await res.json();
        if (!res.ok) {
            console.error('[API] Error creating news article:', result);
            return NextResponse.json(
                { error: result.message || 'Failed to create article' },
                { status: res.status }
            );
        }

        return NextResponse.json({ ...result, id: docId });
    } catch (error) {
        console.error('[API] Error creating news article:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
