import { getSettings, getUsers, getPartners, getWorkgroups, getKeyPeople } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import { Settings as SettingsIcon, Users } from 'lucide-react';
import SettingsForm from '@/components/SettingsForm';
import UserManagement from '@/components/UserManagement';
import DeletePartnerSettings from '@/components/DeletePartnerSettings';
import { getDict } from '@/lib/i18n';

export default async function SettingsPage() {
    const session = await getSession();
    const isAdmin = session?.role === 'Admin';
    const dict = await getDict();

    const settings = await getSettings();
    const productsSetting = settings.find(s => s.key === 'products')?.value || 'API, Dashboard, Integrations';
    const teamSetting = settings.find(s => s.key === 'team')?.value || 'Admin, Sales, Support';
    const verticalsSetting = settings.find(s => s.key === 'verticals')?.value || 'Music, Gaming, Finance';
    const useCasesSetting = settings.find(s => s.key === 'use_cases')?.value || 'B2B, B2C, Marketplace';
    const users = await getUsers();
    const partners = await getPartners();
    const workgroups = await getWorkgroups();
    const keyPeople = teamSetting.split(',').map(s => s.trim()).filter(Boolean);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.settings.title}</h1>
                <p className="text-slate-500 mt-2">{dict.settings.subtitle}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-semibold text-slate-900">{dict.settings.globalSettings}</h2>
                </div>

                <SettingsForm
                    initialProducts={productsSetting}
                    initialTeam={teamSetting}
                    initialVerticals={verticalsSetting}
                    initialUseCases={useCasesSetting}
                    dict={dict}
                />
            </div>

            <UserManagement
                initialUsers={users}
                keyPeople={keyPeople}
                initialWorkgroups={workgroups}
                dict={dict}
            />

            {isAdmin && <DeletePartnerSettings partners={partners} dict={dict} />}
        </div>
    );
}
