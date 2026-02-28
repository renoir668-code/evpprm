'use server';

import { query, getClient } from './db';
import { Partner, Contact, Interaction, Tag, Setting, CustomReminder, User, Workgroup } from './types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcrypt';
import { getSession } from './auth';
import * as fs from 'fs';
import * as path from 'path';
import { put } from '@vercel/blob';

// --- AUDIT LOGS ---
export async function logAudit({ partner_id, user_id, action, details }: { partner_id?: string | null, user_id?: string | null, action: string, details?: string | null }) {
    const id = randomUUID();
    let finalUserId = user_id;
    if (!finalUserId) {
        const session = await getSession();
        finalUserId = (session as any)?.id || null;
    }
    await query('INSERT INTO audit_logs (id, partner_id, user_id, action, details) VALUES ($1, $2, $3, $4, $5)', [id, partner_id || null, finalUserId || null, action, details || null]);
}

// --- GLOBAL SEARCH ---
export async function searchAll(queryStr: string) {
    if (!queryStr || queryStr.trim().length === 0) return [];

    // Using ILIKE for postgres, LIKE for sqlite. For simplicity across both, using params is safer. 
    // We already use parameterized queries everywhere.
    // In Better-SQLite3 case-insensitive LIKE is by default. In Postgres ILIKE is needed, but assuming a simple LIKE or lower() works.
    const lowerQ = `%${queryStr.toLowerCase()}%`;

    const partners = await query('SELECT id, name FROM partners WHERE lower(name) LIKE $1 LIMIT 5', [lowerQ]);
    const contacts = await query('SELECT id, partner_id, name, email FROM contacts WHERE lower(name) LIKE $1 OR lower(email) LIKE $2 LIMIT 5', [lowerQ, lowerQ]);
    const interactions = await query(`
        SELECT i.id, i.partner_id, i.type, i.notes, p.name as p_name 
        FROM interactions i 
        JOIN partners p ON p.id = i.partner_id 
        WHERE lower(i.notes) LIKE $1 LIMIT 5
    `, [lowerQ]);

    const results = [];

    for (const p of (partners.rows as any[])) {
        results.push({ type: 'Partner', id: p.id, url: `/partners/${p.id}`, title: p.name, subtitle: 'Partner Directory' });
    }
    for (const c of (contacts.rows as any[])) {
        results.push({ type: 'Contact', id: c.id, url: `/partners/${c.partner_id}`, title: c.name, subtitle: c.email ? `Email: ${c.email}` : 'Contact' });
    }
    for (const i of (interactions.rows as any[])) {
        results.push({ type: 'Interaction', id: i.id, url: `/partners/${i.partner_id}`, title: `${i.type} interaction with ${i.p_name}`, subtitle: i.notes?.slice(0, 50) + '...' });
    }

    return results;
}

// --- PARTNERS ---

export async function getPartners(): Promise<Partner[]> {
    const res = await query(`
        SELECT p.*, MAX(i.date) as last_interaction_date 
        FROM partners p 
        LEFT JOIN interactions i ON p.id = i.partner_id 
        GROUP BY p.id 
        ORDER BY p.created_at DESC
    `);
    const formatted = res.rows.map((row: any) => ({
        ...row,
        created_at: new Date(row.created_at).toISOString(),
        last_interaction_date: row.last_interaction_date ? new Date(row.last_interaction_date).toISOString() : null,
        dismissed_at: row.dismissed_at ? new Date(row.dismissed_at).toISOString() : null
    }));
    return formatted as Partner[];
}

export async function getPartner(id: string): Promise<Partner | undefined> {
    const res = await query('SELECT * FROM partners WHERE id = $1', [id]);
    if (!res.rows[0]) return undefined;
    const row: any = res.rows[0];
    return { ...row, created_at: new Date(row.created_at).toISOString() } as Partner;
}

