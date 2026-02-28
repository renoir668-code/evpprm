import { getSettings, getUsers, getPartners, getWorkgroups, getTags } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import { Settings as SettingsIcon } from 'lucide-react';
import SettingsForm from '@/components/SettingsForm';
import TagManagement from '@/components/TagManagement';
import UserManagement from '@/components/UserManagement';
import DeletePartnerSettings from '@/components/DeletePartnerSettings';
import { getDict } from '@/lib/i18n';
import { getSettingValue, parseSetting } from '@/lib/helpers';

export default async function SettingsPage() {
    const session = await getSession();
    const isAdmin = session?.role === 'Admin';
    const dict = await getDict();

    const settings = await getSettings();
    const productsSetting = getSettingValue(settings, 'products', 'API, Dashboard, Integrations');
    const teamSetting = getSettingValue(settings, 'team', 'Admin, Sales, Support');
    const verticalsSetting = getSettingValue(settings, 'verticals', 'Music, Gaming, Finance');
    const useCasesSetting = getSettingValue(settings, 'use_cases', 'B2B, B2C, Marketplace');
    const users = await getUsers();
    const partners = await getPartners();
    const workgroups = await getWorkgroups();
    const keyPeople = users.map(u => u.name).sort();
    const tags = await getTags();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{dict.settings.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{dict.settings.subtitle}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-semibold text-slate-900 dark:text-white">{dict.settings.globalSettings}</h2>
                </div>

                <SettingsForm
                    initialProducts={productsSetting}
                    initialVerticals={verticalsSetting}
                    initialUseCases={useCasesSetting}
                    dict={dict}
                />
            </div>

            {isAdmin && (
                <TagManagement tags={tags} dict={dict} />
            )}

            {isAdmin && (
                <UserManagement
                    initialUsers={users}
                    keyPeople={keyPeople}
                    initialWorkgroups={workgroups}
                    dict={dict}
                />
            )}

            {isAdmin && <DeletePartnerSettings partners={partners} dict={dict} />}
        </div>
    );
}
