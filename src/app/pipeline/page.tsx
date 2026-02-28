import { getPartners, getSettings, getUsers } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { PipelineBoard } from './PipelineBoard';
import { getDict } from '@/lib/i18n';
import { parseSetting } from '@/lib/helpers';

export default async function PipelinePage() {
    const partners = await getPartners();
    const settings = await getSettings();
    const dict = await getDict();

    const availableProducts = parseSetting(settings, 'products', 'API, Dashboard, Integrations');
    const allUsers = await getUsers();
    const availableTeam = allUsers.map(u => u.name).sort();
    const availableVerticals = parseSetting(settings, 'verticals', 'Music, Gaming, Finance');

    return (
        <div className="space-y-6 h-full flex flex-col pt-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{dict.pipeline.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{dict.pipeline.subtitle}</p>
            </div>

            <PipelineBoard
                initialPartners={partners}
                dict={dict}
                availableProducts={availableProducts}
                availableTeam={availableTeam}
                availableVerticals={availableVerticals}
            />
        </div>
    );
}
