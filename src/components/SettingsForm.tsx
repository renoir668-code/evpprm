'use client';

import { useState } from 'react';
import { setSetting } from '@/lib/actions';
import { Save, Check } from 'lucide-react';

export default function SettingsForm({
    initialProducts,
    initialVerticals,
    initialUseCases,
    dict
}: {
    initialProducts: string;
    initialVerticals: string;
    initialUseCases: string;
    dict: any;
}) {
    const [products, setProducts] = useState(initialProducts);
    const [verticals, setVerticals] = useState(initialVerticals);
    const [useCases, setUseCases] = useState(initialUseCases);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        setSaved(false);

        await setSetting('products', products);
        await setSetting('verticals', verticals);
        await setSetting('use_cases', useCases);

        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    {dict.settings.availableProducts}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{dict.settings.productsHelp}</p>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 transition-shadow text-slate-900 dark:text-white"
                    placeholder={dict.settings.availableProducts}
                    title={dict.settings.availableProducts}
                    value={products}
                    onChange={e => setProducts(e.target.value)}
                />
            </div>



            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    {dict.settings.verticals}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{dict.settings.verticalsHelp}</p>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 transition-shadow text-slate-900 dark:text-white"
                    placeholder={dict.settings.verticals}
                    title={dict.settings.verticals}
                    value={verticals}
                    onChange={e => setVerticals(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    {dict.settings.useCases}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{dict.settings.useCasesHelp}</p>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 transition-shadow text-slate-900 dark:text-white"
                    placeholder={dict.settings.useCases}
                    title={dict.settings.useCases}
                    value={useCases}
                    onChange={e => setUseCases(e.target.value)}
                />
            </div>

            <div className="pt-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
                >
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? dict.settings.saved : isSaving ? dict.settings.saving : dict.settings.saveSettings}
                </button>
            </div>
        </form>
    );
}
