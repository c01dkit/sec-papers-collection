<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';

const { t, locale } = useI18n();

const sites = [
    {
        key: 'bestPaperAwards',
        url: 'https://jeffhuang.com/best_paper_awards/'
    },
    {
        key: 'ccfddl',
        url: 'https://ccfddl.top/'
    },
    {
        key: 'ccfRecommend',
        url: 'https://ccf.atom.im/'
    },
    {
        key: 'connectedPapers',
        url: 'https://www.connectedpapers.com/'
    },
    {
        key: 'wisPaper',
        url: 'https://wispaper.ai/'
    },
    {
        key: 'csPapers',
        url: 'https://cspapers.org/'
    }
];

function faviconFor(url) {
    try {
        const host = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    } catch {
        return '';
    }
}

function hostLabel(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

const cards = computed(() =>
    sites.map((s) => ({
        url: s.url,
        host: hostLabel(s.url),
        icon: faviconFor(s.url),
        title: t(`moreSites.list.${s.key}.title`),
        description: t(`moreSites.list.${s.key}.desc`)
    }))
);

function onIconError(e) {
    e.target.style.visibility = 'hidden';
}

function openSite(url) {
    window.open(url, '_blank', 'noopener');
}
</script>

<template>
    <div class="card">
        <h1 class="page-title">{{ t('moreSites.title') }}</h1>
        <p class="text-muted-color mb-4">{{ t('moreSites.subtitle') }}</p>

        <div class="site-grid">
            <Card
                v-for="c in cards"
                :key="c.url"
                class="site-card"
                @click="openSite(c.url)"
            >
                <template #header>
                    <div class="site-card-header">
                        <img
                            v-if="c.icon"
                            :src="c.icon"
                            :alt="c.host"
                            class="site-icon"
                            loading="lazy"
                            referrerpolicy="no-referrer"
                            @error="onIconError"
                        />
                        <div class="site-header-text">
                            <div class="site-title" :title="c.title">{{ c.title }}</div>
                            <div class="site-host">
                                <span>{{ c.host }}</span>
                            </div>
                        </div>
                    </div>
                </template>
                <template #content>
                    <p class="site-desc">{{ c.description }}</p>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.page-title {
    font-weight: 600;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
}

.site-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.site-card {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    height: 100%;
}

.site-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

:deep(.p-card-body) {
    padding: 1.25rem 1.5rem 1.5rem 1.5rem;
    gap: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.p-card-header) {
    padding: 1.5rem 1.5rem 0 1.5rem;
}

:deep(.p-card-content) {
    padding: 0;
    flex: 1;
}

.site-card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0;
}

.site-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: var(--surface-100);
    padding: 6px;
    object-fit: contain;
    flex-shrink: 0;
}

:root.app-dark .site-icon {
    background: var(--surface-800);
}

.site-header-text {
    min-width: 0;
    flex: 1;
}

.site-title {
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.site-host {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.site-desc {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-color-secondary);
}
</style>
