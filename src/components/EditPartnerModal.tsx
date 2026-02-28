'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { updatePartner } from '@/lib/actions';
import { Partner, ProductIntegration, Dictionary } from '@/lib/types';
import { parseProducts } from '@/lib/helpers';

export default function EditPartnerModal({
    partner,
    availableProducts,
    availableTeam,
    availableVerticals,
    availableUseCases,
    dict
}: {
    partner: Partner;
    availableProducts: string[];
    availableTeam: string[];
    availableVerticals: string[];
    availableUseCases: string[];
    dict: Dictionary;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(partner.name);
    const [healthStatus, setHealthStatus] = useState(partner.health_status);
    const [productIntegrations, setProductIntegrations] = useState<ProductIntegration[]>(() => parseProducts(partner.integration_products));
    const [keyPerson, setKeyPerson] = useState(partner.key_person_id || '');
    const [attentionDays, setAttentionDays] = useState(partner.needs_attention_days);
    const [vertical, setVertical] = useState(partner.vertical || '');
    const [useCase, setUseCase] = useState(partner.use_case || '');
    const [logoUrl, setLogoUrl] = useState(partner.logo_url || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        await updatePartner(partner.id, {
            name,
            health_status: healthStatus as Partner['health_status'],
            integration_products: JSON.stringify(productIntegrations),
            key_person_id: keyPerson,
            needs_attention_days: attentionDays,
            vertical,
            use_case: useCase,
            logo_url: logoUrl || null
        });
        setIsSubmitting(false);
        setIsOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
                title={dict.common.edit}
            >
                {dict.common.edit}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{dict.partnerDetail.editPartner}</h2>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title={dict.common.cancel}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{dict.directory.companyName}</label>
                                    <input required type="text" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500" value={name} onChange={e => setName(e.target.value)} title={dict.directory.companyName} />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{dict.directory.logoUrl}</label>
                                    <input type="url" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500" placeholder="https://example.com/logo.png" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} title={dict.directory.logoUrl} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{dict.common.healthStatus}</label>
                                    <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 bg-white dark:bg-slate-800" value={healthStatus} onChange={e => setHealthStatus(e.target.value as Partner['health_status'])} title={dict.common.healthStatus}>
                                        <option value="Active">{dict.common.active}</option>
                                        <option value="At Risk">{dict.common.atRisk}</option>
                                        <option value="Dormant">{dict.common.dormant}</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Integration Products</label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50 shadow-inner">
                                        {availableProducts.map(p => {
                                            const existing = productIntegrations.find(prod => prod.product === p);
                                            const isChecked = !!existing;
                                            return (
                                                <div key={p} className="flex items-center justify-between gap-4 p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <label className="flex items-center gap-3 cursor-pointer flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    setProductIntegrations([...productIntegrations, { product: p, status: 'In pipeline' }]);
                                                                } else {
                                                                    setProductIntegrations(productIntegrations.filter(prod => prod.product !== p));
                                                                }
                                                            }}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                        />
                                                        {p}
                                                    </label>

                                                    {isChecked && (
                                                        <select
                                                            className="text-xs border border-slate-200 dark:border-slate-700 rounded-md py-1.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 shadow-sm"
                                                            value={existing.status}
                                                            title={dict.common.integrationStatus}
                                                            onChange={e => {
                                                                const updated = productIntegrations.map(prod =>
                                                                    prod.product === p ? { ...prod, status: e.target.value as any } : prod
                                                                );
                                                                setProductIntegrations(updated);
                                                            }}
                                                        >
                                                            <option value="No">{dict.common.notStarted}</option>
                                                            <option value="In pipeline">{dict.common.inPipeline}</option>
                                                            <option value="In development">{dict.common.inDevelopment}</option>
                                                            <option value="Finished">{dict.common.finished}</option>
                                                            <option value="On hold">{dict.common.onHold}</option>
                                                            <option value="Not interested">{dict.common.notInterested}</option>
                                                            <option value="Cancelled">{dict.common.cancelled}</option>
                                                        </select>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{dict.common.keyPerson}</label>
                                    <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 bg-white dark:bg-slate-800" value={keyPerson} onChange={e => setKeyPerson(e.target.value)} title={dict.common.keyPerson}>
                                        <option value="">{dict.common.unassigned}</option>
                                        {availableTeam.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{dict.common.vertical}</label>
                                    <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 bg-white dark:bg-slate-800" value={vertical} onChange={e => setVertical(e.target.value)} title={dict.common.vertical}>
                                        <option value="">{dict.common.none}</option>
                                        {availableVerticals.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{dict.common.useCase}</label>
                                    <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 bg-white dark:bg-slate-800" value={useCase} onChange={e => setUseCase(e.target.value)} title={dict.common.useCase}>
                                        <option value="">{dict.common.none}</option>
                                        {availableUseCases.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{dict.directory.attentionThreshold}</label>
                                    <input required type="number" min="1" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500" value={attentionDays} onChange={e => setAttentionDays(parseInt(e.target.value) || 30)} title={dict.directory.attentionThreshold} />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">{dict.common.cancel}</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm">{dict.common.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
