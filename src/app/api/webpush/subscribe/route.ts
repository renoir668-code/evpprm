import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subscription = await req.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        const p256dh = subscription.keys?.p256dh;
        const auth = subscription.keys?.auth;

        if (!p256dh || !auth) {
            return NextResponse.json({ error: 'Invalid keys' }, { status: 400 });
        }

        await query('DELETE FROM web_push_subscriptions WHERE user_id = $1 AND endpoint = $2', [session.userId, subscription.endpoint]);

        await query(
            'INSERT INTO web_push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4, $5)',
            [randomUUID(), session.userId, subscription.endpoint, p256dh, auth]
        );

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Subscription error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
