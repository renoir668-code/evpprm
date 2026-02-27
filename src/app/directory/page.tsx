import { getPartners, getTags, getPartnerTags, getSettings } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { Partner, Tag } from '@/lib/types';
import PartnerList from '@/components/PartnerList';
import { getSession } from '@/lib/auth';
import { getDict } from '@/lib/i18n';
export type PartnerWithTags = Partner & { tags: Tag[] };

export default async function DirectoryPage() {
    const session = await getSession();
    const isAdmin = session?.role === 'Admin';
    const dict = await getDict();

    const partners = await getPartners();
    const tags = await getTags();
    const settings = await getSettings();

    const productsSetting = settings.find(s => s.key === 'products')?.value || 'API, Dashboard, Integrations';
    const teamSetting = settings.find(s => s.key === 'team')?.value || 'Admin, Sales, Support';
    const verticalsSetting = settings.find(s => s.key === 'verticals')?.value || 'Music, Gaming, Finance';
    const availableProducts = productsSetting.split(',').map(s => s.trim()).filter(Boolean);
    const availableTeam = teamSetting.split(',').map(s => s.trim()).filter(Boolean);
    const availableVerticals = verticalsSetting.split(',').map(s => s.trim()).filter(Boolean);

    const partnersWithTags: PartnerWithTags[] = await Promise.all(
        partners.map(async (p) => {
            const pTags = await getPartnerTags(p.id);
            return { ...p, tags: pTags };
        })
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.directory.title}</h1>
                <p className="text-slate-500 mt-2">{dict.directory.subtitle}</p>
            </div>

            <PartnerList
                initialPartners={partnersWithTags}
                allTags={tags}
                availableProducts={availableProducts}
                availableTeam={availableTeam}
                availableVerticals={availableVerticals}
                isAdmin={isAdmin}
                dict={dict}
            />
        </div>
    );
}
