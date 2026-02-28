'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, ArrowRight, Clock, CheckCircle, ChevronDown, ChevronUp, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dismissPartnerReminder } from '@/lib/actions';
import { Partner, CustomReminder } from '@/lib/types';

interface GroupedReminder {
    partner: Partner;
    customReminders: CustomReminder[];
    attentionReminder: {
        daysSinceLastTouch: number | 'Never';
        daysRemaining: number;
        status: 'overdue' | 'upcoming' | 'good';
    } | null;
}

export function PartnerReminderGroup({ group, dict }: { group: GroupedReminder, dict: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const { partner, customReminders, attentionReminder } = group;

    const hasUrgent = attentionReminder?.status === 'overdue' || customReminders.some(cr => new Date(cr.due_date) < new Date());

    async function handleDismiss(e: React.MouseEvent) {
        e.stopPropagation();
        if (isDismissing) return;
        setIsDismissing(true);
        try {
            await dismissPartnerReminder(partner.id);
        } finally {
            setIsDismissing(false);
        }
    }

    return (
        <div className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="p-6 flex items-center justify-between group relative">
                <div className="flex items-center gap-4 flex-1">
                    <Link
                        href={`/partners/${partner.id}`}
                        className={cn(
                            "w-12 h-12 rounded-xl border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden hover:scale-105 transition-transform shadow-sm",
                            hasUrgent ? "bg-amber-100 text-amber-600 border-amber-200" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                        )}
                    >
                        {partner.logo_url ? (
                            <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-lg">{partner.name.charAt(0).toUpperCase()}</span>
                        )}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link
                            href={`/partners/${partner.id}`}
                            className="text-lg font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors truncate block"
                        >
                            {partner.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider",
                                hasUrgent ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            )}>
                                {customReminders.length + (attentionReminder ? 1 : 0)} {dict.reminders.activeReminders}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                        {customReminders.length > 0 && (
                            <p className="text-sm font-bold text-indigo-600 mb-1">
                                {customReminders.length} {dict.reminders.upcoming}
                            </p>
                        )}
                        {attentionReminder && attentionReminder.status === 'overdue' && (
                            <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md border border-amber-100 text-[10px] uppercase tracking-wider">
                                {dict.reminders.overdue}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="px-6 pb-6 pt-2 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100">
                        {/* Attention Threshold Reminder */}
                        {attentionReminder && (
                            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-xl border",
                                        attentionReminder.status === 'overdue' ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 border-amber-100" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-100"
                                    )}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{dict.reminders.standardFollowUp}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {dict.reminders.lastInteractionOrDismissal} <span className="font-bold text-slate-700 dark:text-slate-200">{attentionReminder.daysSinceLastTouch === 'Never' ? dict.common.never : `${attentionReminder.daysSinceLastTouch} ${dict.common.daysAgo || 'days ago'}`}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDismiss}
                                        disabled={isDismissing}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        <BellOff className="w-3.5 h-3.5" />
                                        <span>{dict.reminders.dismiss}</span>
                                    </button>
                                    <Link href={`/partners/${partner.id}`} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Custom Reminders */}
                        {customReminders.map(cr => (
                            <div key={cr.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-100">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{cr.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {dict.reminders.goalDate} <span className="font-bold text-emerald-600">{new Date(cr.due_date).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>
                                <Link href={`/partners/${partner.id}`} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
