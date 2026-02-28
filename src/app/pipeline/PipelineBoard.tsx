'use client';

import { useState, useMemo } from 'react';
import { Partner, ProductIntegration, Dictionary } from '@/lib/types';
import { updatePartnerProducts } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Search, X, ChevronDown, Building2, Store } from 'lucide-react';
import { parseProducts } from '@/lib/helpers';

const COLUMNS = [
    { id: 'No', color: 'bg-slate-100 dark:bg-slate-800', dictKey: 'notStarted' },
    { id: 'In pipeline', color: 'bg-blue-100 dark:bg-blue-900/30', dictKey: 'inPipeline' },
    { id: 'In development', color: 'bg-orange-100 dark:bg-orange-900/30', dictKey: 'inDevelopment' },
    { id: 'Finished', color: 'bg-emerald-100 dark:bg-emerald-900/30', dictKey: 'finished' },
    { id: 'On hold', color: 'bg-yellow-100 dark:bg-yellow-900/30', dictKey: 'onHold' },
    { id: 'Cancelled', color: 'bg-stone-100 dark:bg-stone-900/30', dictKey: 'cancelled' },
    { id: 'Not interested', color: 'bg-red-100 dark:bg-red-900/30', dictKey: 'notInterested' },
];

export function PipelineBoard({
    initialPartners,
    dict,
    availableProducts,
    availableTeam,
    availableVerticals
}: {
    initialPartners: Partner[],
    dict: Dictionary,
    availableProducts: string[],
    availableTeam: string[],
    availableVerticals: string[]
}) {
    const [partners, setPartners] = useState(initialPartners);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPartner, setSelectedPartner] = useState<string>('');
    const [selectedVertical, setSelectedVertical] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');

    // Sort partners: generic partners first, then merchants
    const sortedPartnersForDropdown = useMemo(() => {
        return [...initialPartners].sort((a, b) => {
            if (a.use_case !== 'Merchant' && b.use_case === 'Merchant') return -1;
            if (a.use_case === 'Merchant' && b.use_case !== 'Merchant') return 1;
            return a.name.localeCompare(b.name);
        });
    }, [initialPartners]);

    const pipelineItems = partners.flatMap(p => {
        const prods = parseProducts(p.integration_products);
        return prods.map(prod => ({
            id: `${p.id}:::${prod.product}`,
            partnerId: p.id,
            partnerName: p.name,
            health_status: p.health_status,
            product: prod.product,
            status: prod.status,
            vertical: p.vertical,
            key_person_id: p.key_person_id,
            partner: p
        }));
    });

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';

        const preview = e.currentTarget.cloneNode(true) as HTMLElement;
        preview.style.position = 'absolute';
        preview.style.top = '-1000px';
        document.body.appendChild(preview);
        e.dataTransfer.setDragImage(preview, 20, 20);
        setTimeout(() => document.body.removeChild(preview), 0);
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;

        const [partnerId, productName] = id.split(':::');

        // Optimistic update
        const updatedPartners = partners.map(p => {
            if (p.id !== partnerId) return p;
            const prods = parseProducts(p.integration_products);
            const updatedProds = prods.map(prod =>
                prod.product === productName ? { ...prod, status: newStatus as ProductIntegration['status'] } : prod
            );
            return { ...p, integration_products: JSON.stringify(updatedProds) };
        });
        setPartners(updatedPartners);
        setDraggedId(null);

        // API update
        try {
            const partnerToUpdate = updatedPartners.find(p => p.id === partnerId);
            if (partnerToUpdate) {
                await updatePartnerProducts(partnerId, partnerToUpdate.integration_products || '[]');
            }
        } catch (err) {
            console.error(err);
            setPartners(initialPartners);
        }
    };

    const filteredItems = pipelineItems.filter(p => {
        const matchesSearch = !searchQuery || p.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPartner = !selectedPartner || p.partnerId === selectedPartner;
        const matchesVertical = !selectedVertical || p.vertical === selectedVertical;
        const matchesProduct = !selectedProduct || p.product === selectedProduct;
        const matchesTeam = !selectedTeam || p.key_person_id === selectedTeam;
        return matchesSearch && matchesPartner && matchesVertical && matchesProduct && matchesTeam;
    });

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header / Filters Section */}
            <div className="flex flex-wrap items-center gap-4 bg-white/40 dark:bg-slate-900/10 p-4 rounded-[24px] border border-white/20 shadow-sm backdrop-blur-sm">
                {/* Search Bar */}
                <div className="flex-1 min-w-[300px] flex items-center bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-1.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm">
                    <div className="px-3 flex items-center justify-center">
                        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                        type="text"
                        className="flex-1 py-1.5 px-1 outline-none text-slate-800 dark:text-slate-100 bg-transparent placeholder:text-slate-400 font-medium text-base"
                        placeholder={dict.pipeline.filterPlaceholder || "Search..."}
                        title="Search partners"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="px-3 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                            title={dict.common.clear || "Clear search"}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all"
                        value={selectedPartner}
                        onChange={(e) => setSelectedPartner(e.target.value)}
                        title="Filter by Partner"
                    >
                        <option value="">{dict.directory.allPartners || 'All Partners/Merchants'}</option>
                        {sortedPartnersForDropdown.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.use_case === 'Merchant' ? '🏪 ' : '🏢 '} {p.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all"
                        value={selectedVertical}
                        onChange={(e) => setSelectedVertical(e.target.value)}
                        title={dict.directory.allVerticals}
                    >
                        <option value="">{dict.directory.allVerticals}</option>
                        {availableVerticals.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>

                    <select
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        title={dict.directory.allProducts}
                    >
                        <option value="">{dict.directory.allProducts}</option>
                        {availableProducts.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        title={dict.directory.allTeamMembers}
                    >
                        <option value="">{dict.directory.allTeamMembers}</option>
                        {availableTeam.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 flex-1 h-[calc(100vh-270px)]">
                {COLUMNS.map(col => {
                    const colItems = filteredItems.filter(p => p.status === col.id);

                    return (
                        <div
                            key={col.id}
                            className={cn(
                                "flex-shrink-0 w-80 rounded-2xl p-4 flex flex-col h-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-colors",
                                col.color
                            )}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 tracking-tight">{(dict.common as any)[col.dictKey]}</h3>
                                <span className="text-xs font-bold bg-white/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full shadow-sm">
                                    {colItems.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 p-1">
                                {colItems.map(p => (
                                    <div
                                        key={p.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, p.id)}
                                        onDragEnd={() => setDraggedId(null)}
                                        className={cn(
                                            "bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative",
                                            draggedId === p.id && "opacity-50 scale-95"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                                {p.partner.logo_url ? (
                                                    <img src={p.partner.logo_url} alt={p.partnerName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-indigo-600 font-bold text-[10px]">
                                                        {p.partnerName.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{p.partnerName}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-md",
                                                p.health_status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                    p.health_status === 'At Risk' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            )}>
                                                {p.health_status === 'Active' ? dict.common.active :
                                                    p.health_status === 'At Risk' ? dict.common.atRisk :
                                                        p.health_status === 'Dormant' ? dict.common.dormant :
                                                            p.health_status}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 truncate max-w-[120px]">
                                                {p.product}
                                            </span>
                                        </div>
                                        <button
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-opacity"
                                            title={dict.common.edit}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
