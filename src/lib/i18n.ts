import { cookies } from 'next/headers';

export const dictionaries = {
    'en': {
        sidebar: {
            dashboard: 'Dashboard',
            directory: 'Directory',
            pipeline: 'Pipeline',
            reminders: 'Reminders',
            analytics: 'Analytics',
            settings: 'Settings',
            signOut: 'Sign Out'
        },
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Overview of your partner ecosystem.',
            totalPartners: 'Total Partners',
            activeCollaborations: 'Active Collaborations',
            needsAttention: 'Needs Attention',
            nextAppointments: 'Next Appointments',
            noUpcoming: 'No upcoming appointments.',
            lastInteractions: 'Last Interactions',
            noRecent: 'No recent interactions.',
            partnersNeeding: 'Partners Needing Attention',
            pending: 'pending',
            allCaughtUp: 'All caught up!',
            noPartnersRequire: 'No partners currently require immediate attention.',
            lastInteraction: 'Last interaction:',
            daysAgo: 'days ago',
            threshold: 'Threshold:',
            days: 'days',
            never: 'Never',
        }
    },
    'pt-PT': {
        sidebar: {
            dashboard: 'Dashboard',
            directory: 'Diretório',
            pipeline: 'Pipeline',
            reminders: 'Lembretes',
            analytics: 'Analytics',
            settings: 'Definições',
            signOut: 'Sair'
        },
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Visão geral do ecossistema de parceiros.',
            totalPartners: 'Total de Parceiros',
            activeCollaborations: 'Parceiros Ativos',
            needsAttention: 'Necessita Atenção',
            nextAppointments: 'Próximas Reuniões',
            noUpcoming: 'Sem reuniões agendadas.',
            lastInteractions: 'Últimas Interações',
            noRecent: 'Sem interações recentes.',
            partnersNeeding: 'Parceiros a Necessitar de Atenção',
            pending: 'pendentes',
            allCaughtUp: 'Tudo em dia!',
            noPartnersRequire: 'Nenhum parceiro requer atenção imediata.',
            lastInteraction: 'Última interação:',
            daysAgo: 'dias atrás',
            threshold: 'Limite:',
            days: 'dias',
            never: 'Nunca',
        }
    }
};

export type Locale = 'en' | 'pt-PT';
export type Dictionary = typeof dictionaries['en'];

export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const loc = cookieStore.get('lang')?.value;
    return loc === 'pt-PT' ? 'pt-PT' : 'en';
}

export async function getDict(): Promise<Dictionary> {
    const locale = await getLocale();
    return dictionaries[locale];
}
