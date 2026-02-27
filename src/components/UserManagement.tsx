'use client';

import { useState, useMemo } from 'react';
import { User, Workgroup } from '@/lib/types';
import { createUser, deleteUser, updateUser, createWorkgroup, deleteWorkgroup, setWorkgroupMembers } from '@/lib/actions';
import { Shield, Trash2, UserPlus, Loader2, Key, Edit2, Check, X, UserCog, Link as LinkIcon, Users as UsersIcon, Plus } from 'lucide-react';

export default function UserManagement({
    initialUsers,
    keyPeople,
    initialWorkgroups,
    dict
}: {
    initialUsers: User[],
    keyPeople: string[],
    initialWorkgroups: Workgroup[],
    dict: any
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('User');
    const [password, setPassword] = useState('');
    const [linkedKP, setLinkedKP] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // User Edit State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editLinkedKP, setEditLinkedKP] = useState('');

    // Workgroup State
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) return;
        setIsSubmitting(true);
        try {
            await createUser({ name, email, role, password, linked_key_person: linkedKP || null });
            setName('');
            setEmail('');
            setPassword('');
            setRole('User');
            setLinkedKP('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(dict.settings.deleteUserConfirm)) {
            await deleteUser(id);
        }
    };

    const startEditing = (user: User) => {
        setEditingUserId(user.id);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditRole(user.role);
        setEditLinkedKP(user.linked_key_person || '');
    };

    const handleUpdate = async (id: string) => {
        if (!editName || !editEmail) return;
        setIsSubmitting(true);
        try {
            await updateUser(id, { name: editName, email: editEmail, role: editRole as any, linked_key_person: editLinkedKP || null });
            setEditingUserId(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Workgroup Handlers
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName) return;
        setIsSubmitting(true);
        try {
            await createWorkgroup(newGroupName);
            setNewGroupName('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleMember = async (groupId: string, userId: string, isMember: boolean) => {
        const group = initialWorkgroups.find(g => g.id === groupId);
        if (!group) return;

        let newMembers = isMember
            ? group.member_ids.filter(id => id !== userId)
            : [...group.member_ids, userId];

        await setWorkgroupMembers(groupId, newMembers);
    };

    return (
        <div className="space-y-8">
            {/* User Component */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
                            <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-900">{dict.settings.userManagement}</h2>
                            <p className="text-xs text-slate-500 font-medium">{dict.settings.manageTeam}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-extrabold text-slate-700 mb-5 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-indigo-500" />
                        {dict.settings.addNewMember}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label htmlFor="full-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{dict.settings.fullName}</label>
                            <input id="full-name" required type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm" title={dict.settings.fullName} />
                        </div>
                        <div>
                            <label htmlFor="username-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{dict.settings.usernameEmail}</label>
                            <input id="username-email" required type="text" placeholder="john.doe" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm" title={dict.settings.usernameEmail} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{dict.settings.linkKeyPerson}</label>
                            <select
                                value={linkedKP}
                                onChange={e => setLinkedKP(e.target.value)}
                                title={dict.settings.linkKeyPerson}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold bg-white cursor-pointer shadow-sm"
                            >
                                <option value="">{dict.common.none}</option>
                                {keyPeople.map(kp => (
                                    <option key={kp} value={kp}>{kp}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{dict.settings.role}</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                title={dict.settings.role}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold bg-white cursor-pointer shadow-sm"
                            >
                                <option value="Admin">Admin</option>
                                <option value="User">User</option>
                                <option value="Sales">Sales</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{dict.settings.password}</label>
                            <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all shadow-sm" title={dict.settings.password} />
                        </div>
                        <div className="md:col-span-5 flex justify-end mt-2">
                            <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                {dict.settings.createUser}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="divide-y divide-slate-100">
                    {initialUsers.map(u => (
                        <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 group">
                            {editingUserId === u.id ? (
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 mr-4 animate-in fade-in slide-in-from-left-4">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="Full Name"
                                        title="Edit Full Name"
                                        className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                        placeholder="Username / Email"
                                        title="Edit Username / Email"
                                        className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm text-slate-600 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                    />
                                    <select
                                        value={editLinkedKP}
                                        onChange={e => setEditLinkedKP(e.target.value)}
                                        title={dict.settings.linkKeyPerson}
                                        className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white font-medium"
                                    >
                                        <option value="">{dict.common.none}</option>
                                        {keyPeople.map(kp => (
                                            <option key={kp} value={kp}>{kp}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={editRole}
                                        onChange={e => setEditRole(e.target.value)}
                                        title={dict.settings.role}
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
                                        {u.linked_key_person && (
                                            <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                                <LinkIcon className="w-2.5 h-2.5" />
                                                {u.linked_key_person}
                                            </span>
                                        )}
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
                                            title="Save changes"
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-emerald-100"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => setEditingUserId(null)}
                                            title="Cancel editing"
                                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => startEditing(u)}
                                            title="Edit user"
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            title="Delete user"
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

            {/* Workgroup Component */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm">
                            <UsersIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-900">{dict.settings.workgroups}</h2>
                            <p className="text-xs text-slate-500 font-medium">{dict.settings.workgroupsManage}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-b border-slate-100 bg-emerald-50/20">
                    <form onSubmit={handleCreateGroup} className="flex gap-4">
                        <div className="flex-1">
                            <input required type="text" placeholder={dict.settings.groupNamePlaceholder} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all shadow-sm" title={dict.settings.workgroups} />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                            <Plus className="w-4 h-4" />
                            {dict.settings.createGroup}
                        </button>
                    </form>
                </div>

                <div className="divide-y divide-slate-100">
                    {initialWorkgroups.map(group => (
                        <div key={group.id} className="p-6 space-y-4 hover:bg-slate-50 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">
                                        {group.name}
                                    </div>
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">
                                        GROUP ID: {group.id.slice(0, 8)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => confirm(dict.settings.deleteGroupConfirm) && deleteWorkgroup(group.id)}
                                    title="Delete workgroup"
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {initialUsers.map(user => {
                                    const isMember = group.member_ids.includes(user.id);
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => handleToggleMember(group.id, user.id, isMember)}
                                            className={cn(
                                                "px-3 py-2 rounded-xl border text-[10px] font-bold text-left transition-all flex items-center gap-2 truncate",
                                                isMember
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                                                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                isMember ? "bg-white" : "bg-slate-200"
                                            )} />
                                            {user.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {initialWorkgroups.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-medium italic">
                            {dict.settings.noWorkgroups}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function cn(...args: any[]) {
    return args.filter(Boolean).join(' ');
}