export async function createPartner(data: Omit<Partner, 'id' | 'created_at'>) {
    const id = randomUUID();
    await query(`
        INSERT INTO partners (id, name, health_status, integration_status, integration_products, key_person_id, needs_attention_days, owner_id, vertical, use_case, logo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [id, data.name, data.health_status, data.integration_status, data.integration_products, data.key_person_id, data.needs_attention_days, data.owner_id || null, data.vertical || null, data.use_case || null, data.logo_url || null]);

    revalidatePath('/');
    revalidatePath('/directory');
    return id;
}

export async function updatePartnerProducts(id: string, integration_products: string) {
    await query('UPDATE partners SET integration_products = $1 WHERE id = $2', [integration_products, id]);
    revalidatePath('/pipeline');
    revalidatePath(`/partners/${id}`);
    revalidatePath('/directory');
    revalidatePath('/analytics');
}

export async function deletePartner(id: string) {
    console.log("Starting deletion of partner:", id);
    try {
        await query('DELETE FROM interactions WHERE partner_id = $1', [id]);
        await query('DELETE FROM contacts WHERE partner_id = $1', [id]);
        await query('DELETE FROM custom_reminders WHERE partner_id = $1', [id]);
        await query('DELETE FROM partner_tags WHERE partner_id = $1', [id]);
        await query('DELETE FROM partners WHERE id = $1', [id]);
        console.log("Successfully deleted partner:", id);
    } catch (err: any) {
        console.error("Error in deletePartner:", err);
        throw new Error("Database error occurred while deleting partner.");
    }
    revalidatePath('/');
    revalidatePath('/directory');
    revalidatePath('/analytics');
    revalidatePath('/pipeline');
}

export async function bulkDeletePartners(ids: string[]) {
    if (!ids || ids.length === 0) return;

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Postgres IN clause can take an array $1 for some drivers, but for standard pg we often use UNNEST or similar
        // Since we are using a wrapper, let's keep it simple with a string building approach OR multiple queries if the list isn't huge.
        // Actually, let's just use the existing deletePartner in a loop but inside ONE transaction for safety and atomicity.

        for (const id of ids) {
            await client.query('DELETE FROM interactions WHERE partner_id = $1', [id]);
            await client.query('DELETE FROM contacts WHERE partner_id = $1', [id]);
            await client.query('DELETE FROM custom_reminders WHERE partner_id = $1', [id]);
            await client.query('DELETE FROM partner_tags WHERE partner_id = $1', [id]);
            await client.query('DELETE FROM partners WHERE id = $1', [id]);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    revalidatePath('/');
    revalidatePath('/directory');
    revalidatePath('/analytics');
    revalidatePath('/pipeline');
}

export async function updatePartner(id: string, data: Partial<Partner>) {
    const current = await getPartner(id);
    if (!current) throw new Error('Partner not found');

    const merged = { ...current, ...data };
    await query(`
        UPDATE partners 
        SET name = $1, health_status = $2, integration_status = $3, integration_products = $4, key_person_id = $5, needs_attention_days = $6, owner_id = $7, vertical = $8, use_case = $9, logo_url = $10
        WHERE id = $11
    `, [merged.name, merged.health_status, merged.integration_status, merged.integration_products, merged.key_person_id, merged.needs_attention_days, merged.owner_id || null, merged.vertical || null, merged.use_case || null, merged.logo_url || null, id]);

    if (current.health_status !== merged.health_status) {
        await logAudit({ partner_id: id, action: 'Updated Health Status', details: `Changed from ${current.health_status} to ${merged.health_status}` });
    }

    revalidatePath('/');
    revalidatePath('/directory');
    revalidatePath(`/partners/${id}`);
}

export async function dismissPartnerReminder(id: string) {
    await query('UPDATE partners SET dismissed_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    revalidatePath('/');
    revalidatePath('/reminders');
    revalidatePath(`/partners/${id}`);
}

export async function importPartners(data: any[]) {
    const currentPartners = await getPartners();

    for (const row of data) {
        if (!row['name']) continue;
        const name = String(row['name']).trim();
        const existing = currentPartners.find(p => p.name.toLowerCase() === name.toLowerCase());

        const health = row['health_status'] ? String(row['health_status']).trim() : 'Active';
        const attention = Number(row['needs_attention_days']) || 30;
        const vertical = row['vertical'] ? String(row['vertical']).trim() : null;
        const key_person_id = row['key_person_id'] ? String(row['key_person_id']).trim() : null;
        const owner_id = row['owner_id'] ? String(row['owner_id']).trim() : null;
        const use_case = row['use_case'] ? String(row['use_case']).trim() : null;
        const int_status = row['integration_status'] ? String(row['integration_status']).trim() : 'No';
        const int_products = row['integration_products'] ? String(row['integration_products']).trim() : '[]';
        const logo_url = row['logo_url'] ? String(row['logo_url']).trim() : null;

        if (existing) {
            await query(`
                UPDATE partners 
                SET health_status = $1, needs_attention_days = $2, vertical = $3, key_person_id = $4, owner_id = $5, use_case = $6, integration_status = $7, integration_products = $8, logo_url = $9
                WHERE id = $10
            `, [health, attention, vertical, key_person_id, owner_id, use_case, int_status, int_products, logo_url || existing.logo_url, existing.id]);
        } else {
            const id = randomUUID();
            await query(`
                INSERT INTO partners (id, name, health_status, needs_attention_days, vertical, key_person_id, owner_id, use_case, integration_status, integration_products, logo_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [id, name, health, attention, vertical, key_person_id, owner_id, use_case, int_status, int_products, logo_url]);
        }
    }
    revalidatePath('/');
    revalidatePath('/directory');
    revalidatePath('/analytics');
}

