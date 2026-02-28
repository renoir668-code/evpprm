import { getPartners, getTags, getAllPartnerTagsBulk, getSettings } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { Partner, Tag } from '@/lib/types';
import PartnerList from '@/components/PartnerList';
import { getSession } from '@/lib/auth';
import { getDict } from '@/lib/i18n';
import { parseSetting } from '@/lib/helpers';
export type PartnerWithTags = Partner & { tags: Tag[] };

export default async function DirectoryPage() {
    const session = await getSession();
    const isAdmin = session?.role === 'Admin';
    const dict = await getDict();

    const rawPartners = await getPartners();
    const partners = rawPartners.filter(p => p.use_case !== 'Merchant');
    const tags = await getTags();
    const settings = await getSettings();
    const tagMap = await getAllPartnerTagsBulk();

    const availableProducts = parseSetting(settings, 'products', 'API, Dashboard, Integrations');
    const availableTeam = parseSetting(settings, 'team', 'Admin, Sales, Support');
    const availableVerticals = parseSetting(settings, 'verticals', 'Music, Gaming, Finance');

    const partnersWithTags: PartnerWithTags[] = partners.map(p => ({
        ...p,
        tags: tagMap[p.id] || []
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{dict.directory.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{dict.directory.subtitle}</p>
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
