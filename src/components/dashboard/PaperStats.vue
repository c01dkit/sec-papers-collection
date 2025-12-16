<template>
    <div class="card">
        <div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
                <!-- <p class="text-muted-color text-sm mb-1">{{ t('dashboard.paperStats.title') }}</p> -->
                <h1 class="font-semibold text-xl m-0">{{ t('dashboard.paperStats.subtitle') }}</h1>
            </div>
            <div v-if="showStatusDots" class="flex items-center gap-3 flex-wrap" aria-label="status legend">
                <div v-for="status in statusOrder" :key="status" class="flex items-center gap-2 text-sm text-muted-color">
                    <span :class="['status-dot', statusConfig[status].dotClass]"></span>
                    <span>{{ statusConfig[status].label }}</span>
                </div>
            </div>
        </div>
        <Divider class="mb-4"/>

        <div class="flex flex-col gap-4">
            <div v-for="conference in conferences" :key="conference.name" class="conference-block">
                <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-tags text-primary text-base"></i>
                        <span class="font-semibold text-lg">{{ conference.name }}</span>
                    </div>
                    <span class="text-sm text-muted-color">{{ t('dashboard.paperStats.totalPapers', { count: conference.total }) }}</span>
                </div>

                <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <div
                        v-for="item in conference.items"
                        :key="item.year"
                        class="year-card flex items-center justify-between gap-3"
                    >
                        <div class="flex flex-col">
                            <span class="text-xs text-muted-color">{{ t('dashboard.paperStats.year', { year: item.year }) }}</span>
                            <span class="font-semibold text-base">{{ item.count }} {{ t('dashboard.paperStats.papers') }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs font-medium">
                            <span v-if="showStatusDots" :class="['status-dot', statusConfig[item.status].dotClass]"></span>
                            <span :class="statusConfig[item.status].textClass">{{ statusConfig[item.status].label }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import paperStatistics from '@/assets/data/data-statistics.json';
import { getRuntimeSettings } from '@/service/SettingsService';

const { t } = useI18n();
const runtimeSettings = getRuntimeSettings();
const showStatusDots = computed(() => !!runtimeSettings.showStatusDots);

const statusOrder = ['advanced', 'processed', 'processing', 'pending'];
const statusConfig = {
    advanced: {
        label: computed(() => t('dashboard.paperStats.status.advanced')),
        dotClass: 'bg-purple-400 shadow-dot-purple',
        textClass: 'text-purple-500 dark:text-purple-300'
    },
    processed: {
        label: computed(() => t('dashboard.paperStats.status.processed')),
        dotClass: 'bg-green-400 shadow-dot-green',
        textClass: 'text-green-600 dark:text-green-200'
    },
    processing: {
        label: computed(() => t('dashboard.paperStats.status.processing')),
        dotClass: 'bg-amber-400 shadow-dot-amber',
        textClass: 'text-amber-600 dark:text-amber-200'
    },
    pending: {
        label: computed(() => t('dashboard.paperStats.status.pending')),
        dotClass: 'bg-red-400 shadow-dot-red',
        textClass: 'text-red-600 dark:text-red-200'
    }
};

const conferences = computed(() => {
    const counts = resolveCounts();
    const statuses = paperStatistics.byPublicationAndYearAndStatus || {};

    return Object.entries(counts).map(([name, years]) => {
        const items = Object.entries(years)
            .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
            .map(([year, count]) => ({
                year,
                count,
                status: resolveStatus(name, year, statuses)
            }));
        const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);
        return { name, items, total };
    });
});

function resolveCounts() {
    const explicit = paperStatistics.byPublicationAndYear || {};
    if (Object.keys(explicit).length) return explicit;

    const years = paperStatistics.years || [];
    const overview = paperStatistics.overview || [];
    const reconstructed = {};

    overview.forEach(entry => {
        if (!entry?.label || !Array.isArray(entry.data)) return;
        reconstructed[entry.label] = {};
        years.forEach((year, idx) => {
            const count = entry.data[idx];
            if (count !== undefined) {
                reconstructed[entry.label][year] = count;
            }
        });
    });

    return reconstructed;
}

function resolveStatus(conference, year, statusesMap) {
    const raw = statusesMap?.[conference]?.[year];
    const normalized = normalizeStatus(raw);
    if (normalized) return normalized;
    return 'pending';
}

function normalizeStatus(raw) {
    if (!raw) return null;
    const key = String(raw).toLowerCase();
    if (key === 'advanced' || key === 'advanced_processed') return 'advanced';
    if (key === 'processed' || key === 'done' || key === 'completed') return 'processed';
    if (key === 'processing' || key === 'inprogress' || key === 'running') return 'processing';
    if (key === 'pending' || key === 'todo' || key === 'notchecked' || key === 'unprocessed') return 'pending';
    return null;
}
</script>

<style scoped>
.conference-block + .conference-block {
    /* border-top: 1px solid var(--surface-border); */
    padding-top: 0.5rem;
}

.year-card {
    border: 1px solid var(--surface-border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--surface-section) 94%, transparent);
    padding: 0.9rem 1rem;
    transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.year-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 8px 18px -10px var(--primary-400);
    transform: translateY(-1px);
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 9999px;
    position: relative;
    animation: pulse 1.6s ease-in-out infinite;
}

.shadow-dot-green {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--p-green-400) 20%, transparent);
}

.shadow-dot-amber {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--p-amber-400) 20%, transparent);
}

.shadow-dot-red {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--p-red-400) 20%, transparent);
}

.shadow-dot-purple {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--p-purple-400) 20%, transparent);
}

@keyframes pulse {
    0% {
        transform: scale(0.9);
        opacity: 0.75;
    }
    50% {
        transform: scale(1.15);
        opacity: 1;
    }
    100% {
        transform: scale(0.9);
        opacity: 0.75;
    }
}

:deep(.text-muted-color) {
    color: var(--text-color-secondary);
}
</style>
