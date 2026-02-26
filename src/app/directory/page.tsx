import { getPartners, getTags, getPartnerTags, getSettings } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { Partner, Tag } from '@/lib/types';
import PartnerList from '@/components/PartnerList';
import { getSession } from '@/lib/auth';
export type PartnerWithTags = Partner & { tags: Tag[] };

export default async function DirectoryPage() {
    const session = await getSession();
    const isAdmin = session?.role === 'Admin';

    const partners = await getPartners();
    const tags = await getTags();
    const settings = await getSettings();

    const productsSetting = settings.find(s => s.key === 'products')?.value || 'API, Dashboard, Integrations';
    const teamSetting = settings.find(s => s.key === 'team')?.value || 'Admin, Sales, Support';
    const availableProducts = productsSetting.split(',').map(s => s.trim()).filter(Boolean);
    const availableTeam = teamSetting.split(',').map(s => s.trim()).filter(Boolean);

    const partnersWithTags: PartnerWithTags[] = await Promise.all(
        partners.map(async (p) => {
            const pTags = await getPartnerTags(p.id);
            return { ...p, tags: pTags };
        })
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Partner Directory</h1>
                <p className="text-slate-500 mt-2">Browse and manage all your partnerships.</p>
            </div>

            <PartnerList
                initialPartners={partnersWithTags}
                allTags={tags}
                availableProducts={availableProducts}
                availableTeam={availableTeam}
                isAdmin={isAdmin}
            />
        </div>
    );
}
