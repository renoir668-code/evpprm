'use client';

import { useState } from 'react';
import { Contact } from '@/lib/types';
import { createContact, updateContact, deleteContact } from '@/lib/actions';
import { Users, Plus, Mail, Edit2, Trash2, Loader2 } from 'lucide-react';

export default function ContactList({ partnerId, initialContacts, dict }: { partnerId: string, initialContacts: Contact[], dict: any }) {
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
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    {dict.partnerDetail.keyContacts}
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                    title={dict.common.add}
                >
                    <Plus className="w-3.5 h-3.5" /> {dict.common.add}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="p-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 space-y-3">
                    <input required disabled={isSubmitting} type="text" placeholder={dict.partnerDetail.contactName} title={dict.partnerDetail.contactName} className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} />
                    <input disabled={isSubmitting} type="email" placeholder={dict.partnerDetail.contactEmail} title={dict.partnerDetail.contactEmail} className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
                    <input disabled={isSubmitting} type="text" placeholder={dict.partnerDetail.contactRole} title={dict.partnerDetail.contactRole} className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={role} onChange={e => setRole(e.target.value)} />
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" disabled={isSubmitting} onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">{dict.common.cancel}</button>
                        <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md disabled:opacity-50 transition-colors">{dict.common.save}</button>
                    </div>
                </form>
            )}

            {initialContacts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                    {dict.partnerDetail.noContacts}
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {initialContacts.map(c => (
                        <ContactItem key={c.id} contact={c} dict={dict} />
                    ))}
                </ul>
            )}
        </section>
    );
}

function ContactItem({ contact, dict }: { contact: Contact, dict: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [name, setName] = useState(contact.name);
    const [email, setEmail] = useState(contact.email || '');
    const [role, setRole] = useState(contact.role || '');

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            await updateContact(contact.id, { name, email, role });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm(dict.common.deleteConfirm || 'Are you sure you want to delete this contact?')) return;
        setIsDeleting(true);
        try {
            await deleteContact(contact.id);
        } catch (err) {
            console.error(err);
            setIsDeleting(false);
        }
    }

    if (isEditing) {
        return (
            <li className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-0 relative">
                <form onSubmit={handleSave} className="space-y-3">
                    <input required disabled={isSaving} type="text" placeholder={dict.partnerDetail.contactName} className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} />
                    <input disabled={isSaving} type="email" placeholder={dict.partnerDetail.contactEmail} className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
                    <input disabled={isSaving} type="text" placeholder={dict.partnerDetail.contactRole} className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" value={role} onChange={e => setRole(e.target.value)} />
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" disabled={isSaving} onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors text-xs font-medium">{dict.common.cancel}</button>
                        <button type="submit" disabled={isSaving} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md disabled:opacity-50 transition-colors text-xs font-bold flex items-center gap-1.5">
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {dict.common.save}
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{contact.name}</p>
                    {contact.role && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{contact.role}</p>}
                    {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-xs text-indigo-600 hover:text-indigo-800 mt-1.5 flex items-center gap-1.5 w-fit">
                            <Mail className="w-3.5 h-3.5" /> {contact.email}
                        </a>
                    )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(true)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors" title={dict.common.edit}>
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="text-slate-400 dark:text-slate-500 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title={dict.common.delete}>
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
        </li>
    );
}
