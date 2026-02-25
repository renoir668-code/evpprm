import { getPartners, getInteractions, getCustomReminders } from '@/lib/actions';
import Link from 'next/link';
import { Calendar, AlertCircle, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function RemindersPage() {
    const partners = await getPartners();
    const customRemindersData = await getCustomReminders();

    const now = new Date();
    const reminders = [];

    // Add custom reminders
    for (const cr of customRemindersData) {
        const p = partners.find(p => p.id === cr.partner_id);
        if (!p || p.health_status === 'Dormant') continue;

        const dueDate = new Date(cr.due_date);
        const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        let status = 'upcoming';
        if (daysRemaining < 0) status = 'overdue';

        reminders.push({
            id: 'custom-' + cr.id,
            partner: p,
            customReminder: cr,
            daysSinceLast: 'N/A',
            daysRemaining,
            status: status as 'overdue' | 'upcoming'
        });
    }

    for (const p of partners) {
        if (p.health_status === 'Dormant') continue;

        const interactions = await getInteractions(p.id);
        const lastInteraction = interactions[0];

        let daysSinceLast = Infinity;
        if (lastInteraction) {
            const lastDate = new Date(lastInteraction.date);
            daysSinceLast = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        }

        // Determine status
        let status = 'good';
        if (daysSinceLast > p.needs_attention_days) {
            status = 'overdue';
        } else if (p.needs_attention_days - daysSinceLast <= 7) {
            status = 'upcoming'; // within 7 days
        }

        if (status !== 'good') {
            reminders.push({
                id: 'attention-' + p.id,
                partner: p,
                customReminder: null,
                daysSinceLast: daysSinceLast === Infinity ? 'Never' : daysSinceLast,
                daysRemaining: daysSinceLast === Infinity ? -Infinity : p.needs_attention_days - daysSinceLast,
                status: status as 'overdue' | 'upcoming'
            });
        }
    }

    // Sort: overdue first (most negative remaining), then upcoming
    reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reminders</h1>
                <p className="text-slate-500 mt-2">Stay on top of your partner relationships.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {reminders.length === 0 ? (
                    <div className="px-6 py-16 text-center text-slate-500">
                        <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-6 h-6" />
                        </span>
                        <p className="font-medium text-slate-900 text-lg">You're all caught up!</p>
                        <p className="text-sm mt-1 max-w-sm mx-auto">No partners require immediate follow-up. Check back later or adjust attention thresholds.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {reminders.map(({ id, partner, customReminder, daysSinceLast, daysRemaining, status }) => (
                            <div key={id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 mt-1 sm:mt-0 shadow-sm border border-white",
                                        status === 'overdue' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                                    )}>
                                        {status === 'overdue' ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            <Link href={`/partners/${partner.id}`}>{partner.name}</Link>
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {customReminder ? (
                                                <span className="font-bold flex items-center gap-1.5 text-slate-700">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {customReminder.title}
                                                </span>
                                            ) : status === 'overdue' ? (
                                                <>Overdue by <span className="font-medium text-amber-600">{Math.abs(daysRemaining)} days</span></>
                                            ) : (
                                                <>Follow up due in <span className="font-medium text-indigo-600">{daysRemaining} days</span></>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                                            {customReminder && (
                                                <span className={cn("font-medium", status === 'overdue' ? "text-red-500" : "text-indigo-500")}>
                                                    Due: {new Date(customReminder.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                            {!customReminder && (
                                                <span>Last interaction: {daysSinceLast === 'Never' ? 'Never' : `${daysSinceLast} days ago`}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="pl-16 sm:pl-0 flex items-center gap-3">
                                    <Link
                                        href={`/partners/${partner.id}`}
                                        className="shrink-0 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        View Details
                                    </Link>
                                    <Link
                                        href={`/partners/${partner.id}`}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors bg-white border border-transparent shadow-sm"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
