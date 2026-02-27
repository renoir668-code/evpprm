'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import { createUser, deleteUser, updateUser } from '@/lib/actions';
import { Shield, Trash2, UserPlus, Loader2, Key, Edit2, Check, X, UserCog } from 'lucide-react';

export default function UserManagement({ initialUsers }: { initialUsers: User[] }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('User');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) return;
        setIsSubmitting(true);
        try {
            await createUser({ name, email, role, password });
            setName('');
            setEmail('');
            setPassword('');
            setRole('User');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(id);
        }
    };

    const startEditing = (user: User) => {
        setEditingUserId(user.id);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditRole(user.role);
    };

    const handleUpdate = async (id: string) => {
        if (!editName || !editEmail) return;
        setIsSubmitting(true);
        try {
            await updateUser(id, { name: editName, email: editEmail, role: editRole as any });
            setEditingUserId(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/50 mt-8 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
                        <UserCog className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-slate-900">User Management</h2>
                        <p className="text-xs text-slate-500 font-medium">Manage team members and permissions</p>
                    </div>
                </div>
            </div>

            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-extrabold text-slate-700 mb-5 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    Add New Team Member
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                        <input required type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Username / Email</label>
                        <input required type="text" placeholder="john.doe" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold bg-white cursor-pointer shadow-sm">
                            <option value="Admin">Admin</option>
                            <option value="User">User</option>
                            <option value="Sales">Sales</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                        <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all shadow-sm" />
                    </div>
                    <div className="md:col-span-4 flex justify-end mt-2">
                        <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Create User
                        </button>
                    </div>
                </form>
            </div>

            <div className="divide-y divide-slate-100">
                {initialUsers.map(u => (
                    <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 group">
                        {editingUserId === u.id ? (
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mr-4 animate-in fade-in slide-in-from-left-4">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                />
                                <input
                                    type="text"
                                    value={editEmail}
                                    onChange={e => setEditEmail(e.target.value)}
                                    className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm text-slate-600 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                />
                                <select
                                    value={editRole}
                                    onChange={e => setEditRole(e.target.value)}
                                    className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="User">User</option>
                                    <option value="Sales">Sales</option>
                                </select>
                            </div>
                        ) : (
                            <div>
                                <div className="font-extrabold text-slate-900 flex items-center gap-3">
                                    {u.name}
                                    <span className={cn(
                                        "text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border shadow-sm",
                                        u.role === 'Admin' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            u.role === 'Sales' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-slate-50 text-slate-600 border-slate-100"
                                    )}>
                                        {u.role}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1 px-1">
                                    {u.email}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {editingUserId === u.id ? (
                                <>
                                    <button
                                        onClick={() => handleUpdate(u.id)}
                                        disabled={isSubmitting}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-emerald-100"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setEditingUserId(null)}
                                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => startEditing(u)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function cn(...args: any[]) {
    return args.filter(Boolean).join(' ');
}

