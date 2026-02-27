'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createPartner } from '@/lib/actions';

export default function CreatePartnerModal({ isOpen, onClose, dict, defaultUseCase }: { isOpen: boolean; onClose: () => void, dict: any, defaultUseCase?: string }) {
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [needsAttentionDays, setNeedsAttentionDays] = useState(30);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await createPartner({
            name,
            health_status: 'Active',
            integration_status: 'No',
            integration_products: '',
            key_person_id: null,
            needs_attention_days: needsAttentionDays,
            owner_id: null,
            use_case: defaultUseCase || null,
            logo_url: logoUrl || null
        });
        setName('');
        setLogoUrl('');
        setNeedsAttentionDays(30);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">{dict.directory.newPartner}</h2>
                    <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title={dict.common.cancel}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{dict.directory.companyName}</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder={dict.directory.companyPlaceholder}
                            title={dict.directory.companyName}
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{dict.directory.logoUrl}</label>
                        <input
                            type="url"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="https://example.com/logo.png"
                            title={dict.directory.logoUrl}
                            value={logoUrl}
                            onChange={e => setLogoUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{dict.directory.attentionThreshold}</label>
                        <p className="text-xs text-slate-500 mb-2">{dict.directory.attentionThresholdHelp}</p>
                        <input
                            required
                            type="number"
                            min="1"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            title={dict.directory.attentionThreshold}
                            value={needsAttentionDays}
                            onChange={e => setNeedsAttentionDays(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {dict.common.cancel}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                        >
                            {dict.directory.addPartner}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
