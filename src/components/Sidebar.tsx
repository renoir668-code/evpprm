'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Settings, CreditCard, LogOut, PanelLeft, KanbanSquare, PieChart, Globe, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/login/actions';

export function Sidebar({ userName, userRole, dict, initialLang }: { userName?: string, userRole?: string, dict: any, initialLang: string }) {
    const pathname = usePathname();
    const router = useRouter();

    const switchLanguage = (lang: string) => {
        document.cookie = `lang=${lang}; path=/; max-age=31536000`;
        router.refresh();
    };

    const navItems = [
        { label: dict.sidebar.dashboard, icon: LayoutDashboard, href: '/' },
        { label: dict.sidebar.directory, icon: Users, href: '/directory' },
        { label: dict.sidebar.merchants, icon: Store, href: '/merchants' },
        { label: dict.sidebar.pipeline, icon: KanbanSquare, href: '/pipeline' },
        { label: dict.sidebar.reminders, icon: Calendar, href: '/reminders' },
        { label: dict.sidebar.analytics, icon: PieChart, href: '/analytics' },
    ];

    return (
        <div className="w-68 glass rounded-[32px] h-full flex flex-col shrink-0 relative overflow-hidden shadow-2xl shadow-indigo-900/5">
            {/* Subtle inner gradient for sidebar */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/20 pointer-events-none" />

            <div className="px-8 py-10 flex items-center gap-4 relative z-10">
                <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/50">
                    <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">EVP PRM</span>
            </div>

            <nav className="flex-1 px-5 space-y-3 mt-4 relative z-10">
                {navItems.map((item) => {
                    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group font-bold tracking-wide text-sm',
                                active
                                    ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] text-indigo-600 ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 hover:scale-[1.02]'
                            )}
                        >
                            <item.icon className={cn('w-5 h-5 transition-transform duration-300', active ? 'text-indigo-500 scale-110' : 'text-slate-400 group-hover:text-slate-600')} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-5 mb-4 relative z-10 space-y-2">
                <div className="flex items-center justify-between px-5 mb-3 bg-white/40 rounded-xl p-2">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs"><Globe className="w-4 h-4" /> Lang</div>
                    <div className="flex gap-1">
                        <button onClick={() => switchLanguage('en')} className={cn("text-xs font-bold px-2 py-1 rounded-md transition-all", initialLang === 'en' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white')} title="English">EN</button>
                        <button onClick={() => switchLanguage('pt-PT')} className={cn("text-xs font-bold px-2 py-1 rounded-md transition-all", initialLang === 'pt-PT' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white')} title="Português">PT</button>
                    </div>
                </div>

                <Link
                    href="/settings"
                    className={cn(
                        'flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group font-bold tracking-wide text-sm',
                        pathname.startsWith('/settings')
                            ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] text-indigo-600 ring-1 ring-black/5 scale-[1.02]'
                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 hover:scale-[1.02]'
                    )}
                >
                    <Settings className="w-5 h-5 transition-transform duration-300 text-slate-400 group-hover:text-slate-600 group-hover:rotate-45" />
                    {dict.sidebar.settings}
                </Link>

                <div className="pt-4 mt-2 border-t border-slate-200/50">
                    <div className="px-5 py-2">
                        <p className="text-sm font-bold text-slate-800">{userName || 'User'}</p>
                        <p className="text-xs text-slate-500 font-medium">{userRole || 'Member'}</p>
                    </div>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300 group font-bold tracking-wide text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOut className="w-5 h-5 transition-transform duration-300 text-slate-400 group-hover:text-red-500" />
                            {dict.sidebar.signOut}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
