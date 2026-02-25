'use server';

import { query } from '@/lib/db';
import * as bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = res.rows[0];

    if (!user) {
        return { error: 'Invalid credentials' };
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        return { error: 'Invalid credentials' };
    }

    const sessionData = { userId: user.id, email: user.email, name: user.name, role: user.role };
    const session = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    redirect('/');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    redirect('/login');
}
