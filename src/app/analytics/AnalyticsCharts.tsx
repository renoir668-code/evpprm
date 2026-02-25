'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell, PieChart, Pie } from 'recharts';
import { Partner, Interaction } from '@/lib/types';
import { useMemo, useState } from 'react';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export function AnalyticsCharts({ partners, interactions, availableTeam }: { partners: Partner[], interactions: Interaction[], availableTeam: string[] }) {
    const [timelineDays, setTimelineDays] = useState(14);
    const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

    // Filter partners based on selected team member or specific partner
    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            const matchTeam = selectedTeamMember ? p.key_person_id === selectedTeamMember : true;
            const matchPartner = selectedPartnerId ? p.id === selectedPartnerId : true;
            return matchTeam && matchPartner;
        });
    }, [partners, selectedTeamMember, selectedPartnerId]);

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
        </div>
    );
}
