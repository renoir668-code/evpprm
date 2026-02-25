'use client';

import { useState } from 'react';
import { Partner, ProductIntegration } from '@/lib/types';
import { updatePartnerProducts } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';

const COLUMNS = [
    { id: 'No', label: 'Not Started', color: 'bg-slate-100' },
    { id: 'In pipeline', label: 'In Pipeline', color: 'bg-blue-100' },
    { id: 'In development', label: 'In Development', color: 'bg-orange-100' },
    { id: 'Finished', label: 'Finished', color: 'bg-emerald-100' },
    { id: 'On hold', label: 'On Hold', color: 'bg-yellow-100' },
    { id: 'Cancelled', label: 'Cancelled', color: 'bg-stone-100' },
    { id: 'Not interested', label: 'Not Interested', color: 'bg-red-100' },
];

export function PipelineBoard({ initialPartners }: { initialPartners: Partner[] }) {
    const [partners, setPartners] = useState(initialPartners);
    const [draggedId, setDraggedId] = useState<string | null>(null);

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

    return (
        <div className="flex gap-6 overflow-x-auto pb-8 pt-4 h-[calc(100vh-200px)]">
            {COLUMNS.map(col => {
                const colItems = pipelineItems.filter(p => p.status === col.id);

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
                            <h3 className="font-bold text-slate-700 tracking-tight">{col.label}</h3>
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
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{p.partnerName}</h4>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                                            p.health_status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                p.health_status === 'At Risk' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-200 text-slate-600'
                                        )}>
                                            {p.health_status}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 truncate max-w-[120px]">
                                            {p.product}
                                        </span>
                                    </div>
                                    <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
