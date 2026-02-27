import { getPartners } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { PipelineBoard } from './PipelineBoard';
import { getDict } from '@/lib/i18n';

export default async function PipelinePage() {
    const partners = await getPartners();
    const dict = await getDict();

    return (
        <div className="space-y-6 h-full flex flex-col pt-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.pipeline.title}</h1>
                <p className="text-slate-500 mt-2">{dict.pipeline.subtitle}</p>
            </div>

            <PipelineBoard initialPartners={partners} dict={dict} />
        </div>
    );
}
