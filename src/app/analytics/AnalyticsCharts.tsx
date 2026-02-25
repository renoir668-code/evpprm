'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell, PieChart, Pie } from 'recharts';
import { Partner, Interaction } from '@/lib/types';
import { useMemo, useState } from 'react';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export function AnalyticsCharts({ partners, interactions, availableTeam }: { partners: Partner[], interactions: Interaction[], availableTeam: string[] }) {
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

    // Available verticals for filter dropdown
    const availableVerticals = useMemo(() => {
        const verticals = new Set<string>();
        partners.forEach(p => {
            if (p.vertical) verticals.add(p.vertical);
        });
        return Array.from(verticals).sort();
    }, [partners]);

    // Filter interactions based on filtered partners
    // And limit to timelineDays for the engagement chart
    const filteredInteractions = useMemo(() => {
        const partnerIds = new Set(filteredPartners.map(p => p.id));
        return interactions.filter(i => partnerIds.has(i.partner_id));
    }, [interactions, filteredPartners]);


    // Status distribution
    const statusData = useMemo(() => {
        const counts = filteredPartners.reduce((acc, current) => {
            let prods: any[] = [];
            try { prods = JSON.parse(current.integration_products || '[]'); } catch { }
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

    // Multi-tenant: Health by Vertical
    const healthByVerticalData = useMemo(() => {
        if (!selectedVertical) return []; // Only show if not filtering by a specific vertical (or maybe show all to compare)
        // Wait, if they filter by vertical, they just see that vertical's health.
        // Let's show a breakdown of health across ALL filtered partners, grouped by vertical.

        const countsByVertical: Record<string, { Active: number, 'At Risk': number, Dormant: number }> = {};

        filteredPartners.forEach(p => {
            const vertical = p.vertical || 'Uncategorized';
            if (!countsByVertical[vertical]) {
                countsByVertical[vertical] = { Active: 0, 'At Risk': 0, Dormant: 0 };
            }
            if (p.health_status === 'Active' || p.health_status === 'At Risk' || p.health_status === 'Dormant') {
                countsByVertical[vertical][p.health_status]++;
            }
        });

        return Object.entries(countsByVertical).map(([name, counts]) => ({
            name,
            Active: counts.Active,
            'At Risk': counts['At Risk'],
            Dormant: counts.Dormant
        })).sort((a, b) => (b.Active + b['At Risk'] + b.Dormant) - (a.Active + a['At Risk'] + a.Dormant)).slice(0, 10);
    }, [filteredPartners, selectedVertical]);

    // Multi-tenant: Interaction Frequency by Vertical
    const interactionsByVerticalData = useMemo(() => {
        const interactionsByVertical: Record<string, number> = {};

        filteredInteractions.forEach(i => {
            const partner = filteredPartners.find(p => p.id === i.partner_id);
            if (partner) {
                const vertical = partner.vertical || 'Uncategorized';
                interactionsByVertical[vertical] = (interactionsByVertical[vertical] || 0) + 1;
            }
        });

        return Object.entries(interactionsByVertical).map(([name, volume]) => ({
            name,
            volume
        })).sort((a, b) => b.volume - a.volume).slice(0, 10);
    }, [filteredInteractions, filteredPartners]);

    // Team Performance: Interactions Logged Per User
    const interactionsPerUser = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredInteractions.forEach(i => {
            const partner = filteredPartners.find(p => p.id === i.partner_id);
            if (partner && partner.key_person_id) {
                counts[partner.key_person_id] = (counts[partner.key_person_id] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, logCount]) => ({ name, logCount })).sort((a, b) => b.logCount - a.logCount);
    }, [filteredInteractions, filteredPartners]);

    // Team Performance: Partners Assigned Per User & Coverage Gaps
    const coveragePerUser = useMemo(() => {
        const counts: Record<string, { active: number, total: number }> = {};
        let unassigned = 0;

        filteredPartners.forEach(p => {
            if (!p.key_person_id) {
                unassigned++;
            } else {
                if (!counts[p.key_person_id]) {
                    counts[p.key_person_id] = { active: 0, total: 0 };
                }
                counts[p.key_person_id].total++;
                if (p.health_status === 'Active') {
                    counts[p.key_person_id].active++;
                }
            }
        });

        const data = Object.entries(counts).map(([name, stats]) => ({
            name,
            Active: stats.active,
            'Total Assigned': stats.total
        })).sort((a, b) => b['Total Assigned'] - a['Total Assigned']);

        if (unassigned > 0) {
            data.push({ name: 'Unassigned (Gap)', Active: 0, 'Total Assigned': unassigned });
        }

        return data;
    }, [filteredPartners]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
                <select className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    value={timelineDays} onChange={e => setTimelineDays(Number(e.target.value))}>
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>

                <select className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    value={selectedTeamMember} onChange={e => setSelectedTeamMember(e.target.value)}>
                    <option value="">All Team Members</option>
                    {availableTeam.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)}>
                    <option value="">All Partners</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <select className="bg-white/60 backdrop-blur-md border border-white rounded-xl px-4 py-3 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    value={selectedVertical} onChange={e => setSelectedVertical(e.target.value)}>
                    <option value="">All Verticals / Tenant Domains</option>
                    {availableVerticals.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>

            <div className={`grid grid-cols-1 gap-8 ${selectedPartnerId === '' ? '' : 'lg:grid-cols-2'}`}>
                <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        Integration Pipeline
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
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                        {statusData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                {entry.name} ({entry.value})
                            </div>
                        ))}
                    </div>
                </div>

                {selectedPartnerId !== '' && (
                    <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Engagement Velocity ({timelineDays} Days)
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Multi-Tenant: Health by Vertical
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={healthByVerticalData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="Active" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="At Risk" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="Dormant" stackId="a" fill="#ef4444" radius={[0, 6, 6, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                        Multi-Tenant: Interactions by Vertical
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={interactionsByVerticalData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="volume" fill="#d946ef" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                    <LabelList dataKey="volume" position="top" fill="#d946ef" fontSize={12} fontWeight={700} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Team Performance: Logs Recorded
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={interactionsPerUser}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="logCount" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                    <LabelList dataKey="logCount" position="top" fill="#f59e0b" fontSize={12} fontWeight={700} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        Owner Coverage & Unassigned Gaps
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={coveragePerUser} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="Active" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="Total Assigned" stackId="a" fill="#3b82f6" radius={[0, 6, 6, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
