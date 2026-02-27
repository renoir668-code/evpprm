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

export function PartnerReminderGroup({ group }: { group: GroupedReminder }) {
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
        <div className="border-b border-slate-100 last:border-0">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden",
                        hasUrgent ? "bg-amber-100 text-amber-600 border-amber-200" : "bg-indigo-50 text-indigo-600"
                    )}>
                        {partner.logo_url ? (
                            <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-lg">{partner.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {partner.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider",
                                hasUrgent ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            )}>
                                {customReminders.length + (attentionReminder ? 1 : 0)} Active Reminders
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                        {attentionReminder && (
                            <p className="text-sm font-medium text-slate-500">
                                {attentionReminder.status === 'overdue' ?
                                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">Overdue</span> :
                                    <span className="font-bold text-indigo-600">{attentionReminder.daysRemaining} days left</span>
                                }
                            </p>
                        )}
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 transition-all">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-6 pb-6 pt-2 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                        {/* Attention Threshold Reminder */}
                        {attentionReminder && (
                            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-xl border",
                                        attentionReminder.status === 'overdue' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                    )}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Standard Follow-up</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Last interaction or dismissal: <span className="font-bold text-slate-700">{attentionReminder.daysSinceLastTouch === 'Never' ? 'Never' : `${attentionReminder.daysSinceLastTouch} days ago`}</span>
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
                                        <span>Dismiss</span>
                                    </button>
                                    <Link href={`/partners/${partner.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Custom Reminders */}
                        {customReminders.map(cr => (
                            <div key={cr.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{cr.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Goal Date: <span className="font-bold text-emerald-600">{new Date(cr.due_date).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>
                                <Link href={`/partners/${partner.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
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
