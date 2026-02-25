'use client';

import { useState } from 'react';
import { setSetting } from '@/lib/actions';
import { Save, Check } from 'lucide-react';

export default function SettingsForm({
    initialProducts,
    initialTeam,
    initialVerticals,
    initialUseCases
}: {
    initialProducts: string;
    initialTeam: string;
    initialVerticals: string;
    initialUseCases: string;
}) {
    const [products, setProducts] = useState(initialProducts);
    const [team, setTeam] = useState(initialTeam);
    const [verticals, setVerticals] = useState(initialVerticals);
    const [useCases, setUseCases] = useState(initialUseCases);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        setSaved(false);

        await setSetting('products', products);
        await setSetting('team', team);
        await setSetting('verticals', verticals);
        await setSetting('use_cases', useCases);

        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Available Products (Comma separated)
                </label>
                <p className="text-xs text-slate-500 mb-2">These products can be selected when editing a partner's integration status.</p>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow text-slate-900"
                    value={products}
                    onChange={e => setProducts(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Team Members (Comma separated)
                </label>
                <p className="text-xs text-slate-500 mb-2">Used for selecting the Key Person on an account.</p>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow text-slate-900"
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Verticals (Comma separated)
                </label>
                <p className="text-xs text-slate-500 mb-2">Used for selecting the Vertical on an account.</p>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow text-slate-900"
                    value={verticals}
                    onChange={e => setVerticals(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Use Cases (Comma separated)
                </label>
                <p className="text-xs text-slate-500 mb-2">Used for selecting the Use Case on an account.</p>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow text-slate-900"
                    value={useCases}
                    onChange={e => setUseCases(e.target.value)}
                />
            </div>

            <div className="pt-4 flex items-center justify-end border-t border-slate-100">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
                >
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form>
    );
}
