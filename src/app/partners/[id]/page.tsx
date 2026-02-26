import { getPartner, getContacts, getInteractions, getPartnerTags, getSettings, getAllCustomReminders } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { Activity, Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import QuickActionForm from '@/components/QuickActionForm';
import { cn } from '@/lib/utils';
import { ProductIntegration } from '@/lib/types';
import ContactList from '@/components/ContactList';
import EditPartnerModal from '@/components/EditPartnerModal';
import PartnerReminders from '@/components/PartnerReminders';
import InteractionLogItem from '@/components/InteractionLogItem';

export default async function PartnerProfile({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const partner = await getPartner(resolvedParams.id);
    if (!partner) return notFound();

    const contacts = await getContacts(partner.id);
    const interactions = await getInteractions(partner.id);
    const tags = await getPartnerTags(partner.id);
    const customReminders = await getAllCustomReminders(partner.id);

    const settings = await getSettings();
    const productsSetting = settings.find(s => s.key === 'products')?.value || 'API, Dashboard, Integrations';
    const teamSetting = settings.find(s => s.key === 'team')?.value || 'Admin, Sales, Support';
    const verticalsSetting = settings.find(s => s.key === 'verticals')?.value || 'Music, Gaming, Finance';
    const useCasesSetting = settings.find(s => s.key === 'use_cases')?.value || 'B2B, B2C, Marketplace';

    const availableProducts = productsSetting.split(',').map(s => s.trim()).filter(Boolean);
    const availableTeam = teamSetting.split(',').map(s => s.trim()).filter(Boolean);
    const availableVerticals = verticalsSetting.split(',').map(s => s.trim()).filter(Boolean);
    const availableUseCases = useCasesSetting.split(',').map(s => s.trim()).filter(Boolean);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex justify-between items-center">
                <Link href="/directory" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Directory
                </Link>
                <EditPartnerModal partner={partner} availableProducts={availableProducts} availableTeam={availableTeam} availableVerticals={availableVerticals} availableUseCases={availableUseCases} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <span className="text-indigo-600 font-bold text-3xl">
                                {partner.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{partner.name}</h1>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                    className={cn(
                                        'text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5',
                                        partner.health_status === 'Active'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : partner.health_status === 'At Risk'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-slate-100 text-slate-800'
                                    )}
                                >
                                    <Activity className="w-3.5 h-3.5" />
                                    {partner.health_status}
                                </span>

                                {tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className={cn('text-xs px-2.5 py-1 rounded-md', tag.color)}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end text-sm text-slate-500">
                        <span className="font-medium text-slate-700 mb-2">Integrations</span>
                        <div className="flex flex-col gap-1.5 items-end">
                            {(() => {
                                let prods: ProductIntegration[] = [];
                                try { prods = JSON.parse(partner.integration_products || '[]'); } catch { }
                                if (prods.length === 0) return <span className="text-slate-400">None</span>;
                                return prods.map(p => (
                                    <span key={p.product} className={cn(
                                        "px-2.5 py-1 bg-slate-50 rounded-md font-bold text-slate-700 text-xs border border-slate-200",
                                        p.status === 'Finished' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                        p.status === 'On hold' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                        p.status === 'In pipeline' && 'bg-blue-50 text-blue-700 border-blue-200'
                                    )}>
                                        {p.product}: {p.status}
                                    </span>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-500" />
                                    Interaction Log
                                </h2>
                            </div>

                            <QuickActionForm partnerId={partner.id} />

                            <PartnerReminders partnerId={partner.id} initialReminders={customReminders} />

                            <div className="mt-6 space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {interactions.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 ms-12 md:ms-0 relative z-10 bg-white rounded-lg border border-slate-100">
                                        <p>No interactions logged yet.</p>
                                    </div>
                                ) : (
                                    interactions.map((interaction) => (
                                        <InteractionLogItem key={interaction.id} interaction={interaction} />
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                Key Info
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Key Person</span>
                                    <span className="font-medium text-slate-900">{partner.key_person_id || 'Unassigned'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Attention Threshold</span>
                                    <span className="font-medium text-slate-900">{partner.needs_attention_days} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Partner Since</span>
                                    <span className="font-medium text-slate-900">{new Date(partner.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Vertical</span>
                                    <span className="font-medium text-slate-900">{partner.vertical || 'None'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Use Case</span>
                                    <span className="font-medium text-slate-900">{partner.use_case || 'None'}</span>
                                </div>
                            </div>
                        </section>

                        <ContactList partnerId={partner.id} initialContacts={contacts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
