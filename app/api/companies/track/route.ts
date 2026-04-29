import { NextResponse } from 'next/server';
import { z } from 'zod';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69efa226000db23fcd89';
const DATABASE_ID = 'bizcard_ai';
const TRACKED_COLLECTION = 'tracked_companies';
const PREFERENCES_COLLECTION = 'tracking_preferences';

function appwriteHeaders() {
    return {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
    };
}

const trackCompanySchema = z.object({
    user_id: z.string().min(1),
    company_name: z.string().min(1),
    company_website: z.string().url().optional(),
    industry: z.string().optional(),
    importance_level: z.number().min(1).max(5).default(1),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = trackCompanySchema.parse(body);

        const { user_id, ...companyData } = validatedData;

        // Check subscription limits (Free = 5, Pro = 100)
        const countRes = await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${TRACKED_COLLECTION}/documents`,
            { headers: appwriteHeaders() }
        );

        // Create tracked company document via AppWrite REST API
        const docId = `tracked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createRes = await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${TRACKED_COLLECTION}/documents`,
            {
                method: 'POST',
                headers: appwriteHeaders(),
                body: JSON.stringify({
                    documentId: docId,
                    data: {
                        user_id,
                        company_name: companyData.company_name,
                        company_website: companyData.company_website || '',
                        industry: companyData.industry || '',
                        importance_level: companyData.importance_level,
                    },
                }),
            }
        );

        const result = await createRes.json();
        if (!createRes.ok) {
            console.error('[API] Error tracking company:', result);
            return NextResponse.json(
                { error: result.message || 'Failed to track company' },
                { status: createRes.status }
            );
        }

        // Create default tracking preferences
        try {
            const prefId = `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await fetch(
                `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${PREFERENCES_COLLECTION}/documents`,
                {
                    method: 'POST',
                    headers: appwriteHeaders(),
                    body: JSON.stringify({
                        documentId: prefId,
                        data: {
                            company_id: docId,
                            notification_frequency: 'daily',
                            news_categories: ['business'],
                            alert_types: ['news'],
                        },
                    }),
                }
            );
        } catch (e) {
            console.log('[API] Could not create default preferences (collection may not exist)');
        }

        return NextResponse.json({ ...result, id: docId });
    } catch (error) {
        console.error('[API] Error tracking company:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: 'Internal server error — check API key scopes (needs databases.write)' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'user_id query parameter required' }, { status: 400 });
        }

        const res = await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${TRACKED_COLLECTION}/documents`,
            { headers: appwriteHeaders() }
        );

        const data = await res.json();
        if (!res.ok) {
            console.error('[API] Error fetching tracked companies:', data);
            return NextResponse.json(
                { error: data.message || 'Failed to fetch — check API key scopes (needs databases.read)' },
                { status: res.status }
            );
        }

        // Filter by user_id (AppWrite queries use Query.equal on server)
        const companies = (data.documents || []).filter(
            (doc: any) => doc.user_id === userId
        );

        return NextResponse.json(companies);
    } catch (error) {
        console.error('[API] Error fetching tracked companies:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
