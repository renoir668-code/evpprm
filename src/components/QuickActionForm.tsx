'use client';

import { useState, useRef } from 'react';
import { createInteraction, uploadAttachment } from '@/lib/actions';
import { Send, Paperclip, Loader2, X } from 'lucide-react';

export default function QuickActionForm({ partnerId, dict }: { partnerId: string, dict: any }) {
    const [notes, setNotes] = useState('');
    const [type, setType] = useState<'call' | 'email' | 'meeting'>('email');
    const [attachments, setAttachments] = useState<{ name: string, url: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!notes.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await createInteraction(partnerId, {
                date: new Date().toISOString(),
                notes,
                type,
                attachments: JSON.stringify(attachments)
            });
            setNotes('');
            setAttachments([]);
        } catch (e) {
            console.error('Failed to log interaction', e);
        } finally {
            setIsSubmitting(false);
        }
    }

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
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (url: string) => {
        setAttachments(prev => prev.filter(a => a.url !== url));
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm p-4 relative z-20">
            <div className="flex flex-col gap-3">
                <textarea
                    placeholder={dict.partnerDetail.interactionPlaceholder}
                    title={dict.partnerDetail.interactionLog}
                    className="w-full resize-none outline-none text-slate-700 bg-transparent placeholder:text-slate-400 min-h-[60px]"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                        {(['email', 'call', 'meeting'] as const).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${type === t ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {t === 'email' ? dict.common.email : t === 'call' ? dict.common.call : t === 'meeting' ? dict.common.meeting : t}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-slate-200 mx-2" />

                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors" title={dict.partnerDetail.attachFile}>
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{dict.partnerDetail.attach}</span>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                disabled={isUploading || isSubmitting}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={!notes.trim() || isSubmitting || isUploading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors text-xs"
                    >
                        <Send className="w-3.5 h-3.5" />
                        {dict.partnerDetail.logAction}
                    </button>
                </div>
            </div>
            {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-slate-50">
                    {attachments.map((att, i) => (
                        <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-600">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            <span className="max-w-[150px] truncate">{att.name}</span>
                            <button
                                type="button"
                                onClick={() => removeAttachment(att.url)}
                                className="ml-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 p-0.5"
                                title={dict.common.delete}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </form>
    );
}
