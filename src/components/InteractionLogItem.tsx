'use client';

import { useState } from 'react';
import { Interaction } from '@/lib/types';
import { updateInteraction, uploadAttachment } from '@/lib/actions';
import { Phone, Calendar, Mail, Paperclip, Save, X, Edit2, Loader2 } from 'lucide-react';

export default function InteractionLogItem({ interaction }: { interaction: Interaction }) {
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState(interaction.notes || '');
    const [date, setDate] = useState(interaction.date ? new Date(interaction.date).toISOString().slice(0, 16) : '');

    // Parse attachments Safely
    const [attachments, setAttachments] = useState<{ name: string, url: string }[]>(() => {
        try {
            return interaction.attachments ? JSON.parse(interaction.attachments) : [];
        } catch { return []; }
    });

    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const md = new FormData();
        md.append('file', file);

        try {
            const uploadedUrl = await uploadAttachment(md);
            setAttachments(prev => [...prev, { name: file.name, url: uploadedUrl }]);
        } catch (error) {
            console.error('Failed to upload', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateInteraction(interaction.id, {
                notes,
                date: new Date(date).toISOString(),
                attachments: JSON.stringify(attachments)
            });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveAttachment = (url: string) => {
        setAttachments(prev => prev.filter(a => a.url !== url));
    };

    return (
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                {interaction.type === 'call' ? <Phone className="w-4 h-4" /> :
                    interaction.type === 'meeting' ? <Calendar className="w-4 h-4" /> :
                        <Mail className="w-4 h-4" />}
            </div>

            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-10 group-hover:border-indigo-200 transition-colors">
                {!isEditing ? (
                    <>
                        <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-slate-900 capitalize">{interaction.type}</div>
                            <div className="flex items-center gap-3">
                                <time className="text-xs font-medium text-slate-500">
                                    {new Date(interaction.date).toLocaleDateString()}
                                </time>
                                <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="text-slate-600 text-sm whitespace-pre-wrap">{interaction.notes}</div>
                        {attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                                {attachments.map((att, i) => (
                                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                                        <Paperclip className="w-3 h-3" />
                                        {att.name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="font-bold text-indigo-600 text-sm flex items-center gap-2">Edit Interaction</div>
                            <input
                                type="datetime-local"
                                className="text-xs border border-slate-200 rounded p-1 outline-none text-slate-600 focus:border-indigo-500"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <textarea
                            className="w-full text-sm resize-y outline-none border border-slate-200 rounded-md p-2 focus:border-indigo-500 bg-slate-50 text-slate-700 min-h-[80px]"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((att, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 flex-shrink-0">
                                        {att.name}
                                        <button onClick={() => handleRemoveAttachment(att.url)} className="text-slate-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Add attachment'}</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                </label>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100">Cancel</button>
                                    <button onClick={handleSave} disabled={isSaving || isUploading} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