// --- CONTACTS ---

export async function getContacts(partnerId: string): Promise<Contact[]> {
    const res = await query('SELECT * FROM contacts WHERE partner_id = $1', [partnerId]);
    return res.rows as Contact[];
}

export async function createContact(partnerId: string, data: Omit<Contact, 'id' | 'partner_id'>) {
    const id = randomUUID();
    await query('INSERT INTO contacts (id, partner_id, name, email, role) VALUES ($1, $2, $3, $4, $5)', [id, partnerId, data.name, data.email, data.role]);
    revalidatePath(`/partners/${partnerId}`);
}

export async function updateContact(id: string, data: Partial<Contact>) {
    const check = await query('SELECT * FROM contacts WHERE id = $1', [id]);
    const current = check.rows[0] as Contact;
    if (!current) throw new Error('Contact not found');

    const merged = { ...current, ...data };
    await query('UPDATE contacts SET name = $1, email = $2, role = $3 WHERE id = $4', [merged.name, merged.email, merged.role, id]);
    revalidatePath(`/partners/${current.partner_id}`);
}

export async function deleteContact(id: string) {
    const check = await query('SELECT partner_id FROM contacts WHERE id = $1', [id]);
    if (check.rows.length === 0) return;
    await query('DELETE FROM contacts WHERE id = $1', [id]);
    revalidatePath(`/partners/${check.rows[0].partner_id}`);
}

// --- INTERACTIONS ---

export async function getInteractions(partnerId: string): Promise<Interaction[]> {
    const res = await query(`
        SELECT i.*, u.name as created_by_name 
        FROM interactions i 
        LEFT JOIN users u ON i.created_by = u.id 
        WHERE i.partner_id = $1 
        ORDER BY i.date DESC
    `, [partnerId]);
    return res.rows.map((row: any) => ({ ...row, date: new Date(row.date).toISOString() })) as Interaction[];
}

export async function getRecentInteractions(limit: number = 5): Promise<(Interaction & { partner_name: string, partner_logo: string | null })[]> {
    const res = await query(`
        SELECT i.*, p.name as partner_name, p.logo_url as partner_logo 
        FROM interactions i 
        JOIN partners p ON i.partner_id = p.id 
        ORDER BY i.date DESC 
        LIMIT $1
    `, [limit]);
    return res.rows.map((row: any) => ({ ...row, date: new Date(row.date).toISOString() })) as (Interaction & { partner_name: string, partner_logo: string | null })[];
}

export async function getAllInteractions(): Promise<Interaction[]> {
    const res = await query('SELECT * FROM interactions ORDER BY date DESC');
    return res.rows.map((row: any) => ({ ...row, date: new Date(row.date).toISOString() })) as Interaction[];
}

