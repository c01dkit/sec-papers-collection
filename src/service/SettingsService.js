import { reactive } from 'vue';
import { useLayout } from '@/layout/composables/layout';

const DB_NAME = 'spc-settings';
const STORE = 'config';
const DB_VERSION = 1;

const PRIMARY_PRESETS = {
    indigo: {
        '--primary-color': '#6366f1',
        '--primary-200': '#c7d2fe',
        '--primary-400': '#818cf8',
        '--primary-500': '#6366f1',
        '--primary-600': '#4f46e5',
        '--primary-700': '#4338ca'
    },
    blue: {
        '--primary-color': '#3b82f6',
        '--primary-200': '#bfdbfe',
        '--primary-400': '#60a5fa',
        '--primary-500': '#3b82f6',
        '--primary-600': '#2563eb',
        '--primary-700': '#1d4ed8'
    },
    emerald: {
        '--primary-color': '#10b981',
        '--primary-200': '#a7f3d0',
        '--primary-400': '#34d399',
        '--primary-500': '#10b981',
        '--primary-600': '#059669',
        '--primary-700': '#047857'
    },
    amber: {
        '--primary-color': '#f59e0b',
        '--primary-200': '#fde68a',
        '--primary-400': '#fbbf24',
        '--primary-500': '#f59e0b',
        '--primary-600': '#d97706',
        '--primary-700': '#b45309'
    },
    violet: {
        '--primary-color': '#8b5cf6',
        '--primary-200': '#ddd6fe',
        '--primary-400': '#a78bfa',
        '--primary-500': '#8b5cf6',
        '--primary-600': '#7c3aed',
        '--primary-700': '#6d28d9'
    }
};

const DEFAULT_SETTINGS = () => ({
    theme: 'indigo',
    language: 'en',
    darkTheme: false,
    showStatusDots: false,
    llmEndpoint: '',
    llmApiKey: '',
    keywords: []
});

const runtimeSettings = reactive(DEFAULT_SETTINGS());

let cachedDbPromise = null;

function toPlainSettings(val) {
    const raw = val ?? {};
    // Remove Vue proxies / Refs and ensure structured-cloneable payload
    try {
        return structuredClone(raw);
    } catch (e) {
        return JSON.parse(JSON.stringify(raw));
    }
}

export function getPrimaryPresets() {
    return PRIMARY_PRESETS;
}

export function defaultSettings() {
    return DEFAULT_SETTINGS();
}

export function getRuntimeSettings() {
    return runtimeSettings;
}

export function isIndexedDBSupported() {
    return typeof indexedDB !== 'undefined';
}

export async function checkDbExists() {
    if (!isIndexedDBSupported()) return false;

    if (indexedDB.databases) {
        try {
            const dbs = await indexedDB.databases();
            return dbs.some((db) => db.name === DB_NAME);
        } catch (err) {
            console.warn('[SettingsService] indexedDB.databases() failed', err);
        }
    }

    return new Promise((resolve) => {
        let created = false;
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            created = true;
            request.transaction.abort();
        };

        request.onsuccess = () => {
            request.result.close();
            resolve(!created);
        };

        request.onerror = () => resolve(false);
        request.onblocked = () => resolve(false);
    });
}

export async function ensureDbAndDefaults() {
    const db = await openDb(true);
    await ensureDefaults(db);
    return db;
}

export async function loadSettings() {
    const db = await openDb(true);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const request = store.get('app');

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function saveSettings(value) {
    const db = await ensureDbAndDefaults();
    const plain = toPlainSettings(value);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const request = store.put({ key: 'app', value: plain });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export function applyTheme(primary) {
    const palette = PRIMARY_PRESETS[primary] || PRIMARY_PRESETS.indigo;
    Object.entries(palette).forEach(([name, value]) => {
        document.documentElement.style.setProperty(name, value);
    });
    const { layoutConfig } = useLayout();
    layoutConfig.primary = primary;
}

export function applyDarkMode(enabled) {
    const { layoutConfig } = useLayout();
    layoutConfig.darkTheme = !!enabled;
    document.documentElement.classList.toggle('app-dark', !!enabled);
}

export function applySettingsToRuntime(settings, localeRef) {
    if (!settings) return;

    const merged = { ...DEFAULT_SETTINGS(), ...settings };
    Object.assign(runtimeSettings, merged);

    if (merged.language && localeRef) {
        localeRef.value = merged.language;
        localStorage.setItem('locale', merged.language);
    }
    applyTheme(merged.theme || 'indigo');
    applyDarkMode(!!merged.darkTheme);
}

function openDb(createIfMissing) {
    if (!isIndexedDBSupported()) {
        return Promise.reject(new Error('IndexedDB is not supported in this browser'));
    }

    if (cachedDbPromise) return cachedDbPromise;

    cachedDbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            if (!createIfMissing) {
                request.transaction.abort();
                return reject(new Error('IndexedDB not initialized'));
            }
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('IndexedDB open blocked'));
    });

    return cachedDbPromise;
}

async function ensureDefaults(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const getReq = store.get('app');

        getReq.onsuccess = () => {
            if (getReq.result) {
                resolve();
                return;
            }
            const defaults = toPlainSettings(DEFAULT_SETTINGS());
            const putReq = store.put({ key: 'app', value: defaults });
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
    });
}
