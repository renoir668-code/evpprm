'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Building2, Users, FileText, ArrowRight } from 'lucide-react';
import { searchAll } from '@/lib/actions';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [results, setResults] = useState<{ type: string, id: string, url: string, title: string, subtitle: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        } else if (!isOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const res = await searchAll(debouncedQuery);
                setResults(res);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
            }
            if (e.key === 'Enter' && results.length > 0) {
                e.preventDefault();
                const selected = results[selectedIndex];
                if (selected) {
                    router.push(selected.url);
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, router]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                    {isLoading ? <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /> : <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                    <input
                        ref={inputRef}
                        type="text"
                        title="Global Search"
                        placeholder="Search partners, contacts, notes..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-lg font-medium"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        ESC
                    </div>
                </div>

                {query && results.length === 0 && !isLoading && (
                    <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        No results found for "{query}"
                    </div>
                )}

                {results.length > 0 && (
                    <div className="max-h-[50vh] overflow-y-auto p-2">
                        {results.map((r, i) => (
                            <button
                                key={r.id + i}
                                onClick={() => { router.push(r.url); setIsOpen(false); }}
                                onMouseEnter={() => setSelectedIndex(i)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-left group",
                                    selectedIndex === i ? "bg-indigo-50 dark:bg-indigo-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                                    r.type === 'Partner' ? "bg-indigo-100/50 dark:bg-indigo-900/50 border-indigo-200 text-indigo-600" :
                                        r.type === 'Contact' ? "bg-emerald-100/50 dark:bg-emerald-900/50 border-emerald-200 text-emerald-600" :
                                            "bg-amber-100/50 dark:bg-amber-900/50 border-amber-200 text-amber-600"
                                )}>
                                    {r.type === 'Partner' ? <Building2 className="w-4 h-4" /> :
                                        r.type === 'Contact' ? <Users className="w-4 h-4" /> :
                                            <FileText className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate focus-visible:outline-none">{r.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium mt-0.5">{r.subtitle}</p>
                                </div>
                                <ArrowRight className={cn(
                                    "w-4 h-4 shrink-0 transition-opacity",
                                    selectedIndex === i ? "text-indigo-500 opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-50"
                                )} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
