import { ProductIntegration, Setting } from './types';

/**
 * Safely parse integration_products JSON string.
 * Replaces 15+ duplicated try/catch JSON.parse blocks across the codebase.
 */
export function parseProducts(raw: string | null | undefined): ProductIntegration[] {
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Parse settings array into a structured object.
 * Replaces duplicated settings parsing in 6+ pages.
 */
export function parseSetting(settings: Setting[], key: string, fallback: string): string[] {
    const value = settings.find(s => s.key === key)?.value || fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
}

export function getSettingValue(settings: Setting[], key: string, fallback: string): string {
    return settings.find(s => s.key === key)?.value || fallback;
}
