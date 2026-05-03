import { NextApiRequest, NextApiResponse } from 'next';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69efa226000db23fcd89';

function appwriteHeaders() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  };
}

async function verifyAppWriteSession(userId: string, sessionSecret: string): Promise<boolean> {
  const res = await fetch(`${APPWRITE_ENDPOINT}/account`, {
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Session': sessionSecret,
    },
  });
  if (!res.ok) return false;
  const account = await res.json();
  return account.$id === userId;
}

async function saveSubscriptionPrefs(userId: string, prefs: Record<string, any>) {
  const res = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
    method: 'PATCH',
    headers: appwriteHeaders(),
    body: JSON.stringify({ prefs }),
  });
  return res.ok;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tier, provider, subscriptionId, userId, appwriteSession } = req.body;

    if (!userId || !appwriteSession) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify AppWrite session
    const isValid = await verifyAppWriteSession(userId, appwriteSession);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (!tier || !['free', 'basic', 'pro'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Save subscription to AppWrite user preferences
    const now = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);

    await saveSubscriptionPrefs(userId, {
      subscription: {
        tier,
        status: 'active',
        provider: provider || 'direct',
        subscriptionId: subscriptionId || `direct_${Date.now()}`,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: expiry.toISOString(),
        updatedAt: now.toISOString(),
      },
    });

    console.log('[Upgrade] Subscription saved for user:', userId, 'tier:', tier);

    return res.status(200).json({
      success: true,
      message: 'Subscription upgraded successfully',
      tier,
    });
  } catch (error: any) {
    console.error('[Upgrade] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
