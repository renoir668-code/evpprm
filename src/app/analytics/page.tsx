import { getPartners, getInteractions, getSettings } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { AnalyticsCharts } from './AnalyticsCharts';
import { Partner, Interaction } from '@/lib/types';
import { PieChart as PieChartIcon, TrendingUp, Users as UsersIcon, Activity } from 'lucide-react';
import { getDict } from '@/lib/i18n';

export default async function AnalyticsPage() {
    const partners = await getPartners();
    const settings = await getSettings();
    const dict = await getDict();
    const teamSetting = settings.find(s => s.key === 'team')?.value || 'Admin, Sales, Support';
    const availableTeam = teamSetting.split(',').map(s => s.trim()).filter(Boolean);

    // Process top-level metrics
    const totalPartners = partners.length;
    const activePartners = partners.filter(p => p.health_status === 'Active').length;

    const allInteractions = await Promise.all(
        partners.map(p => getInteractions(p.id))
    );
    const flatInteractions = allInteractions.flat();

    // Last 30 days active
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentInteractions = flatInteractions.filter(i => new Date(i.date) >= thirtyDaysAgo);

    const uniqueEngaged = new Set(recentInteractions.map(i => i.partner_id)).size;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-8">
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-3xl blur-2xl -z-10" />
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">{dict.analytics.title}</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">{dict.analytics.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard icon={UsersIcon} label={dict.analytics.totalPartners} value={totalPartners} color="bg-indigo-50" textColor="text-indigo-600" />
                <MetricCard icon={Activity} label={dict.analytics.activeStatus} value={activePartners} color="bg-emerald-50" textColor="text-emerald-600" />
                <MetricCard icon={PieChartIcon} label={dict.analytics.totalInteractions} value={flatInteractions.length} color="bg-amber-50" textColor="text-amber-600" />
                <MetricCard icon={TrendingUp} label={dict.analytics.thirtyDayEngaged} value={uniqueEngaged} color="bg-purple-50" textColor="text-purple-600" />
            </div>

            <div className="glass-card rounded-[32px] overflow-hidden p-8 border border-white/60">
                <h2 className="text-xl font-bold text-slate-800 mb-6">{dict.analytics.pipelineEngagement}</h2>
                <AnalyticsCharts partners={partners} interactions={flatInteractions} availableTeam={availableTeam} dict={dict} />
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color, textColor }: { icon: any, label: string, value: number, color: string, textColor: string }) {
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4 ${color}`}>
                <Icon className={`w-6 h-6 ${textColor}`} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">{value}</p>
        </div>
    );
}
