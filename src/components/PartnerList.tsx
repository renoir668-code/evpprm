'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag, ProductIntegration } from '@/lib/types';
import { PartnerWithTags } from '@/app/directory/page';
import Link from 'next/link';
import { Building2, Search, Plus, FileSpreadsheet, Download, X, UploadCloud, FileDown, Loader2, Activity, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreatePartnerModal from './CreatePartnerModal';
import { importPartners } from '@/lib/actions';
import { parseProducts } from '@/lib/helpers';

import { Dictionary } from '@/lib/types';

export default function PartnerList({
    initialPartners,
    allTags,
    availableProducts,
    availableTeam,
    availableVerticals,
    isAdmin,
    dict,
    defaultUseCase
}: {
    initialPartners: PartnerWithTags[];
    allTags: Tag[];
    availableProducts: string[];
    availableTeam: string[];
    availableVerticals: string[];
    isAdmin?: boolean;
    dict: Dictionary;
    defaultUseCase?: string;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVertical, setSelectedVertical] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    // Reset page to 1 on any filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedVertical, selectedStatus, selectedProduct, selectedTeam]);

    // Filter partners
    const filtered = initialPartners.filter((p) => {
        const prods = parseProducts(p.integration_products);

        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVertical = selectedVertical ? p.vertical === selectedVertical : true;
        const matchesStatus = selectedStatus
            ? (prods.length > 0 ? prods.some(pr => pr.status === selectedStatus) : selectedStatus === 'No')
            : true;
        const matchesProduct = selectedProduct ? prods.some(pr => pr.product === selectedProduct) : true;
        const matchesTeam = selectedTeam ? p.key_person_id === selectedTeam : true;
        return matchesSearch && matchesVertical && matchesStatus && matchesProduct && matchesTeam;
    });

    const exportToCSV = () => {
        const headers = ['Name', 'Health', 'Integration Status', 'Products', 'Threshold (Days)', 'Last Interaction Date', 'Created Date'];
        const rows = filtered.map(p => {
            const prods = parseProducts(p.integration_products);
            return [
                `"${p.name}"`,
                p.health_status,
                `"${prods.map(pr => pr.status).join(', ') || 'No'}"`,
                `"${prods.map(pr => pr.product).join(', ') || ''}"`,
                p.needs_attention_days,
                p.last_interaction_date ? new Date(p.last_interaction_date).toLocaleDateString() : 'Never',
                p.created_at
            ];
        });
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "partner_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadTemplate = () => {
        const headers = ['name', 'health_status', 'integration_status', 'integration_products', 'key_person_id', 'needs_attention_days', 'owner_id', 'vertical', 'use_case'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "partner_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const data = await file.arrayBuffer();
            const xlsx = await import('xlsx');
            const wb = xlsx.read(data);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = xlsx.utils.sheet_to_json(ws);

            await importPartners(jsonData);
            alert('Import successful!');
        } catch (error) {
            console.error('Import failed', error);
            alert('Import failed. Please verify the file format.');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex-1 max-w-xl">
                    <div className="pl-4 flex items-center justify-center">
                        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                        type="text"
                        className="w-full py-3 px-3 outline-none text-slate-700 dark:text-slate-200 bg-transparent placeholder:text-slate-400 font-medium"
                        placeholder={dict.directory.searchPlaceholder}
                        title={dict.directory.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="pr-4 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors"
                            title={dict.common.clear}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex gap-3 flex-wrap">
                    <select
                        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        title={dict.directory.allStatuses}
                    >
                        <option value="">{dict.directory.allStatuses}</option>
                        <option value="No">{dict.common.notStarted}</option>
                        <option value="In pipeline">{dict.common.inPipeline}</option>
                        <option value="In development">{dict.common.inDevelopment}</option>
                        <option value="Finished">{dict.common.finished}</option>
                        <option value="Not interested">{dict.common.notInterested}</option>
                    </select>

                    <select
                        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                        value={selectedVertical}
                        onChange={(e) => setSelectedVertical(e.target.value)}
                        title={dict.directory.allVerticals}
                    >
                        <option value="">{dict.directory.allVerticals}</option>
                        {availableVerticals.map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>

                    <select
                        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        title={dict.directory.allProducts}
                    >
                        <option value="">{dict.directory.allProducts}</option>
                        {availableProducts.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        title={dict.directory.allTeamMembers}
                    >
                        <option value="">{dict.directory.allTeamMembers}</option>
                        {availableTeam.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleImport}
                        title={dict.directory.import}
                    />

                    <div className="relative">
                        <button
                            onClick={() => setIsActionsOpen(!isActionsOpen)}
                            className="bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-indigo-600 px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all border border-white dark:border-slate-800 hover:shadow-md"
                            title={dict.common.more || 'More Actions'}
                        >
                            <FileSpreadsheet className="w-5 h-5" />
                            <span className="hidden sm:inline">{dict.directory.manageData || 'Manage Data'}</span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", isActionsOpen && "rotate-180")} />
                        </button>

                        {isActionsOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setIsActionsOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-30 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                                    <button
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                            setIsActionsOpen(false);
                                        }}
                                        disabled={isImporting}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                        {dict.directory.import}
                                    </button>

                                    <button
                                        onClick={() => {
                                            downloadTemplate();
                                            setIsActionsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        {dict.directory.template}
                                    </button>

                                    <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

                                    <button
                                        onClick={() => {
                                            exportToCSV();
                                            setIsActionsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        {dict.directory.export}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-indigo-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                        title={dict.directory.addPartner}
                    >
                        <Plus className="w-5 h-5" />
                        {dict.directory.addPartner}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                        <Building2 className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                        <p className="font-medium text-slate-900 dark:text-white">{dict.directory.noPartnersFound}</p>
                        <p className="text-sm mt-1">{dict.directory.noPartnersSubtitle}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((partner) => (
                            <Link
                                key={partner.id}
                                href={`/partners/${partner.id}`}
                                className="block px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden">
                                            {partner.logo_url ? (
                                                <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-indigo-600 font-bold text-lg">
                                                    {partner.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                {partner.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span
                                                    className={cn(
                                                        'text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5',
                                                        partner.health_status === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : partner.health_status === 'At Risk'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                                                    )}
                                                >
                                                    <Activity className="w-3 h-3" />
                                                    {partner.health_status === 'Active' ? dict.common.active :
                                                        partner.health_status === 'At Risk' ? dict.common.atRisk :
                                                            partner.health_status === 'Dormant' ? dict.common.dormant :
                                                                partner.health_status}
                                                </span>

                                                {partner.tags.map((tag) => (
                                                    <span
                                                        key={tag.id}
                                                        className={cn('text-xs px-2 py-0.5 rounded-md', tag.color)}
                                                    >
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-6 sm:gap-8 w-full md:w-auto">
                                        <div className="hidden lg:block text-right shrink-0 w-[140px]">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{dict.directory.lastInteraction}</p>
                                            <p className="text-sm text-slate-900 dark:text-white font-bold truncate">
                                                {partner.last_interaction_date ? new Date(partner.last_interaction_date).toLocaleDateString() : dict.common.never}
                                            </p>
                                        </div>
                                        <div className="hidden md:block text-right shrink-0 w-[150px]">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{dict.directory.integrations}</p>
                                            <p className="text-sm text-slate-900 dark:text-white line-clamp-1 max-w-[150px]">
                                                {(() => {
                                                    const prods = parseProducts(partner.integration_products);
                                                    return prods.length > 0 ? prods.map(p => p.product).join(', ') : dict.common.none;
                                                })()}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors shadow-sm">
                                            <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {filtered.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-4 px-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Showing <span className="text-slate-900 dark:text-white font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-slate-900 dark:text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of <span className="text-slate-900 dark:text-white font-bold">{filtered.length}</span> results
                    </p>
                    <div className="flex gap-2">
                        <button
                            title="Previous Page"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 disabled:opacity-50 transition-all font-semibold flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            title="Next Page"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / ITEMS_PER_PAGE), p + 1))}
                            disabled={currentPage === Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 disabled:opacity-50 transition-all font-semibold flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <CreatePartnerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                dict={dict}
                defaultUseCase={defaultUseCase}
            />
        </div>
    );
}
