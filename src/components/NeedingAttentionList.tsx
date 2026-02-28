'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Partner, Dictionary } from '@/lib/types';

export function NeedingAttentionList({
    items,
    dict
}: {
    items: { partner: Partner, daysSinceLast: number | 'Never' }[],
    dict: Dictionary
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const currentItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (items.length === 0) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="divide-y divide-white/40 dark:divide-slate-700/40 bg-white/10 dark:bg-slate-800/10 flex-1">
                {currentItems.map(({ partner, daysSinceLast }) => (
                    <div key={partner.id} className="px-8 py-6 flex items-center justify-between hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300 group cursor-pointer hover:pl-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white dark:border-slate-800 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                                {partner.logo_url ? (
                                    <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold text-indigo-500">{partner.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <Link href={`/partners/${partner.id}`} className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors drop-shadow-sm">
                                    {partner.name}
                                </Link>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                                    <span>{dict.dashboard.lastInteraction}</span>
                                    <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                                        {daysSinceLast === 'Never' ? dict.dashboard.never : `${daysSinceLast} ${dict.dashboard.daysAgo}`}
                                    </span>
                                    <span className="text-slate-300 mx-1 hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">{dict.dashboard.threshold} <span className="text-slate-700 dark:text-slate-200 font-bold">{partner.needs_attention_days} {dict.dashboard.days}</span></span>
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/partners/${partner.id}`}
                            className="p-3 bg-white dark:bg-slate-800 shadow-sm text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:shadow-lg hover:scale-110 rounded-2xl transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="px-8 py-4 border-t border-white/40 dark:border-slate-700/40 bg-white/20 dark:bg-slate-800/20 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:text-indigo-600 transition-all font-bold"
                            title="Previous"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:text-indigo-600 transition-all font-bold"
                            title="Next"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
