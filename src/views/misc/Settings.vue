<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/ToggleSwitch';
import Divider from 'primevue/divider';
import Skeleton from 'primevue/skeleton';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

import {
    applySettingsToRuntime,
    defaultSettings,
    ensureDbAndDefaults,
    isIndexedDBSupported,
    loadSettings,
    saveSettings
} from '@/service/SettingsService';
import { useLayout } from '@/layout/composables/layout';

const { t, locale } = useI18n();
const toast = useToast();
const { layoutConfig } = useLayout();

const loading = ref(true);
const supportsIdb = ref(true);
const saving = ref(false);
const form = ref(defaultSettings());

const keywordInput = ref('');

onMounted(async () => {
    supportsIdb.value = isIndexedDBSupported();
    if (!supportsIdb.value) {
        loading.value = false;
        return;
    }

    try {
        await ensureDbAndDefaults();
        await loadFormFromDb();
    } catch (err) {
        console.warn('[Settings] init failed', err);
    } finally {
        loading.value = false;
    }
});

async function loadFormFromDb() {
    try {
        const stored = await loadSettings();
        form.value = { ...defaultSettings(), ...stored };
        applySettingsToRuntime(form.value, locale);
    } catch (err) {
        console.warn('[Settings] load failed', err);
        toast.add({ severity: 'warn', summary: t('settings.toast.loadFailed'), life: 3000 });
    }
}

async function handleSave() {
    saving.value = true;
    const payload = { ...defaultSettings(), ...form.value };
    // Capture current runtime values for remembered preferences
    if (payload.rememberLanguage) {
        payload.language = locale.value;
    }
    if (payload.rememberDarkMode) {
        payload.darkTheme = layoutConfig.darkTheme;
    }
    if (payload.rememberTheme) {
        payload.theme = layoutConfig.primary;
    }
    try {
        await saveSettings(payload);
        applySettingsToRuntime(payload, locale);
        toast.add({ severity: 'success', summary: t('settings.toast.saved'), life: 2500 });
    } catch (err) {
        console.error('[Settings] save failed', err);
        toast.add({ severity: 'error', summary: t('settings.toast.saveFailed'), life: 3000 });
    } finally {
        saving.value = false;
    }
}

function handleReset() {
    form.value = defaultSettings();
    keywordInput.value = '';
    applySettingsToRuntime(form.value, locale);
}

function addKeyword() {
    const val = keywordInput.value.trim();
    if (!val) return;
    const next = new Set(form.value.keywords || []);
    next.add(val);
    form.value = { ...form.value, keywords: Array.from(next) };
    keywordInput.value = '';
}

function removeKeyword(word) {
    const next = (form.value.keywords || []).filter((k) => k !== word);
    form.value = { ...form.value, keywords: next };
}
</script>

<template>
    <div class="page-shell">
       
        <div v-if="loading" class="card">
            <Skeleton width="10rem" class="mb-3" height="1.5rem" />
            <Skeleton width="100%" height="4rem" class="mb-2" />
            <Skeleton width="100%" height="4rem" />
        </div>

        <div v-else-if="!supportsIdb" class="card text-center py-10">
            <h2 class="text-xl font-semibold mb-2">{{ t('settings.unsupported.title') }}</h2>
            <p class="text-muted-color mb-3">{{ t('settings.unsupported.desc') }}</p>
        </div>

        <div v-else class="card">
            <div class="privacy-notice mb-4">
                <span>{{ t('settings.privacyNotice') }}</span>
            </div>
            <div class="flex flex-col gap-4">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <p class="text-sm font-medium mb-1">{{ t('settings.form.rememberLanguage.label') }}</p>
                        <p class="text-muted-color text-sm m-0">{{ t('settings.form.rememberLanguage.desc') }}</p>
                    </div>
                    <ToggleSwitch v-model="form.rememberLanguage" />
                </div>

                <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <p class="text-sm font-medium mb-1">{{ t('settings.form.rememberDarkMode.label') }}</p>
                        <p class="text-muted-color text-sm m-0">{{ t('settings.form.rememberDarkMode.desc') }}</p>
                    </div>
                    <ToggleSwitch v-model="form.rememberDarkMode" />
                </div>

                <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <p class="text-sm font-medium mb-1">{{ t('settings.form.rememberTheme.label') }}</p>
                        <p class="text-muted-color text-sm m-0">{{ t('settings.form.rememberTheme.desc') }}</p>
                    </div>
                    <ToggleSwitch v-model="form.rememberTheme" />
                </div>


                <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <p class="text-sm font-medium mb-1">{{ t('settings.form.showStatusDots.label') }}</p>
                        <p class="text-muted-color text-sm m-0">{{ t('settings.form.showStatusDots.desc') }}</p>
                    </div>
                    <ToggleSwitch v-model="form.showStatusDots" />
                </div>

                <!-- LLM settings hidden for now
                <Divider />

                <div class="flex flex-col gap-2">
                    <p class="text-sm font-medium mb-1">{{ t('settings.form.llmUrl.label') }}</p>
                    <p class="text-muted-color text-sm m-0">{{ t('settings.form.llmUrl.desc') }}</p>
                    <InputText v-model="form.llmEndpoint" class="w-full" :placeholder="t('settings.form.llmUrl.placeholder')" />
                </div>

                <div class="flex flex-col gap-2">
                    <p class="text-sm font-medium mb-1">{{ t('settings.form.llmKey.label') }}</p>
                    <p class="text-muted-color text-sm m-0">{{ t('settings.form.llmKey.desc') }}</p>
                    <InputText v-model="form.llmApiKey" class="w-full" type="password" :placeholder="t('settings.form.llmKey.placeholder')" />
                </div>
                -->

                <div class="flex flex-col gap-2">
                    <p class="text-sm font-medium mb-1">{{ t('settings.form.keywords.label') }}</p>
                    <p class="text-muted-color text-sm m-0">{{ t('settings.form.keywords.desc') }}</p>
                    <div class="flex gap-2 flex-wrap">
                        <InputText v-model="keywordInput" class="flex-1 min-w-[200px]" :placeholder="t('settings.form.keywords.placeholder')" @keyup.enter="addKeyword" />
                        <Button :label="t('settings.form.keywords.add')" size="small" @click="addKeyword" />
                    </div>
                    <div class="flex gap-2 flex-wrap mt-2">
                        <Tag
                            v-for="word in form.keywords || []"
                            :key="word"
                            :value="word"
                            class="cursor-pointer"
                            icon="pi pi-times"
                            @click="removeKeyword(word)"
                        />
                    </div>
                </div>
            </div>

            <Divider class="my-4" />

            <div class="flex gap-3 justify-end flex-wrap">
                <Button :label="t('settings.actions.reset')" class="p-button-text" @click="handleReset" />
                <Button :label="t('settings.actions.save')" :loading="saving" @click="handleSave" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-shell {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.privacy-notice {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 0;
    border-radius: 0.5rem;
    background: var(--surface-100);
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    line-height: 1.4;
}

:root.app-dark .privacy-notice {
    background: var(--surface-800);
}
</style>
