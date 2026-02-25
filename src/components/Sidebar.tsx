'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Settings, Handshake, LogOut, PanelLeft, KanbanSquare, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/login/actions';

export function Sidebar({ userName, userRole }: { userName?: string, userRole?: string }) {
    const pathname = usePathname();

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { label: 'Directory', icon: Users, href: '/directory' },
        { label: 'Pipeline', icon: KanbanSquare, href: '/pipeline' },
        { label: 'Reminders', icon: Calendar, href: '/reminders' },
        { label: 'Analytics', icon: PieChart, href: '/analytics' },
    ];

    return (
        <div className="w-68 glass rounded-[32px] h-full flex flex-col shrink-0 relative overflow-hidden shadow-2xl shadow-indigo-900/5">
            {/* Subtle inner gradient for sidebar */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/20 pointer-events-none" />

            <div className="px-8 py-10 flex items-center gap-4 relative z-10">
                <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/50">
                    <Handshake className="w-6 h-6" />
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
                    Settings
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
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
