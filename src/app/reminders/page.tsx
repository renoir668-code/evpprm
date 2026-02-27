import { getPartners, getCustomReminders, getSettings } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { Calendar } from 'lucide-react';
import { ReminderFilter } from './ReminderFilter';
import { PartnerReminderGroup } from './PartnerReminderGroup';

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ owner?: string }> }) {
    const params = await searchParams;
    const owner = params?.owner || '';
    const partners = await getPartners();
    const customRemindersData = await getCustomReminders();
    const settings = await getSettings();
    const teamSetting = settings.find((s) => s.key === 'team')?.value || 'Admin, Sales, Support';
    const availableTeam = teamSetting.split(',').map((s) => s.trim()).filter(Boolean);

    const now = new Date();

    // Group everything by partner
    const groupedData = partners
        .filter(p => p.health_status !== 'Dormant')
        .filter(p => !owner || p.key_person_id === owner)
        .map(p => {
            const partnerCustomReminders = customRemindersData.filter(cr => cr.partner_id === p.id);

            // Calculate attention status
            const lastInteractionDate = p.last_interaction_date ? new Date(p.last_interaction_date) : null;
            const dismissedAtDate = p.dismissed_at ? new Date(p.dismissed_at) : null;

            // The "last touch" is the latest of interaction or dismissal
            let lastTouch = null;
            if (lastInteractionDate && dismissedAtDate) {
                lastTouch = lastInteractionDate > dismissedAtDate ? lastInteractionDate : dismissedAtDate;
            } else {
                lastTouch = lastInteractionDate || dismissedAtDate;
            }

            let daysSinceLastTouch: number | 'Never' = 'Never';
            let daysRemaining = -Infinity;
            if (lastTouch) {
                daysSinceLastTouch = Math.floor((now.getTime() - lastTouch.getTime()) / (1000 * 3600 * 24));
                daysRemaining = p.needs_attention_days - daysSinceLastTouch;
            }

            let status: 'overdue' | 'upcoming' | 'good' = 'good';
            if (daysSinceLastTouch === 'Never' || daysSinceLastTouch > p.needs_attention_days) {
                status = 'overdue';
            } else if (p.needs_attention_days - daysSinceLastTouch <= 7) {
                status = 'upcoming';
            }

            const attentionReminder = status !== 'good' ? {
                daysSinceLastTouch,
                daysRemaining,
                status
            } : null;

            return {
                partner: p,
                customReminders: partnerCustomReminders,
                attentionReminder,
                maxUrgency: status === 'overdue' ? 2 : (status === 'upcoming' || partnerCustomReminders.length > 0 ? 1 : 0)
            };
        })
        .filter(group => group.customReminders.length > 0 || group.attentionReminder !== null);

    // Sort: most urgent first (overdue > upcoming > others)
    groupedData.sort((a, b) => {
        if (b.maxUrgency !== a.maxUrgency) return b.maxUrgency - a.maxUrgency;
        const aRem = a.attentionReminder?.daysRemaining ?? 999;
        const bRem = b.attentionReminder?.daysRemaining ?? 999;
        return aRem - bRem;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reminders</h1>
                    <p className="text-slate-500 mt-2">Grouped by partner for a cleaner workflow.</p>
                </div>
                <ReminderFilter availableTeam={availableTeam} initialOwner={owner} />
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                {groupedData.length === 0 ? (
                    <div className="px-6 py-24 text-center text-slate-500">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-white">
                            <Calendar className="w-10 h-10" />
                        </div>
                        <p className="font-extrabold text-slate-900 text-2xl">You're all caught up!</p>
                        <p className="text-slate-500 mt-2 text-lg font-medium">No partners require immediate follow-up today.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {groupedData.map((group) => (
                            <PartnerReminderGroup key={group.partner.id} group={group} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
