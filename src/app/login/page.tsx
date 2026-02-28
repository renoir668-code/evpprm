'use client';

import { login } from './actions';
import { Shield } from 'lucide-react';
import { useActionState } from 'react';

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, null);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mx-auto w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-6 relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur" />
                    <span className="text-3xl font-bold text-indigo-600 relative z-10 block">U</span>
                </div>
                <h2 className="mt-2 text-center text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    EVP PRM
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Please log in to your account.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-black/30 sm:rounded-3xl sm:px-10 border border-white dark:border-slate-800">
                    <form className="space-y-6" action={formAction}>
                        {state?.error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                {state.error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                                Username or Email
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    className="block w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/30 transition-all font-medium sm:text-sm shadow-sm"
                                    placeholder="Enter your username or email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/30 transition-all font-medium sm:text-sm shadow-sm"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="group relative flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isPending ? 'Signing In...' : 'Sign In'}
                                <div className="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
