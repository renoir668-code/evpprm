'use client';

import { useState } from 'react';
import { CustomReminder } from '@/lib/types';
import { createCustomReminder, completeCustomReminder } from '@/lib/actions';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

export default function PartnerReminders({ partnerId, initialReminders, dict }: { partnerId: string; initialReminders: CustomReminder[], dict: any }) {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pendingReminders = initialReminders.filter(r => r.completed === 0);
    const completedReminders = initialReminders.filter(r => r.completed === 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !dueDate) return;

        setIsSubmitting(true);
        try {
            await createCustomReminder(partnerId, { title, due_date: dueDate });
            setTitle('');
            setDueDate('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await completeCustomReminder(id);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <section className="bg-white rounded-xl p-5 border border-slate-200 mt-6 overflow-hidden">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                {dict.partnerDetail.customReminders}
            </h2>

            <form onSubmit={handleSubmit} className="mb-6 flex gap-2 w-full">
                <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder={dict.partnerDetail.reminderPlaceholder}
                    title={dict.partnerDetail.reminderTitle}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                />
                <input
                    type="date"
                    required
                    title={dict.partnerDetail.dueDate}
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-36 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600"
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                    Add
                </button>
            </form>

            <div className="space-y-2">
                {pendingReminders.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium pb-2">No pending reminders.</p>
                ) : (
                    pendingReminders.map(r => (
                        <div key={r.id} className="flex flex-wrap items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-sm gap-2 transition-all hover:bg-slate-50">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{r.title}</h4>
                                <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-xs font-medium">
                                    <Calendar className="w-3 h-3" />
                                    <span>Due: {new Date(r.due_date).toLocaleDateString()}</span>
                                    {r.created_at && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span>Created: {new Date(r.created_at).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleComplete(r.id)}
                                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-600 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-200"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Done
                            </button>
                        </div>
                    ))
                )}
            </div>

            {completedReminders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {completedReminders.map(r => (
                            <div key={r.id} className="flex flex-wrap items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 opacity-80 gap-2">
                                <div>
                                    <h4 className="font-medium text-slate-500 line-through text-xs">{r.title}</h4>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-slate-400 text-[10px] font-medium">
                                        {r.created_at && <span>Created: {new Date(r.created_at).toLocaleDateString()}</span>}
                                        <span>•</span>
                                        <span>Due: {new Date(r.due_date).toLocaleDateString()}</span>
                                        {r.completed_at && (
                                            <>
                                                <span>•</span>
                                                <span className="text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Completed: {new Date(r.completed_at).toLocaleDateString()}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
