'use client';

import { useState } from 'react';
import { Trash2, Building2, AlertCircle, X, Search, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { Partner } from '@/lib/types';
import { deletePartner, bulkDeletePartners } from '@/lib/actions';
import { cn } from '@/lib/utils';

export default function DeletePartnerSettings({ partners, dict }: { partners: Partner[], dict: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const filtered = partners.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length && filtered.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(p => p.id));
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(dict.settings.deletePartnerConfirm.replace('{name}', name))) {
            setIsDeleting(id);
            try {
                await deletePartner(id);
                setSelectedIds(prev => prev.filter(x => x !== id));
            } catch (err) {
                console.error(err);
                alert('An error occurred during deletion.');
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(dict.settings.bulkDeleteConfirm.replace('{count}', selectedIds.length.toString()))) {
            setIsBulkDeleting(true);
            try {
                await bulkDeletePartners(selectedIds);
                setSelectedIds([]);
                setSearchQuery('');
            } catch (err) {
                console.error(err);
                alert('An error occurred during bulk deletion.');
            } finally {
                setIsBulkDeleting(false);
            }
        }
    };

    return (
        <>
            <div className="bg-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-500/5 overflow-hidden mt-8 transition-all hover:shadow-rose-500/10">
                <div className="px-8 py-5 border-b border-rose-50 flex items-center gap-3 bg-gradient-to-r from-rose-50 to-white">
                    <div className="p-2.5 bg-rose-100/50 rounded-xl text-rose-500 shadow-sm border border-rose-100">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-rose-900">{dict.settings.dangerZone}</h2>
                        <p className="text-xs text-rose-500 font-medium">{dict.settings.deletePartnersHelp}</p>
                    </div>
                </div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <p className="text-sm font-bold text-slate-700 mb-2">{dict.settings.deletePartnersData}</p>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                {dict.settings.deletePartnersHelp}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="shrink-0 bg-white hover:bg-rose-50 text-rose-600 px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black transition-all border-2 border-rose-100 hover:border-rose-200 active:scale-95 shadow-sm"
                        >
                            <Trash2 className="w-5 h-5" />
                            {dict.settings.manageDeletions}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:p-12 animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => !isBulkDeleting && setIsOpen(false)}
                    />
                    <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border border-white flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-lg">
                                        <Trash2 className="w-6 h-6 text-rose-500" />
                                    </div>
                                    {dict.settings.deletePartnersTitle}
                                </h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">{dict.settings.deletePartnersSubtitle}</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={isBulkDeleting}
                                title="Close dialog"
                                className="text-slate-400 hover:text-slate-600 transition-all bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search & Bulk Actions */}
                        <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 shrink-0 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-rose-500/10 focus-within:border-rose-500 transition-all group">
                                    <div className="pl-4 flex items-center justify-center">
                                        <Search className="w-5 h-5 text-slate-300 group-focus-within:text-rose-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full py-3.5 px-3 outline-none text-slate-700 bg-transparent placeholder:text-slate-400 font-bold text-sm"
                                        placeholder={dict.settings.findPartners}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        title={dict.settings.findPartners}
                                    />
                                </div>

                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={isBulkDeleting}
                                        className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {isBulkDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                        {dict.settings.deleteSelected.replace('{count}', selectedIds.length.toString())}
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
                                >
                                    {selectedIds.length === filtered.length && filtered.length > 0 ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                                    ) : selectedIds.length > 0 ? (
                                        <MinusSquare className="w-4 h-4 text-indigo-500" />
                                    ) : (
                                        <Square className="w-4 h-4" />
                                    )}
                                    {selectedIds.length === filtered.length && filtered.length > 0 ? dict.settings.deselectAll : dict.settings.selectAllFiltered}
                                </button>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                                    {dict.settings.selectedCount.replace('{count}', selectedIds.length.toString())}
                                </span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="p-8 overflow-y-auto flex-1 bg-white">
                            {filtered.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Building2 className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <p className="font-extrabold text-slate-900 text-lg">{dict.settings.noPartnersMatch}</p>
                                    <p className="text-slate-400 text-sm mt-1">{dict.settings.tryDifferent}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filtered.map(partner => (
                                        <div
                                            key={partner.id}
                                            onClick={() => !isBulkDeleting && toggleSelect(partner.id)}
                                            className={cn(
                                                "flex items-center justify-between p-5 bg-white border rounded-2xl transition-all cursor-pointer group shadow-sm",
                                                selectedIds.includes(partner.id)
                                                    ? "border-rose-500 ring-4 ring-rose-500/5 bg-rose-50/10"
                                                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                                                    selectedIds.includes(partner.id)
                                                        ? "bg-rose-500 border-rose-500 text-white"
                                                        : "border-slate-300 bg-white group-hover:border-rose-400"
                                                )}>
                                                    {selectedIds.includes(partner.id) && <CheckSquare className="w-4 h-4" />}
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden shadow-inner">
                                                    {partner.logo_url ? (
                                                        <img src={partner.logo_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-slate-400 font-black text-lg">
                                                            {partner.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                                                        {partner.name}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                        Partner ID: {partner.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                            </div>

                                            {!selectedIds.includes(partner.id) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(partner.id, partner.name);
                                                    }}
                                                    disabled={isDeleting === partner.id || isBulkDeleting}
                                                    title={`Delete ${partner.name}`}
                                                    className="opacity-0 group-hover:opacity-100 bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 p-2.5 rounded-xl transition-all disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {selectedIds.length > 0 && (
                            <div className="px-8 py-5 border-t border-slate-100 bg-rose-50/30 flex items-center justify-between shrink-0">
                                <p className="text-rose-900 font-extrabold text-sm">
                                    {dict.settings.cautionBulkDelete.replace('{count}', selectedIds.length.toString())}
                                </p>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-xl shadow-rose-600/20 active:scale-95 disabled:opacity-50"
                                >
                                    {dict.settings.confirmBulkDelete}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function Loader2({ className }: { className?: string }) {
    return <AlertCircle className={cn("animate-spin", className)} />;
}

