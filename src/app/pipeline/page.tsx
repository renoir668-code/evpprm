import { getPartners } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { PipelineBoard } from './PipelineBoard';

export default async function PipelinePage() {
    const partners = await getPartners();

    return (
        <div className="space-y-6 h-full flex flex-col pt-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pipeline</h1>
                <p className="text-slate-500 mt-2">Manage integration and partnership lifecycles.</p>
            </div>

            <PipelineBoard initialPartners={partners} />
        </div>
    );
}
