'use client';

import { useState } from 'react';
import { Tag } from '@/lib/types';
import { createTag, updateTag, deleteTag } from '@/lib/actions';
import { Tags, Plus, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TagManagement({ tags, dict }: { tags: Tag[], dict: any }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingState, setEditingState] = useState<{ id: string | null, name: string, color: string }>({ id: null, name: '', color: '' });
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100');

    const colorOptions = [
        'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
        'bg-indigo-100 text-indigo-800',
        'bg-emerald-100 text-emerald-800',
        'bg-amber-100 text-amber-800',
        'bg-red-100 text-red-800',
        'bg-sky-100 text-sky-800',
        'bg-purple-100 text-purple-800',
        'bg-fuchsia-100 text-fuchsia-800',
        'bg-pink-100 text-pink-800',
    ];

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        setIsSubmitting(true);
        try {
            await createTag(newName, newColor);
            setNewName('');
            setNewColor(colorOptions[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editingState.name) return;
        setIsSubmitting(true);
        try {
            await updateTag(id, editingState.name, editingState.color);
            setEditingState({ id: null, name: '', color: '' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tag? All partners will lose it.')) return;
        setIsSubmitting(true);
        try {
            await deleteTag(id);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Tags className="w-5 h-5 text-indigo-500" />
                        Tag Management
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create and manage tags for partners.
                    </p>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
                <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="New tag name"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/30 outline-none transition-all outline-none"
                        required
                    />
                    <select
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        title="Tag Color"
                        className={cn("px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/30 outline-none transition-all appearance-none cursor-pointer", newColor)}
                    >
                        {colorOptions.map(co => (
                            <option key={co} value={co} className={co}>
                                Style
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={isSubmitting || !newName}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-indigo-600/20 whitespace-nowrap"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add Tag
                    </button>
                </form>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {tags.map(t => (
                            <div key={t.id} className="group relative flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200 transition-colors">
                                {editingState.id === t.id ? (
                                    <div className="flex-1 flex flex-col gap-2">
                                        <input
                                            type="text"
                                            title="Edit Tag Name"
                                            placeholder="Tag name"
                                            value={editingState.name}
                                            onChange={e => setEditingState({ ...editingState, name: e.target.value })}
                                            className="w-full px-2 py-1 text-sm border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 outline-none font-medium"
                                        />
                                        <select
                                            title="Edit Tag Color"
                                            value={editingState.color}
                                            onChange={e => setEditingState({ ...editingState, color: e.target.value })}
                                            className={cn("w-full px-2 py-1 text-sm border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 outline-none font-medium", editingState.color)}
                                        >
                                            {colorOptions.map(co => (
                                                <option key={co} value={co} className={co}>Style</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <span className={cn("px-3 py-1 rounded-md text-sm font-medium", t.color)}>
                                        {t.name}
                                    </span>
                                )}

                                <div className="ml-2 flex items-center gap-1">
                                    {editingState.id === t.id ? (
                                        <>
                                            <button onClick={() => handleUpdate(t.id)} disabled={isSubmitting} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Save">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingState({ id: null, name: '', color: '' })} disabled={isSubmitting} className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Cancel">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setEditingState({ id: t.id, name: t.name, color: t.color })} disabled={isSubmitting} className="p-1.5 opacity-0 group-hover:opacity-100 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} disabled={isSubmitting} className="p-1.5 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {tags.length === 0 && (
                            <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                No tags created yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
