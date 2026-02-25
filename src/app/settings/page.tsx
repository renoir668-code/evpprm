import { getSettings, getUsers, getPartners } from '@/lib/actions';
import { getSession } from '@/lib/auth';
import { Settings as SettingsIcon, Users } from 'lucide-react';
import SettingsForm from '@/components/SettingsForm';
import UserManagement from '@/components/UserManagement';
import DeletePartnerSettings from '@/components/DeletePartnerSettings';

export default async function SettingsPage() {
    const session = await getSession();
    const isAdmin = session?.role === 'Admin';

    const settings = await getSettings();
    const productsSetting = settings.find(s => s.key === 'products')?.value || 'API, Dashboard, Integrations';
    const teamSetting = settings.find(s => s.key === 'team')?.value || 'Admin, Sales, Support';
    const verticalsSetting = settings.find(s => s.key === 'verticals')?.value || 'Music, Gaming, Finance';
    const useCasesSetting = settings.find(s => s.key === 'use_cases')?.value || 'B2B, B2C, Marketplace';
    const users = await getUsers();
    const partners = await getPartners();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
                <p className="text-slate-500 mt-2">Manage global configurations for your PRM.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-semibold text-slate-900">Global Settings</h2>
                </div>

                <SettingsForm
                    initialProducts={productsSetting}
                    initialTeam={teamSetting}
                    initialVerticals={verticalsSetting}
                    initialUseCases={useCasesSetting}
                />
            </div>

            <UserManagement initialUsers={users} />

            {isAdmin && <DeletePartnerSettings partners={partners} />}
        </div>
    );
}
