'use client';

import { useState } from 'react';
import { Contact } from '@/lib/types';
import { createContact, updateContact, deleteContact } from '@/lib/actions';
import { Users, Plus, Mail, Edit2, Trash2, Loader2, Phone } from 'lucide-react';

export default function ContactList({ partnerId, initialContacts, dict }: { partnerId: string, initialContacts: Contact[], dict: any }) {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        await createContact(partnerId, { name, email, phone, role });
        setIsAdding(false);
        setName('');
        setEmail('');
        setPhone('');
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
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
                    title={dict.common.add}
                >
                    <Plus className="w-3.5 h-3.5" /> {dict.common.add}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                    <input required disabled={isSubmitting} type="text" placeholder={dict.partnerDetail.contactName} title={dict.partnerDetail.contactName} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={name} onChange={e => setName(e.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input disabled={isSubmitting} type="email" placeholder={dict.partnerDetail.contactEmail} title={dict.partnerDetail.contactEmail} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
                        <input disabled={isSubmitting} type="text" placeholder={dict.partnerDetail.contactPhone} title={dict.partnerDetail.contactPhone} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <input disabled={isSubmitting} type="text" placeholder={dict.partnerDetail.contactRole} title={dict.partnerDetail.contactRole} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={role} onChange={e => setRole(e.target.value)} />
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" disabled={isSubmitting} onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-all text-xs font-bold uppercase tracking-wide">{dict.common.cancel}</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 transition-all shadow-md active:scale-95 text-xs font-bold uppercase tracking-wide">{dict.common.save}</button>
                    </div>
                </form>
            )}

            {initialContacts.length === 0 ? (
                <div className="p-10 text-center text-slate-500 dark:text-slate-400 italic">
                    {dict.partnerDetail.noContacts}
                </div>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
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
    const [phone, setPhone] = useState(contact.phone || '');
    const [role, setRole] = useState(contact.role || '');

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            await updateContact(contact.id, { name, email, phone, role });
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
            <li className="px-5 py-4 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 last:border-0 relative">
                <form onSubmit={handleSave} className="space-y-3">
                    <input required disabled={isSaving} type="text" placeholder={dict.partnerDetail.contactName} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" value={name} onChange={e => setName(e.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input disabled={isSaving} type="email" placeholder={dict.partnerDetail.contactEmail} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
                        <input disabled={isSaving} type="text" placeholder={dict.partnerDetail.contactPhone} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <input disabled={isSaving} type="text" placeholder={dict.partnerDetail.contactRole} className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" value={role} onChange={e => setRole(e.target.value)} />
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" disabled={isSaving} onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors text-xs font-bold uppercase tracking-wide">{dict.common.cancel}</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 shadow-md active:scale-95 transition-all text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {dict.common.save}
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 group relative">
            <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                    <p className="font-bold text-slate-900 dark:text-white text-base">{contact.name}</p>
                    {contact.role && (
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 w-fit px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                            {contact.role}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                        {contact.email && (
                            <a href={`mailto:${contact.email}`} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                                <Mail className="w-3.5 h-3.5 text-indigo-500/70" /> {contact.email}
                            </a>
                        )}
                        {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                                <Phone className="w-3.5 h-3.5 text-indigo-500/70" /> {contact.phone}
                            </a>
                        )}
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button onClick={() => setIsEditing(true)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all" title={dict.common.edit}>
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="text-slate-400 dark:text-slate-500 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all" title={dict.common.delete}>
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </li>
    );
}
