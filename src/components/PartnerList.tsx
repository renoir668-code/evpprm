'use client';

import { useState, useRef } from 'react';
import { Tag, ProductIntegration } from '@/lib/types';
import { PartnerWithTags } from '@/app/directory/page';
import Link from 'next/link';
import { Search, Plus, Building2, ChevronRight, Activity, Download, UploadCloud, FileDown, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreatePartnerModal from './CreatePartnerModal';
import * as xlsx from 'xlsx';
import { importPartners, deletePartner } from '@/lib/actions';

export default function PartnerList({
    initialPartners,
    allTags,
    availableProducts,
    availableTeam,
    isAdmin
}: {
    initialPartners: PartnerWithTags[];
    allTags: Tag[];
    availableProducts: string[];
    availableTeam: string[];
    isAdmin?: boolean;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Filter partners
    const filtered = initialPartners.filter((p) => {
        let prods: ProductIntegration[] = [];
        try { prods = JSON.parse(p.integration_products || '[]'); } catch { }

        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag ? p.tags.some((t) => t.id === selectedTag) : true;
        const matchesStatus = selectedStatus
            ? (prods.length > 0 ? prods.some(pr => pr.status === selectedStatus) : selectedStatus === 'No')
            : true;
        const matchesProduct = selectedProduct ? prods.some(pr => pr.product === selectedProduct) : true;
        const matchesTeam = selectedTeam ? p.key_person_id === selectedTeam : true;
        return matchesSearch && matchesTag && matchesStatus && matchesProduct && matchesTeam;
    });

    const exportToCSV = () => {
        const headers = ['Name', 'Health', 'Integration Status', 'Products', 'Threshold (Days)', 'Last Interaction Date', 'Created Date'];
        const rows = filtered.map(p => {
            let prods: ProductIntegration[] = [];
            try { prods = JSON.parse(p.integration_products || '[]'); } catch { }
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
        const headers = [['Partner Name', 'Health', 'Threshold (Days)', 'Vertical', 'Owner']];
        const ws = xlsx.utils.aoa_to_sheet(headers);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Template');
        xlsx.writeFile(wb, 'Partner_Import_Template.xlsx');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const data = await file.arrayBuffer();
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
                <div className="flex bg-white/60 backdrop-blur-md border border-white rounded-xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex-1 max-w-md">
                    <div className="pl-4 flex items-center justify-center">
                        <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="w-full py-3 px-3 outline-none text-slate-700 bg-transparent placeholder:text-slate-400 font-medium"
                        placeholder="Search partners by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 flex-wrap">
                    <select
                        className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="No">Not Started</option>
                        <option value="In pipeline">In Pipeline</option>
                        <option value="In development">In Development</option>
                        <option value="Finished">Finished</option>
                        <option value="Not interested">Not Interested</option>
                    </select>

                    <select
                        className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        value={selectedTag || ''}
                        onChange={(e) => setSelectedTag(e.target.value || null)}
                    >
                        <option value="">All Tags</option>
                        {allTags.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        <option value="">All Products</option>
                        {availableProducts.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                        <option value="">All Team Members</option>
                        {availableTeam.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleImport}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="bg-white/60 hover:bg-white text-slate-700 hover:text-indigo-600 px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all border border-white hover:shadow-md disabled:opacity-50"
                        title="Import XLSX"
                    >
                        {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                        <span className="hidden sm:inline">Import</span>
                    </button>

                    <button
                        onClick={downloadTemplate}
                        className="bg-white/60 hover:bg-white text-slate-700 hover:text-indigo-600 px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all border border-white hover:shadow-md"
                        title="Download Template"
                    >
                        <FileDown className="w-5 h-5" />
                        <span className="hidden sm:inline">Template</span>
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="bg-white/60 hover:bg-white text-slate-700 hover:text-indigo-600 px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all border border-white hover:shadow-md"
                        title="Export to CSV"
                    >
                        <Download className="w-5 h-5" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-indigo-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        New Partner
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center text-slate-500">
                        <Building2 className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                        <p className="font-medium text-slate-900">No partners found</p>
                        <p className="text-sm mt-1">Adjust your search or add a new partner.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map((partner) => (
                            <Link
                                key={partner.id}
                                href={`/partners/${partner.id}`}
                                className="block px-6 py-5 hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                            <span className="text-indigo-600 font-bold text-lg">
                                                {partner.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
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
                                                                : 'bg-slate-100 text-slate-800'
                                                    )}
                                                >
                                                    <Activity className="w-3 h-3" />
                                                    {partner.health_status}
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
                                            <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Last Interaction</p>
                                            <p className="text-sm text-slate-900 font-bold truncate">
                                                {partner.last_interaction_date ? new Date(partner.last_interaction_date).toLocaleDateString() : 'Never'}
                                            </p>
                                        </div>
                                        <div className="hidden md:block text-right shrink-0 w-[150px]">
                                            <p className="text-sm text-slate-500 font-medium">Integrations</p>
                                            <p className="text-sm text-slate-900 line-clamp-1 max-w-[150px]">
                                                {(() => {
                                                    let prods: ProductIntegration[] = [];
                                                    try { prods = JSON.parse(partner.integration_products || '[]'); } catch { }
                                                    return prods.length > 0 ? prods.map(p => p.product).join(', ') : 'None';
                                                })()}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-white border border-slate-200 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors shadow-sm">
                                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                        </div>
                                        {isAdmin && (
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    if (confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
                                                        await deletePartner(partner.id);
                                                    }
                                                }}
                                                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-white border border-rose-200 hover:bg-rose-600 hover:border-rose-600 transition-colors shadow-sm text-rose-500 hover:text-white"
                                                title="Delete Partner"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <CreatePartnerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
