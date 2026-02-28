import { NextResponse } from 'next/server';
import { getPartners, getCustomReminders } from '@/lib/actions';
import { query } from '@/lib/db';
import { webpush } from '@/lib/webpush';

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const partners = await getPartners();
        const customReminders = await getCustomReminders();
        const now = new Date();

        let notificationsSent = 0;

        for (const p of partners) {
            if (p.health_status === 'Dormant') continue;

            const notifyIds = new Set<string>();
            if (p.owner_id) notifyIds.add(p.owner_id);

            const kpRes = await query('SELECT id FROM users WHERE lower(name) = $1', [(p.key_person_id || '').toLowerCase()]);
            if (kpRes.rows && kpRes.rows.length > 0) {
                notifyIds.add(kpRes.rows[0].id);
            }

            if (notifyIds.size === 0) continue;

            let shouldNotify = false;
            let title = '';
            let body = '';

            let lastTouch = p.last_interaction_date ? new Date(p.last_interaction_date) : null;
            let dismissed = p.dismissed_at ? new Date(p.dismissed_at) : null;
            let latest = lastTouch && dismissed ? (lastTouch > dismissed ? lastTouch : dismissed) : (lastTouch || dismissed);

            let daysSince = Infinity;
            if (latest) {
                daysSince = Math.floor((now.getTime() - latest.getTime()) / (1000 * 3600 * 24));
            }

            if (daysSince > p.needs_attention_days) {
                shouldNotify = true;
                title = `Partner Attention Required: ${p.name}`;
                body = `It has been ${daysSince === Infinity ? 'never' : daysSince + ' days'} since the last interaction.`;
            }

            const pendingReminders = customReminders.filter(cr => cr.partner_id === p.id && !cr.completed);
            for (const cr of pendingReminders) {
                const due = new Date(cr.due_date);
                if (now >= due) {
                    shouldNotify = true;
                    title = `Reminder: ${p.name}`;
                    body = cr.title;
                    break;
                }
            }

            if (shouldNotify) {
                for (const uid of notifyIds) {
                    const subRes = await query('SELECT * FROM web_push_subscriptions WHERE user_id = $1', [uid]);
                    for (const sub of (subRes.rows || [])) {
                        try {
                            await webpush.sendNotification({
                                endpoint: sub.endpoint,
                                keys: {
                                    p256dh: sub.p256dh,
                                    auth: sub.auth
                                }
                            }, JSON.stringify({
                                title,
                                body,
                                url: `/reminders`
                            }));
                            notificationsSent++;
                        } catch (pushErr: any) {
                            if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                                await query('DELETE FROM web_push_subscriptions WHERE id = $1', [sub.id]);
                            } else {
                                console.log('Error sending push', pushErr);
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, sent: notificationsSent });

    } catch (e: any) {
        console.error('Cron error:', e);
        return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
    }
}