export async function createInteraction(partnerId: string, data: Omit<Interaction, 'id' | 'partner_id' | 'created_by' | 'created_by_name'>) {
    const session = await getSession();
    const createdBy = session?.id || null;
    const id = randomUUID();
    await query('INSERT INTO interactions (id, partner_id, date, notes, type, attachments, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, partnerId, data.date, data.notes, data.type, data.attachments || '[]', createdBy]);

    await logAudit({ partner_id: partnerId, action: 'Logged Interaction', details: `Added a new ${data.type} log` });

    revalidatePath(`/partners/${partnerId}`);
    revalidatePath('/');
}

export async function updateInteraction(id: string, data: Partial<Interaction>) {
    const check = await query('SELECT * FROM interactions WHERE id = $1', [id]);
    const current = check.rows[0] as Interaction;
    if (!current) throw new Error('Interaction not found');

    const merged = { ...current, ...data };
    await query('UPDATE interactions SET date = $1, notes = $2, attachments = $3 WHERE id = $4', [merged.date, merged.notes, merged.attachments || '[]', id]);
    revalidatePath(`/partners/${current.partner_id}`);
}

export async function deleteInteraction(id: string) {
    const check = await query('SELECT partner_id FROM interactions WHERE id = $1', [id]);
    if (check.rows.length === 0) return;
    await query('DELETE FROM interactions WHERE id = $1', [id]);
    revalidatePath(`/partners/${check.rows[0].partner_id}`);
}

export async function uploadAttachment(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // If Vercel Blob is configured (via BLOB_READ_WRITE_TOKEN), use it
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const uniqueId = randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${uniqueId}-${safeName}`;

        const blob = await put(filename, file, { access: 'public' });
        return blob.url;
    }

    // Fallback exactly to local storage if running entirely locally without a token
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueId = randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueId}-${safeName}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);
    return `/api/uploads/${filename}`;
}

// --- REMINDERS ---

export async function getCustomReminders(partnerId?: string): Promise<CustomReminder[]> {
    if (partnerId) {
        const res = await query('SELECT * FROM custom_reminders WHERE partner_id = $1 AND completed = 0 ORDER BY due_date ASC', [partnerId]);
        return res.rows.map((row: any) => ({ ...row, due_date: new Date(row.due_date).toISOString(), created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined })) as CustomReminder[];
    }
    const res = await query('SELECT * FROM custom_reminders WHERE completed = 0 ORDER BY due_date ASC');
    return res.rows.map((row: any) => ({ ...row, due_date: new Date(row.due_date).toISOString(), created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined })) as CustomReminder[];
}

export async function getAllCustomReminders(partnerId: string): Promise<CustomReminder[]> {
    const res = await query('SELECT * FROM custom_reminders WHERE partner_id = $1 ORDER BY completed ASC, due_date ASC', [partnerId]);
    return res.rows.map((row: any) => ({ ...row, due_date: new Date(row.due_date).toISOString(), created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined, completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null })) as CustomReminder[];
}

export async function createCustomReminder(partnerId: string, data: Omit<CustomReminder, 'id' | 'partner_id' | 'completed'>) {
    const id = randomUUID();
    await query('INSERT INTO custom_reminders (id, partner_id, title, due_date) VALUES ($1, $2, $3, $4)', [id, partnerId, data.title, data.due_date]);
    revalidatePath(`/partners/${partnerId}`);
    revalidatePath('/reminders');
}

export async function completeCustomReminder(id: string) {
    await query('UPDATE custom_reminders SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    revalidatePath('/reminders');
}

// --- TAGS ---

export async function getTags(): Promise<Tag[]> {
    const res = await query('SELECT * FROM tags');
    return res.rows as Tag[];
}

export async function createTag(name: string, color: string) {
    const id = randomUUID();
    await query('INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)', [id, name, color]);
    revalidatePath('/settings');
    revalidatePath('/directory');
    revalidatePath('/merchants');
}

export async function updateTag(id: string, name: string, color: string) {
    await query('UPDATE tags SET name = $1, color = $2 WHERE id = $3', [name, color, id]);
    revalidatePath('/settings');
    revalidatePath('/directory');
    revalidatePath('/merchants');
}

export async function deleteTag(id: string) {
    await query('DELETE FROM tags WHERE id = $1', [id]);
    revalidatePath('/settings');
    revalidatePath('/directory');
    revalidatePath('/merchants');
}

export async function getPartnerTags(partnerId: string): Promise<Tag[]> {
    const res = await query(`
        SELECT t.* FROM tags t
        JOIN partner_tags pt ON t.id = pt.tag_id
        WHERE pt.partner_id = $1
    `, [partnerId]);
    return res.rows as Tag[];
}

export async function getAllPartnerTagsBulk(): Promise<Record<string, Tag[]>> {
    const res = await query(`
        SELECT pt.partner_id, t.id, t.name, t.color FROM tags t
        JOIN partner_tags pt ON t.id = pt.tag_id
    `);
    const map: Record<string, Tag[]> = {};
    for (const row of res.rows as any[]) {
        if (!map[row.partner_id]) map[row.partner_id] = [];
        map[row.partner_id].push({ id: row.id, name: row.name, color: row.color });
    }
    return map;
}

export async function setPartnerTags(partnerId: string, tagIds: string[]) {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM partner_tags WHERE partner_id = $1', [partnerId]);
        for (const tagId of tagIds) {
            await client.query('INSERT INTO partner_tags (partner_id, tag_id) VALUES ($1, $2)', [partnerId, tagId]);
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    revalidatePath('/directory');
    revalidatePath(`/partners/${partnerId}`);
}

// --- SETTINGS ---

export async function getSettings(): Promise<Setting[]> {
    const res = await query('SELECT * FROM settings');
    return res.rows as Setting[];
}

export async function getSetting(key: string): Promise<string | null> {
    const res = await query('SELECT value FROM settings WHERE key = $1', [key]);
    return res.rows[0] ? res.rows[0].value : null;
}

export async function setSetting(key: string, value: string) {
    await query(`
        INSERT INTO settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [key, value]);
    revalidatePath('/');
    revalidatePath('/settings');
}

