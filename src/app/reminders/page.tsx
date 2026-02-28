import { getPartners, getCustomReminders, getSettings, getCurrentUserDetails, getUsers } from '@/lib/actions';
import { User } from '@/lib/types';
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
    const userKP = (userDetails?.linked_key_person || userDetails?.name || '').toLowerCase();
    const isAdmin = userDetails?.role === 'Admin';
    const allUsers = await getUsers();

    // Map KP strings to User objects for hierarchy lookup
    const kpToUsers: Record<string, User[]> = {};
    allUsers.forEach(u => {
        const kp = (u.linked_key_person || u.name || '').toLowerCase();
        if (kp) {
            if (!kpToUsers[kp]) kpToUsers[kp] = [];
            kpToUsers[kp].push(u);
        }
    });

    // Get workgroup visibility context (Team members' IDs and their linked KPs)
    const teamKPs = new Set<string>();
    const teamUserIds = new Set<string>();

    if (userDetails) {
        teamUserIds.add(userDetails.id);
        if (userKP) teamKPs.add(userKP);

        for (const wg of userDetails.workgroups) {
            for (const memberId of wg.member_ids) {
                teamUserIds.add(memberId);
                const u = allUsers.find(x => x.id === memberId);
                if (u) {
                    const kp = (u.linked_key_person || u.name || '').toLowerCase();
                    if (kp) teamKPs.add(kp);
                }
            }
        }
    }

    const teamSetting = settings.find((s) => s.key === 'team')?.value || 'Admin, Sales, Support';
    const availableTeamStrings = teamSetting.split(',').map((s) => s.trim()).filter(Boolean);

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
            } else if (daysSinceLastTouch >= 0 && (p.needs_attention_days - (daysSinceLastTouch as number)) <= 7) {
                // If we've touched it today, but the threshold is very low (e.g. 7 days or less), 
                // it might show as upcoming. Usually users want 0 days ago to be "clean".
                if (daysSinceLastTouch === 0 && p.needs_attention_days > 0) {
                    status = 'good';
                } else {
                    status = 'upcoming';
                }
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

    // Initial filtering based on visibility (Admin sees all, User sees self + team)
    let filteredReminders = allReminders.filter(g => {
        if (isAdmin) return true;
        if (!userDetails) return false;

        const partnerKP = g.partner.key_person_id?.toLowerCase();
        const partnerOwnerId = g.partner.owner_id;

        const isAssignedToMeOrTeam = partnerKP && teamKPs.has(partnerKP);
        const isOwnedByMeOrTeam = partnerOwnerId && teamUserIds.has(partnerOwnerId);

        return isAssignedToMeOrTeam || isOwnedByMeOrTeam;
    });

    // Apply the dropdown filter (Hierarchy: Match KP string OR Ownership by user linked to that KP)
    if (owner) {
        const ownerLower = owner.toLowerCase();
        const linkedUserIds = (kpToUsers[ownerLower] || []).map(u => u.id);

        filteredReminders = filteredReminders.filter(g => {
            const partnerKP = g.partner.key_person_id?.toLowerCase();
            const partnerOwnerId = g.partner.owner_id;

            const matchesKP = partnerKP === ownerLower;
            const matchesOwnerHierarchy = partnerOwnerId && linkedUserIds.includes(partnerOwnerId);

            return matchesKP || matchesOwnerHierarchy;
        });
    }

    // Split into categories (Personal vs Team)
    const personalReminders = filteredReminders.filter(g => {
        const partnerKP = g.partner.key_person_id?.toLowerCase();
        const partnerOwnerId = g.partner.owner_id;

        const isMyKP = partnerKP && userKP && partnerKP === userKP;
        const isMyOwnership = partnerOwnerId === userDetails?.id;

        return isMyKP || isMyOwnership;
    });

    const teamReminders = filteredReminders.filter(g => {
        const partnerKP = g.partner.key_person_id?.toLowerCase();
        const partnerOwnerId = g.partner.owner_id;

        const isMyKP = partnerKP && userKP && partnerKP === userKP;
        const isMyOwnership = partnerOwnerId === userDetails?.id;

        // If it's in personal, don't show in team section
        return !(isMyKP || isMyOwnership);
    });

    const sortFn = (a: any, b: any) => {
        if (b.maxUrgency !== a.maxUrgency) return b.maxUrgency - a.maxUrgency;
        const aRem = a.attentionReminder?.daysRemaining ?? 999;
        const bRem = b.attentionReminder?.daysRemaining ?? 999;
        return aRem - bRem;
    };

    personalReminders.sort(sortFn);
    teamReminders.sort(sortFn);

    // Prepare dropdown options for the filter
    const filterOptions = isAdmin
        ? Array.from(new Set([...availableTeamStrings, ...allUsers.map(u => u.linked_key_person || u.name)])).filter(Boolean).sort()
        : Array.from(new Set([...allUsers.filter(u => teamUserIds.has(u.id)).map(u => u.linked_key_person || u.name)])).filter(Boolean).sort();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{dict.reminders.title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{dict.reminders.subtitle}</p>
                </div>
                <ReminderFilter availableTeam={filterOptions} initialOwner={owner} dict={dict} />
            </div>

            {/* Personal Reminders */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 px-2 font-bold uppercase tracking-widest text-[10px]">
                    <Calendar className="w-3 h-3" />
                    {dict.reminders.personalReminders}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 overflow-hidden">
                    {personalReminders.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            <p className="font-bold text-slate-400 dark:text-slate-500">{dict.reminders.noPersonalReminders}</p>
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
                <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-indigo-100 dark:border-slate-700/50 shadow-xl shadow-indigo-100/50 overflow-hidden">
                    {teamReminders.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            <p className="font-bold text-slate-400 dark:text-slate-500">{dict.reminders.noTeamReminders}</p>
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
