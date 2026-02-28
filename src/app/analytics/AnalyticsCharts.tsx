'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell, PieChart, Pie } from 'recharts';
import { Partner, Interaction, Dictionary } from '@/lib/types';
import { useMemo, useState } from 'react';
import { parseProducts } from '@/lib/helpers';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export function AnalyticsCharts({
    partners,
    interactions,
    availableTeam,
    availableProducts,
    availableVerticals,
    dict
}: {
    partners: Partner[],
    interactions: Interaction[],
    availableTeam: string[],
    availableProducts: string[],
    availableVerticals: string[],
    dict: Dictionary
}) {
    const [timelineDays, setTimelineDays] = useState(14);
    const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
    const [selectedVertical, setSelectedVertical] = useState<string>('');

    // Filter partners based on selected team member or specific partner
    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            const matchTeam = selectedTeamMember ? p.key_person_id === selectedTeamMember : true;
            const matchPartner = selectedPartnerId ? p.id === selectedPartnerId : true;
            const matchVertical = selectedVertical ? p.vertical === selectedVertical : true;
            return matchTeam && matchPartner && matchVertical;
        });
    }, [partners, selectedTeamMember, selectedPartnerId, selectedVertical]);

    // Available verticals for filter dropdown (merged settings + actual data)
    const filterVerticals = useMemo(() => {
        const verticals = new Set<string>(availableVerticals);
        partners.forEach(p => {
            if (p.vertical) verticals.add(p.vertical);
        });
        return Array.from(verticals).filter(Boolean).sort();
    }, [partners, availableVerticals]);

    // Filter interactions based on filtered partners
    // And limit to timelineDays for the engagement chart
    const filteredInteractions = useMemo(() => {
        const partnerIds = new Set(filteredPartners.map(p => p.id));
        return interactions.filter(i => partnerIds.has(i.partner_id));
    }, [interactions, filteredPartners]);


    // Status distribution
    const statusData = useMemo(() => {
        const counts = filteredPartners.reduce((acc, current) => {
            let prods = parseProducts(current.integration_products);
            if (prods.length === 0) {
                acc['No'] = (acc['No'] || 0) + 1;
            } else {
                prods.forEach(prod => {
                    acc[prod.status] = (acc[prod.status] || 0) + 1;
                });
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredPartners]);

    // Daily engagements (last timelineDays days)
    const engagementData = useMemo(() => {
        const today = new Date();
        const data: { date: string, count: number }[] = [];

        for (let i = timelineDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            data.push({ date: dateStr, count: 0 });
        }

        filteredInteractions.forEach(i => {
            const dateStr = new Date(i.date).toISOString().split('T')[0];
            const entry = data.find(d => d.date === dateStr);
            if (entry) {
                entry.count += 1;
            }
        });

        // Format dates for display
        return data.map(d => ({
            ...d,
            date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }));
    }, [filteredInteractions, timelineDays]);

    // Integrations by Vertical (Finished or In Pipeline)
    const integrationsByVerticalData = useMemo(() => {
        const countsByVertical: Record<string, { Finished: number, 'In Pipeline': number }> = {};

        // Initialize with all available verticals from settings
        availableVerticals.forEach((v: string) => {
            if (v) {
                countsByVertical[v] = { Finished: 0, 'In Pipeline': 0 };
            }
        });

        // Ensure "Uncategorized" exists as a fallback
        const uncategorized = dict.analytics.uncategorized;
        if (!countsByVertical[uncategorized]) {
            countsByVertical[uncategorized] = { Finished: 0, 'In Pipeline': 0 };
        }

        filteredPartners.forEach(p => {
            const vertical = p.vertical || uncategorized;
            if (!countsByVertical[vertical]) {
                countsByVertical[vertical] = { Finished: 0, 'In Pipeline': 0 };
            }

            let prods = parseProducts(p.integration_products);

            prods.forEach(prod => {
                if (prod.status === 'Finished') countsByVertical[vertical].Finished++;
                if (prod.status === 'In pipeline' || prod.status === 'In development') countsByVertical[vertical]['In Pipeline']++;
            });
        });

        return Object.entries(countsByVertical).map(([name, counts]) => ({
            name,
            Finished: counts.Finished,
            'In Pipeline': counts['In Pipeline']
        })).sort((a, b) => (b.Finished + b['In Pipeline']) - (a.Finished + a['In Pipeline']));
    }, [filteredPartners, availableVerticals, dict.analytics.uncategorized]);

    // Integrations by Product
    const integrationsByProductData = useMemo(() => {
        const productCounts: Record<string, { Finished: number, 'In Pipeline': number }> = {};

        // Initialize with all available products from settings
        availableProducts.forEach((p: string) => {
            if (p) {
                productCounts[p] = { Finished: 0, 'In Pipeline': 0 };
            }
        });

        filteredPartners.forEach(p => {
            let prods = parseProducts(p.integration_products);

            prods.forEach(prod => {
                if (!productCounts[prod.product]) {
                    productCounts[prod.product] = { Finished: 0, 'In Pipeline': 0 };
                }
                if (prod.status === 'Finished') productCounts[prod.product].Finished++;
                if (prod.status === 'In pipeline' || prod.status === 'In development') productCounts[prod.product]['In Pipeline']++;
            });
        });

        return Object.entries(productCounts)
            .map(([name, counts]) => ({ name, Finished: counts.Finished, 'In Pipeline': counts['In Pipeline'] }))
            .sort((a, b) => (b.Finished + b['In Pipeline']) - (a.Finished + a['In Pipeline']));
    }, [filteredPartners, availableProducts]);

    // Team Performance: Partner Assignment
    const assignmentData = useMemo(() => {
        const counts: Record<string, number> = {};
        let unassigned = 0;

        filteredPartners.forEach(p => {
            if (!p.key_person_id) {
                unassigned++;
            } else {
                counts[p.key_person_id] = (counts[p.key_person_id] || 0) + 1;
            }
        });

        const data = Object.entries(counts).map(([name, total]) => ({
            name,
            count: total
        })).sort((a, b) => b.count - a.count);

        if (unassigned > 0) {
            data.push({ name: dict.common.unassigned, count: unassigned });
        }

        return data;
    }, [filteredPartners, dict.common.unassigned]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
                <select
                    title={dict.analytics.last30Days}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                    value={timelineDays}
                    onChange={e => setTimelineDays(Number(e.target.value))}
                >
                    <option value={7}>{dict.analytics.last7Days}</option>
                    <option value={14}>{dict.analytics.last14Days}</option>
                    <option value={30}>{dict.analytics.last30Days}</option>
                    <option value={90}>{dict.analytics.last90Days}</option>
                </select>

                <select
                    title={dict.directory.allTeamMembers}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                    value={selectedTeamMember}
                    onChange={e => setSelectedTeamMember(e.target.value)}
                >
                    <option value="">{dict.directory.allTeamMembers}</option>
                    {availableTeam.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select
                    title={dict.analytics.allPartners}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                    value={selectedPartnerId}
                    onChange={e => setSelectedPartnerId(e.target.value)}
                >
                    <option value="">{dict.analytics.allPartners}</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <select
                    title={dict.analytics.allVerticals}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 dark:text-slate-200 font-medium focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
                    value={selectedVertical}
                    onChange={e => setSelectedVertical(e.target.value)}
                >
                    <option value="">{dict.analytics.allVerticals}</option>
                    {filterVerticals.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>

            <div className={`grid grid-cols-1 gap-8 ${selectedPartnerId === '' ? '' : 'lg:grid-cols-2'}`}>
                <div className="bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        {dict.analytics.integrationStatus}
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontWeight: '600' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                        {statusData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                {entry.name === 'No' ? dict.common.notStarted :
                                    entry.name === 'Finished' ? dict.common.finished :
                                        entry.name === 'In pipeline' ? dict.common.inPipeline :
                                            entry.name === 'In development' ? dict.common.inDevelopment :
                                                entry.name === 'On hold' ? dict.common.onHold :
                                                    entry.name === 'Not interested' ? dict.common.notInterested :
                                                        entry.name} ({entry.value})
                            </div>
                        ))}
                    </div>
                </div>

                {selectedPartnerId !== '' && (
                    <div className="bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            {dict.analytics.engagementVelocity} ({timelineDays} {dict.common.days})
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={engagementData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        hide
                                        domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                        <LabelList dataKey="count" position="top" fill="#10b981" fontSize={12} fontWeight={700} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {dict.analytics.integrationsByVertical}
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={integrationsByVerticalData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="Finished" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="In Pipeline" stackId="a" fill="#3b82f6" radius={[0, 6, 6, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                        {dict.analytics.integrationsByProduct}
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={integrationsByProductData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={60} />
                                <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="Finished" stackId="a" fill="#d946ef" radius={[0, 0, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="In Pipeline" stackId="a" fill="#f472b6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        {dict.analytics.partnerDistribution}
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assignmentData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" name={dict.analytics.partnersAssigned} fill="#3b82f6" radius={[0, 6, 6, 0]} maxBarSize={30}>
                                    <LabelList dataKey="count" position="right" fill="#3b82f6" fontSize={12} fontWeight={700} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
