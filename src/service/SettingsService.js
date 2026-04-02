import { reactive } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { applyPrimaryColor } from '@/service/ThemeService';

const DB_NAME = 'spc-settings';
const STORE = 'config';
const DB_VERSION = 1;

const DEFAULT_SETTINGS = () => ({
    theme: 'indigo',
    language: 'en',
    darkTheme: false,
    rememberLanguage: false,
    rememberDarkMode: false,
    rememberTheme: false,
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
    applyPrimaryColor(primary);
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

    if (merged.rememberLanguage && merged.language && localeRef) {
        localeRef.value = merged.language;
        localStorage.setItem('locale', merged.language);
    }
    if (merged.rememberTheme) {
        applyTheme(merged.theme || 'indigo');
    }
    if (merged.rememberDarkMode) {
        applyDarkMode(!!merged.darkTheme);
    }
}

export async function autoSavePreference(key, value) {
    try {
        const stored = await loadSettings();
        if (!stored) return;
        stored[key] = value;
        await saveSettings(stored);
    } catch (e) {
        console.warn('[SettingsService] autoSavePreference failed', e);
    }
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

export async function loadFavorites() {
    const db = await openDb(true);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.get('favorites');
        req.onsuccess = () => resolve(req.result ? req.result.value : []);
        req.onerror = () => reject(req.error);
    });
}

export async function saveFavorites(ids) {
    const db = await ensureDbAndDefaults();
    const plain = toPlainSettings(ids);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.put({ key: 'favorites', value: plain });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
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
