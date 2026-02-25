'use client';

import { useState } from 'react';
import { Contact } from '@/lib/types';
import { createContact } from '@/lib/actions';
import { Users, Plus, Mail } from 'lucide-react';

export default function ContactList({ partnerId, initialContacts }: { partnerId: string, initialContacts: Contact[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        await createContact(partnerId, { name, email, role });
        setIsAdding(false);
        setName('');
        setEmail('');
        setRole('');
        setIsSubmitting(false);
    }

    return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Key Contacts
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="p-4 border-b border-slate-100 bg-indigo-50/50 space-y-3">
                    <input required disabled={isSubmitting} type="text" placeholder="Name" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} />
                    <input disabled={isSubmitting} type="email" placeholder="Email" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
                    <input disabled={isSubmitting} type="text" placeholder="Role / Title" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={role} onChange={e => setRole(e.target.value)} />
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" disabled={isSubmitting} onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md disabled:opacity-50 transition-colors">Save</button>
                    </div>
                </form>
            )}

            {initialContacts.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                    No contacts added yet.
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {initialContacts.map(c => (
                        <li key={c.id} className="px-5 py-3 hover:bg-slate-50 transition-colors group">
                            <p className="font-medium text-slate-900">{c.name}</p>
                            {c.role && <p className="text-xs text-slate-500 mt-0.5">{c.role}</p>}
                            {c.email && (
                                <a href={`mailto:${c.email}`} className="text-xs text-indigo-600 hover:text-indigo-800 mt-1.5 flex items-center gap-1.5 w-fit">
                                    <Mail className="w-3.5 h-3.5" /> {c.email}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
