import { NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69efa226000db23fcd89';
const DATABASE_ID = 'bizcard_ai';

function h() {
    return {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
    };
}

async function createCollectionIfMissing(
    collId: string,
    name: string,
    attributes: Array<{ key: string; type: string; size?: number; required?: boolean; array?: boolean }>
): Promise<string> {
    // Check if collection exists
    const check = await fetch(
        `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collId}`,
        { headers: h() }
    );

    if (check.ok) {
        console.log(`[Setup] Collection ${collId} already exists`);
        return 'exists';
    }

    // Create collection
    const createBody = JSON.stringify({
        collectionId: collId,
        name,
        documentSecurity: true,
        permissions: [
            'read("users")',
            'create("users")',
            'update("users")',
            'delete("users")',
        ],
    });

    const create = await fetch(
        `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections`,
        { method: 'POST', headers: h(), body: createBody }
    );

    if (!create.ok) {
        const err = await create.json();
        throw new Error(`Failed to create collection ${collId}: ${err.message}`);
    }

    console.log(`[Setup] Created collection: ${collId}`);

    // Add attributes
    for (const attr of attributes) {
        try {
            const attrBody = JSON.stringify({
                key: attr.key,
                type: attr.type,
                size: attr.size || 255,
                required: attr.required ?? false,
                array: attr.array ?? false,
            });

            const attrTypeEndpoint = attr.type === 'integer' ? 'integer' :
                attr.type === 'boolean' ? 'boolean' :
                'string';

            const attrRes = await fetch(
                `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collId}/attributes/${attrTypeEndpoint}`,
                { method: 'POST', headers: h(), body: attrBody }
            );

            if (attrRes.ok) {
                console.log(`[Setup]   + attribute: ${attr.key} (${attr.type})`);
            } else {
                const err = await attrRes.json();
                console.log(`[Setup]   ⚠ attribute ${attr.key}: ${err.message}`);
            }
        } catch (e: any) {
            console.log(`[Setup]   ⚠ attribute ${attr.key}: ${e.message}`);
        }
    }

    return 'created';
}

export async function GET() {
    const results: Record<string, string> = {};

    try {
        // 1. tracked_companies
        results.tracked_companies = await createCollectionIfMissing(
            'tracked_companies', 'Tracked Companies',
            [
                { key: 'user_id', type: 'string', size: 255, required: true },
                { key: 'company_name', type: 'string', size: 255, required: true },
                { key: 'company_website', type: 'string', size: 512 },
                { key: 'industry', type: 'string', size: 255 },
                { key: 'importance_level', type: 'integer', required: true },
            ]
        );

        // 2. tracking_preferences
        results.tracking_preferences = await createCollectionIfMissing(
            'tracking_preferences', 'Tracking Preferences',
            [
                { key: 'company_id', type: 'string', size: 255, required: true },
                { key: 'notification_frequency', type: 'string', size: 50 },
                { key: 'news_categories', type: 'string', size: 500, array: true },
                { key: 'alert_types', type: 'string', size: 500, array: true },
            ]
        );

        // 3. user_news_alerts
        results.user_news_alerts = await createCollectionIfMissing(
            'user_news_alerts', 'User News Alerts',
            [
                { key: 'user_id', type: 'string', size: 255, required: true },
                { key: 'article_id', type: 'string', size: 255, required: true },
                { key: 'is_read', type: 'boolean' },
            ]
        );

        // 4. news_articles
        results.news_articles = await createCollectionIfMissing(
            'news_articles', 'News Articles',
            [
                { key: 'title', type: 'string', size: 512, required: true },
                { key: 'content', type: 'string', size: 5000 },
                { key: 'source', type: 'string', size: 255, required: true },
                { key: 'url', type: 'string', size: 1000 },
                { key: 'published_at', type: 'string', size: 255 },
                { key: 'categories', type: 'string', size: 1000, array: true },
                { key: 'related_companies', type: 'string', size: 5000, array: true },
            ]
        );

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('[Setup] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message, results },
            { status: 500 }
        );
    }
}
