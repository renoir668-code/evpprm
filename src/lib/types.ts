export type IntegrationStatus = 'No' | 'In pipeline' | 'In development' | 'Finished' | 'Not interested' | 'Cancelled' | 'On hold';

export interface ProductIntegration {
    product: string;
    status: IntegrationStatus;
}

export interface Partner {
    id: string;
    name: string;
    health_status: 'Active' | 'At Risk' | 'Dormant';
    integration_status: IntegrationStatus; // Legacy, kept for backwards compatibility in forms? Or we can remove if refactored fully.
    integration_products: string | null; // JSON string of ProductIntegration[]
    key_person_id: string | null;
    needs_attention_days: number;
    created_at: string;
    owner_id: string | null;
    vertical?: string | null;
    use_case?: string | null;
    last_interaction_date?: string | null;
    logo_url?: string | null;
    dismissed_at?: string | null;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    password_hash?: string;
    created_at?: string;
    linked_key_person?: string | null;
}

export interface Workgroup {
    id: string;
    name: string;
    member_ids: string[]; // User IDs
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Contact {
    id: string;
    partner_id: string;
    name: string;
    email: string | null;
    role: string | null;
}

export interface Interaction {
    id: string;
    partner_id: string;
    date: string;
    notes: string | null;
    type: 'call' | 'email' | 'meeting';
    attachments?: string | null; // JSON string array of { name: string, url: string }
}

export interface Setting {
    key: string;
    value: string;
}

export interface CustomReminder {
    id: string;
    partner_id: string;
    title: string;
    due_date: string;
    completed: number;
    created_at?: string;
    completed_at?: string | null;
}
export type Dictionary = any; // Placeholder for i18n dictionary
