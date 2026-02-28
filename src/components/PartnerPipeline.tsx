'use client';

import { useState } from 'react';
import { Partner, ProductIntegration, Dictionary } from '@/lib/types';
import { updatePartnerProducts } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { parseProducts } from '@/lib/helpers';

const COLUMNS = [
    { id: 'No', color: 'bg-slate-100 dark:bg-slate-800', dictKey: 'notStarted' },
    { id: 'In pipeline', color: 'bg-blue-100 dark:bg-blue-900/30', dictKey: 'inPipeline' },
    { id: 'In development', color: 'bg-orange-100 dark:bg-orange-900/30', dictKey: 'inDevelopment' },
    { id: 'Finished', color: 'bg-emerald-100 dark:bg-emerald-900/30', dictKey: 'finished' },
    { id: 'On hold', color: 'bg-yellow-100 dark:bg-yellow-900/30', dictKey: 'onHold' },
];

export function PartnerPipeline({ partner, dict }: { partner: Partner, dict: Dictionary }) {
    const [products, setProducts] = useState<ProductIntegration[]>(parseProducts(partner.integration_products));
    const [draggedProduct, setDraggedProduct] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, productName: string) => {
        setDraggedProduct(productName);
        e.dataTransfer.setData('productName', productName);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const productName = e.dataTransfer.getData('productName');
        if (!productName) return;

        const updatedProds = products.map(p =>
            p.product === productName ? { ...p, status: newStatus as any } : p
        );

        setProducts(updatedProds);
        setDraggedProduct(null);

        try {
            await updatePartnerProducts(partner.id, JSON.stringify(updatedProds));
        } catch (err) {
            console.error(err);
            setProducts(parseProducts(partner.integration_products));
        }
    };

    if (products.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{dict.sidebar.pipeline}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {COLUMNS.map(col => {
                    const colItems = products.filter(p => p.status === col.id || (col.id === 'No' && !p.status));
                    return (
                        <div
                            key={col.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className={cn(
                                "flex flex-col gap-2 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 min-h-[80px] transition-colors",
                                col.color
                            )}
                        >
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                                {(dict.common as any)[col.dictKey]}
                            </span>
                            <div className="space-y-2">
                                {colItems.map(p => (
                                    <div
                                        key={p.product}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, p.product)}
                                        className={cn(
                                            "bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-100 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all",
                                            draggedProduct === p.product && "opacity-50"
                                        )}
                                    >
                                        {p.product}
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
