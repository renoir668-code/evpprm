import { getPartner, getContacts, getInteractions, getPartnerTags, getSettings, getAllCustomReminders, getUsers } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { Activity, Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import QuickActionForm from '@/components/QuickActionForm';
import { cn } from '@/lib/utils';
import ContactList from '@/components/ContactList';
import EditPartnerModal from '@/components/EditPartnerModal';
import PartnerReminders from '@/components/PartnerReminders';
import InteractionLogItem from '@/components/InteractionLogItem';
import { getDict } from '@/lib/i18n';
import { parseSetting, parseProducts } from '@/lib/helpers';
import { PartnerPipeline } from '@/components/PartnerPipeline';

export default async function PartnerProfile({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const partner = await getPartner(resolvedParams.id);
    if (!partner) return notFound();

    const dict = await getDict();

    const contacts = await getContacts(partner.id);
    const interactions = await getInteractions(partner.id);
    const tags = await getPartnerTags(partner.id);
    const customReminders = await getAllCustomReminders(partner.id);

    const settings = await getSettings();

    const availableProducts = parseSetting(settings, 'products', 'API, Dashboard, Integrations');
    const allUsers = await getUsers();
    const availableTeam = allUsers.map(u => u.name).sort();
    const availableVerticals = parseSetting(settings, 'verticals', 'Music, Gaming, Finance');
    const availableUseCases = parseSetting(settings, 'use_cases', 'B2B, B2C, Marketplace');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex justify-between items-center">
                <Link
                    href={partner.use_case === 'Merchant' ? '/merchants' : '/directory'}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {partner.use_case === 'Merchant' ? dict.merchants.backToMerchants : dict.partnerDetail.backToDirectory}
                </Link>
                <EditPartnerModal partner={partner} availableProducts={availableProducts} availableTeam={availableTeam} availableVerticals={availableVerticals} availableUseCases={availableUseCases} dict={dict} />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner">
                            {partner.logo_url ? (
                                <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-indigo-600 font-bold text-3xl">
                                    {partner.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{partner.name}</h1>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                    className={cn(
                                        'text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5',
                                        partner.health_status === 'Active'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : partner.health_status === 'At Risk'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                                    )}
                                >
                                    <Activity className="w-3.5 h-3.5" />
                                    {partner.health_status === 'Active' ? dict.common.active :
                                        partner.health_status === 'At Risk' ? dict.common.atRisk :
                                            partner.health_status === 'Dormant' ? dict.common.dormant :
                                                partner.health_status}
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
                    <div className="flex flex-col items-end text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-200 mb-2">{dict.partnerDetail.integrations}</span>
                        <div className="flex flex-col gap-1.5 items-end">
                            {(() => {
                                const prods = parseProducts(partner.integration_products);
                                if (prods.length === 0) return <span className="text-slate-400 dark:text-slate-500">{dict.common.none}</span>;
                                return prods.map(p => (
                                    <span key={p.product} className={cn(
                                        "px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-md font-bold text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700",
                                        p.status === 'Finished' && 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200',
                                        p.status === 'On hold' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                        p.status === 'In pipeline' && 'bg-blue-50 text-blue-700 border-blue-200'
                                    )}>
                                        {p.product}: {
                                            p.status === 'Finished' ? dict.common.finished :
                                                p.status === 'On hold' ? dict.common.onHold :
                                                    p.status === 'In pipeline' ? dict.common.inPipeline :
                                                        p.status
                                        }
                                    </span>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <PartnerPipeline partner={partner} dict={dict} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-500" />
                                    {dict.partnerDetail.interactionLog}
                                </h2>
                            </div>

                            <QuickActionForm partnerId={partner.id} dict={dict} />

                            <PartnerReminders partnerId={partner.id} initialReminders={customReminders} dict={dict} />

                            <div className="mt-6 space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {interactions.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 ms-12 md:ms-0 relative z-10 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <p>{dict.partnerDetail.noInteractions}</p>
                                    </div>
                                ) : (
                                    interactions.map((interaction) => (
                                        <InteractionLogItem key={interaction.id} interaction={interaction} dict={dict} />
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                {dict.partnerDetail.keyInfo}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{dict.partnerDetail.keyPerson}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{partner.key_person_id || dict.common.unassigned}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{dict.partnerDetail.attentionThreshold}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{partner.needs_attention_days} {dict.common.days}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{dict.partnerDetail.partnerSince}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{new Date(partner.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{dict.partnerDetail.vertical}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{partner.vertical || dict.common.none}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{dict.partnerDetail.useCase}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{partner.use_case || dict.common.none}</span>
                                </div>
                            </div>
                        </section>

                        <ContactList partnerId={partner.id} initialContacts={contacts} dict={dict} />
                    </div>
                </div>
            </div>
        </div>
    );
}
