import { getPartners, getCustomReminders, getSettings, getCurrentUserDetails } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { Calendar, Users } from 'lucide-react';
import { ReminderFilter } from './ReminderFilter';
import { PartnerReminderGroup } from './PartnerReminderGroup';
import { getDict } from '@/lib/i18n';

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ owner?: string }> }) {
    const params = await searchParams;
    const owner = params?.owner || '';
    const partners = await getPartners();
    const customRemindersData = await getCustomReminders();
    const settings = await getSettings();
    const userDetails = await getCurrentUserDetails();
    const dict = await getDict();

    // User's relevant identifiers
    const userKP = userDetails?.linked_key_person;
    const userGroupIds = userDetails?.workgroups.map(g => g.id) || [];
    const isAdmin = userDetails?.role === 'Admin';

    const teamSetting = settings.find((s) => s.key === 'team')?.value || 'Admin, Sales, Support';
    const availableTeam = teamSetting.split(',').map((s) => s.trim()).filter(Boolean);

    const now = new Date();

    // Group everything by partner
    const allReminders = partners
        .filter(p => p.health_status !== 'Dormant')
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

    const personalReminders = allReminders.filter(g => {
        if (owner) return g.partner.key_person_id === owner;
        return userKP && g.partner.key_person_id === userKP;
    });

    const teamReminders = allReminders.filter(g => {
        if (owner) return false; // If filtering by owner, only show that owner's
        return userGroupIds.includes(g.partner.key_person_id || '') && g.partner.key_person_id !== userKP;
    });

    const sortFn = (a: any, b: any) => {
        if (b.maxUrgency !== a.maxUrgency) return b.maxUrgency - a.maxUrgency;
        const aRem = a.attentionReminder?.daysRemaining ?? 999;
        const bRem = b.attentionReminder?.daysRemaining ?? 999;
        return aRem - bRem;
    };

    personalReminders.sort(sortFn);
    teamReminders.sort(sortFn);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.reminders.title}</h1>
                    <p className="text-slate-500 mt-2">{dict.reminders.subtitle}</p>
                </div>
                <ReminderFilter availableTeam={availableTeam} initialOwner={owner} />
            </div>

            {/* Personal Reminders */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 px-2 font-bold uppercase tracking-widest text-[10px]">
                    <Calendar className="w-3 h-3" />
                    {dict.reminders.personalReminders}
                </div>
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    {personalReminders.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">
                            <p className="font-bold text-slate-400">{dict.reminders.noPersonalReminders}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {personalReminders.map((group) => (
                                <PartnerReminderGroup key={group.partner.id} group={group} dict={dict} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Team Reminders */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-indigo-500 px-2 font-bold uppercase tracking-widest text-[10px]">
                    <Users className="w-3 h-3" />
                    {dict.reminders.teamReminders}
                </div>
                <div className="bg-white rounded-[32px] border border-indigo-100 shadow-xl shadow-indigo-100/50 overflow-hidden">
                    {teamReminders.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">
                            <p className="font-bold text-slate-400">{dict.reminders.noTeamReminders}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {teamReminders.map((group) => (
                                <PartnerReminderGroup key={group.partner.id} group={group} dict={dict} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
