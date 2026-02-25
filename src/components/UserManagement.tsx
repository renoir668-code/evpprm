'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import { createUser, deleteUser } from '@/lib/actions';
import { Shield, Trash2, UserPlus, Loader2, Key } from 'lucide-react';

export default function UserManagement({ initialUsers }: { initialUsers: User[] }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('User');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h2 className="font-semibold text-slate-900">User Management</h2>
            </div>

            <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Add New User</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input required type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                    </div>
                    <div>
                        <input required type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                    </div>
                    <div>
                        <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-white">
                            <option value="Admin">Admin</option>
                            <option value="User">User</option>
                            <option value="Sales">Sales</option>
                        </select>
                    </div>
                    <div>
                        <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Create User
                        </button>
                    </div>
                </form>
            </div>

            <div className="divide-y divide-slate-100">
                {initialUsers.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                {u.name}
                                {u.role === 'Admin' && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                                {u.email}
                            </div>
                        </div>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