// --- USERS ---

export async function getUsers(): Promise<User[]> {
    const res = await query('SELECT id, name, email, role, created_at, linked_key_person FROM users');
    return res.rows.map((row: any) => ({ ...row, created_at: new Date(row.created_at).toISOString() })) as User[];
}

export async function getUser(id: string): Promise<User | undefined> {
    const res = await query('SELECT id, name, email, role, created_at, linked_key_person FROM users WHERE id = $1', [id]);
    if (!res.rows[0]) return undefined;
    const row: any = res.rows[0];
    return { ...row, created_at: new Date(row.created_at).toISOString() } as User;
}

export async function createUser(data: Omit<User, 'id' | 'created_at' | 'password_hash'> & { password?: string }) {
    const session = await getSession();
    if (session?.role !== 'Admin') throw new Error('Unauthorized: Admin role required');

    const id = randomUUID();
    let hash = '';
    if (data.password) {
        hash = await bcrypt.hash(data.password, 10);
    }
    await query('INSERT INTO users (id, name, email, role, password_hash, linked_key_person) VALUES ($1, $2, $3, $4, $5, $6)', [id, data.name, data.email, data.role, hash, data.linked_key_person || null]);
    revalidatePath('/settings');
}

export async function updateUser(id: string, data: Partial<User>) {
    const current = await getUser(id);
    if (!current) throw new Error('User not found');

    const name = data.name ?? current.name;
    const email = data.email ?? current.email;
    const role = data.role ?? current.role;
    const linked_key_person = data.hasOwnProperty('linked_key_person') ? data.linked_key_person : current.linked_key_person;

    await query('UPDATE users SET name = $1, email = $2, role = $3, linked_key_person = $4 WHERE id = $5', [name, email, role, linked_key_person || null, id]);
    revalidatePath('/settings');
}

export async function resetUserPassword(id: string, newPassword: string) {
    const session = await getSession();
    if (session?.role !== 'Admin') throw new Error('Unauthorized: Admin role required');

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
    revalidatePath('/settings');
}

export async function deleteUser(id: string) {
    const session = await getSession();
    if (session?.role !== 'Admin') throw new Error('Unauthorized: Admin role required');

    await query('DELETE FROM users WHERE id = $1', [id]);
    revalidatePath('/settings');
}

// --- WORKGROUPS ---

export async function getWorkgroups(): Promise<Workgroup[]> {
    const groupsRes = await query('SELECT * FROM workgroups');
    const workgroups: Workgroup[] = [];

    for (const row of groupsRes.rows) {
        const membersRes = await query('SELECT user_id FROM user_workgroups WHERE workgroup_id = $1', [row.id]);
        workgroups.push({
            id: row.id,
            name: row.name,
            member_ids: membersRes.rows.map((r: any) => r.user_id)
        });
    }
    return workgroups;
}

export async function createWorkgroup(name: string) {
    const id = randomUUID();
    await query('INSERT INTO workgroups (id, name) VALUES ($1, $2)', [id, name]);
    revalidatePath('/settings');
    return id;
}

export async function deleteWorkgroup(id: string) {
    await query('DELETE FROM workgroups WHERE id = $1', [id]);
    revalidatePath('/settings');
}

export async function setWorkgroupMembers(workgroupId: string, userIds: string[]) {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM user_workgroups WHERE workgroup_id = $1', [workgroupId]);
        for (const userId of userIds) {
            await client.query('INSERT INTO user_workgroups (user_id, workgroup_id) VALUES ($1, $2)', [userId, workgroupId]);
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    revalidatePath('/settings');
}

export async function getKeyPeople(): Promise<string[]> {
    try {
        const res = await query('SELECT value FROM settings WHERE key = $1', ['team']);
        const value = res.rows[0]?.value || 'Admin, Sales, Support';
        return value
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
    } catch (e) {
        console.error("Error in getKeyPeople:", e);
        return ['Admin', 'Sales', 'Support'];
    }
}

export async function getCurrentUserDetails() {
    const session = await getSession();
    if (!session || !session.userId) return null;

    const user = await getUser(session.userId as string);
    if (!user) return null;

    const workgroups = await getWorkgroups();
    const userGroups = workgroups.filter(g => g.member_ids.includes(user.id));

    return {
        ...user,
        workgroups: userGroups
    };
}
