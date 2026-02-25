'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function ReminderFilter({ availableTeam, initialOwner }: { availableTeam: string[], initialOwner: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    return (
        <select
            className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm outline-none text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer sm:w-auto w-full"
            value={initialOwner}
            onChange={(e) => {
                router.push('/reminders?' + createQueryString('owner', e.target.value));
            }}
        >
            <option value="">All Team Members</option>
            {availableTeam.map((t) => (
                <option key={t} value={t}>
                    {t}
                </option>
            ))}
        </select>
    );
}
