import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'secret-key-for-local-prm';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Record<string, unknown>) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10h')
        .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    });
    return payload;
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch {
        return null;
    }
}
