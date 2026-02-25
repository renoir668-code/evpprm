'use client';

import { useState } from 'react';
import { Trash2, Building2, AlertCircle, X, Search } from 'lucide-react';
import { Partner } from '@/lib/types';
import { deletePartner } from '@/lib/actions';
import { cn } from '@/lib/utils';

export default function DeletePartnerSettings({ partners }: { partners: Partner[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const filtered = partners.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            setIsDeleting(id);
            try {
                await deletePartner(id);
            } catch (err) {
                console.error(err);
                alert('An error occurred during deletion.');
            } finally {
                setIsDeleting(null);
            }
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-rose-100 flex items-center gap-2 bg-rose-50/50">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h2 className="font-semibold text-rose-900">Danger Zone</h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">
                        Permanently delete partners and all their associated data (interactions, contacts, reminders, tags). This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all border border-rose-200"
                    >
                        <Trash2 className="w-5 h-5" />
                        Delete Partner
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100/50 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-rose-500" />
                                Delete Partner
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors bg-white/50 hover:bg-white p-2 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100/50 shrink-0">
                            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-rose-500/20 focus-within:border-rose-500 transition-all">
                                <div className="pl-4 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full py-3 px-3 outline-none text-slate-700 bg-transparent placeholder:text-slate-400 font-medium"
                                    placeholder="Search partners to delete..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {filtered.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">
                                    <Building2 className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                    <p className="font-medium text-slate-900">No partners found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filtered.map(partner => (
                                        <div key={partner.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-rose-200 transition-all group shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                                    <span className="text-slate-600 font-bold">
                                                        {partner.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                                                        {partner.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        Created {new Date(partner.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(partner.id, partner.name)}
                                                disabled={isDeleting === partner.id}
                                                className="bg-white hover:bg-rose-50 text-rose-500 border border-rose-200 hover:border-rose-300 px-4 py-2 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isDeleting === partner.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
