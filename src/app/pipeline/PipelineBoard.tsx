'use client';

import { useState } from 'react';
import { Partner, ProductIntegration } from '@/lib/types';
import { updatePartnerProducts } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Search, X } from 'lucide-react';

import { Tag, Dictionary } from '@/lib/types';

const COLUMNS = [
    { id: 'No', color: 'bg-slate-100', dictKey: 'notStarted' },
    { id: 'In pipeline', color: 'bg-blue-100', dictKey: 'inPipeline' },
    { id: 'In development', color: 'bg-orange-100', dictKey: 'inDevelopment' },
    { id: 'Finished', color: 'bg-emerald-100', dictKey: 'finished' },
    { id: 'On hold', color: 'bg-yellow-100', dictKey: 'onHold' },
    { id: 'Cancelled', color: 'bg-stone-100', dictKey: 'cancelled' },
    { id: 'Not interested', color: 'bg-red-100', dictKey: 'notInterested' },
];

export function PipelineBoard({ initialPartners, dict }: { initialPartners: Partner[], dict: Dictionary }) {
    const [partners, setPartners] = useState(initialPartners);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const pipelineItems = partners.flatMap(p => {
        let prods: ProductIntegration[] = [];
        if (p.integration_products) {
            try { prods = JSON.parse(p.integration_products); } catch { }
        }
        return prods.map(prod => ({
            id: `${p.id}:::${prod.product}`,
            partnerId: p.id,
            partnerName: p.name,
            health_status: p.health_status,
            product: prod.product,
            status: prod.status,
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
            let prods: ProductIntegration[] = [];
            if (p.integration_products) {
                try { prods = JSON.parse(p.integration_products); } catch { }
            }
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
            // Revert on error
            setPartners(initialPartners);
        }
    };

    const filteredItems = pipelineItems.filter(p => !searchQuery || p.partnerName.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6 max-w-md w-full">
                <div className="flex bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <div className="pl-4 flex items-center justify-center">
                        <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="w-full py-2.5 px-3 outline-none text-slate-700 bg-transparent placeholder:text-slate-400 font-medium text-sm"
                        placeholder="Filter by partner..."
                        title="Search partners"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="pr-4 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                            title={dict.common.clear || "Clear search"}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 flex-1 h-[calc(100vh-270px)]">
                {COLUMNS.map(col => {
                    const colItems = filteredItems.filter(p => p.status === col.id);

                    return (
                        <div
                            key={col.id}
                            className={cn(
                                "flex-shrink-0 w-80 rounded-2xl p-4 flex flex-col h-full border border-slate-200/50 shadow-sm transition-colors",
                                col.color
                            )}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h3 className="font-bold text-slate-700 tracking-tight">{(dict.common as any)[col.dictKey]}</h3>
                                <span className="text-xs font-bold bg-white/60 text-slate-500 px-2 py-1 rounded-full shadow-sm">
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
                                            "bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative",
                                            draggedId === p.id && "opacity-50 scale-95"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                                {p.partner.logo_url ? (
                                                    <img src={p.partner.logo_url} alt={p.partnerName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-indigo-600 font-bold text-[10px]">
                                                        {p.partnerName.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm truncate">{p.partnerName}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-md",
                                                p.health_status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                    p.health_status === 'At Risk' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-200 text-slate-600'
                                            )}>
                                                {p.health_status === 'Active' ? dict.common.active :
                                                    p.health_status === 'At Risk' ? dict.common.atRisk :
                                                        p.health_status === 'Dormant' ? dict.common.dormant :
                                                            p.health_status}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 truncate max-w-[120px]">
                                                {p.product}
                                            </span>
                                        </div>
                                        <button
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
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
