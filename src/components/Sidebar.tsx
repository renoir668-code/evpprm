'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Settings, CreditCard, LogOut, KanbanSquare, PieChart, Globe, Store, Moon, Sun, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/login/actions';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { NotificationManager } from '@/components/NotificationManager';

export function Sidebar({ userName, userRole, dict, initialLang }: { userName?: string, userRole?: string, dict: any, initialLang: string }) {
    const pathname = usePathname();
    const router = useRouter();

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

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
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between glass rounded-[24px] p-4 shrink-0 shadow-sm relative z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/50 dark:ring-slate-700/50">
                        <span className="text-xl font-bold">U</span>
                    </div>
                    <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">EVP PRM</span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2.5 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors">
                    {isOpen ? <X className="w-5 h-5 text-slate-700 dark:text-slate-200" /> : <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />}
                </button>
            </div>

            {/* Sidebar Desktop + Mobile Overlay */}
            <div className={cn(
                "md:w-68 glass md:rounded-[32px] flex flex-col shrink-0 relative overflow-hidden md:shadow-2xl shadow-indigo-900/5 transition-all duration-300 ease-in-out md:static absolute inset-x-4 top-24 bottom-4 z-40 md:h-full rounded-3xl",
                isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none md:opacity-100 md:translate-y-0 md:pointer-events-auto"
            )}>
                {/* Subtle inner gradient for sidebar */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/20 dark:from-transparent dark:to-transparent pointer-events-none" />

                <div className="hidden md:flex px-8 py-10 items-center gap-4 relative z-10">
                    <div className="flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-400 w-11 h-11 rounded-2xl text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/50 dark:ring-slate-700/50">
                        <span className="text-2xl font-bold">U</span>
                    </div>
                    <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">EVP PRM</span>
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
                                        ? 'bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.06)] text-indigo-600 ring-1 ring-black/5 scale-[1.02]'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:bg-slate-800/60 hover:text-slate-800 hover:scale-[1.02]'
                                )}
                            >
                                <item.icon className={cn('w-5 h-5 transition-transform duration-300', active ? 'text-indigo-500 scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600')} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-5 mb-4 relative z-10 space-y-2">
                    <div className="flex items-center justify-between px-5 mb-3 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs"><Globe className="w-4 h-4" /> Lang</div>
                        <div className="flex gap-1">
                            <button onClick={() => switchLanguage('en')} className={cn("text-xs font-bold px-2 py-1 rounded-md transition-all", initialLang === 'en' ? 'bg-indigo-500 text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900')} title="English">EN</button>
                            <button onClick={() => switchLanguage('pt-PT')} className={cn("text-xs font-bold px-2 py-1 rounded-md transition-all", initialLang === 'pt-PT' ? 'bg-indigo-500 text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900')} title="Português">PT</button>
                        </div>
                    </div>

                    {mounted && (
                        <div className="flex items-center justify-between px-5 mb-3 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs">
                                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Theme
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => setTheme('light')} className={cn("text-xs font-bold px-2 py-1 rounded-md transition-all", theme === 'light' ? 'bg-indigo-500 text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900')} title="Light Mode">LT</button>
                                <button onClick={() => setTheme('dark')} className={cn("text-xs font-bold px-2 py-1 rounded-md transition-all", theme === 'dark' ? 'bg-indigo-500 text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900')} title="Dark Mode">DK</button>
                            </div>
                        </div>
                    )}

                    <Link
                        href="/settings"
                        className={cn(
                            'flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group font-bold tracking-wide text-sm',
                            pathname.startsWith('/settings')
                                ? 'bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.06)] text-indigo-600 ring-1 ring-black/5 scale-[1.02]'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:bg-slate-800/60 hover:text-slate-800 hover:scale-[1.02]'
                        )}
                    >
                        <Settings className="w-5 h-5 transition-transform duration-300 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 group-hover:rotate-45" />
                        {dict.sidebar.settings}
                    </Link>

                    <div className="pt-4 mt-2 border-t border-slate-200/50">

                        <div className="px-5 py-2">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{userName || 'User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">{userRole || 'Member'}</p>
                            <NotificationManager />
                        </div>
                        <form action={logout}>
                            <button
                                type="submit"
                                className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300 group font-bold tracking-wide text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                                <LogOut className="w-5 h-5 transition-transform duration-300 text-slate-400 dark:text-slate-500 group-hover:text-red-500" />
                                {dict.sidebar.signOut}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
