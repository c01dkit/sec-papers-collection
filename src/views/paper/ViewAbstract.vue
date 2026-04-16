<template>
    <div class="abstract-page">
        <div class="card menu-card">
            <MegaMenu :model="items" />
        </div>

        <div class="card content-card">
            <ScrollTop v-animateonscroll="{ enterClass: 'animate-fadeinleft', leaveClass: 'animate-fadeout' }" class="animate-duration-1000 animate-ease-in-out" />

            <!-- Header: shows selected publication + year + paper count -->
            <header v-if="selection" class="abstract-header">
                <div class="abstract-header-main">
                    <div class="abstract-header-icon">
                        <i class="pi pi-book"></i>
                    </div>
                    <div>
                        <h2 class="abstract-title">
                            {{ selection.publication }}
                            <span class="abstract-year">{{ selection.year }}</span>
                        </h2>
                        <p class="abstract-subtitle">
                            <span>{{ selection.count }} {{ t('abstract.papers') }}</span>
                        </p>
                    </div>
                </div>
            </header>
            <header v-else class="abstract-header abstract-header--placeholder">
                <h2 class="abstract-title">{{ t('abstract.selectPublication') }}</h2>
            </header>

            <!-- Empty state when nothing picked yet -->
            <div v-if="!selection && !loading" class="abstract-empty">
                <i class="pi pi-hand-point-up abstract-empty-icon"></i>
                <p class="abstract-empty-text">{{ t('abstract.emptyHint') }}</p>
            </div>

            <!-- Loading skeletons -->
            <div v-else-if="loading" class="abstract-list">
                <div v-for="n in 5" :key="n" class="abstract-item abstract-item--skeleton">
                    <Skeleton width="70%" height="1.25rem" class="mb-3" />
                    <Skeleton width="100%" height="0.75rem" class="mb-2" />
                    <Skeleton width="100%" height="0.75rem" class="mb-2" />
                    <Skeleton width="60%" height="0.75rem" />
                </div>
            </div>

            <!-- Paper list -->
            <ul v-else class="abstract-list">
                <li v-for="item in paperCollection" :key="item.id" class="abstract-item">
                    <a :href="item.paper" target="_blank" rel="noopener" class="abstract-item-title">
                        <template v-for="(seg, idx) in highlightSegments(item.title)" :key="idx">
                            <span :class="seg.cls">{{ seg.text }}</span>
                        </template>
                        <i class="pi pi-external-link abstract-item-link-icon"></i>
                    </a>
                    <p v-if="item.abstract" class="abstract-item-body">
                        <template v-for="(seg, idx) in highlightSegments(item.abstract)" :key="idx">
                            <span :class="seg.cls">{{ seg.text }}</span>
                        </template>
                    </p>
                    <p v-else class="abstract-item-body abstract-item-body--empty">
                        {{ t('abstract.noAbstract') }}
                    </p>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Skeleton from 'primevue/skeleton';
import { usePageTitle } from '@/composables/useI18n';
import { highlightSegments } from '@/composables/useHighlight';
import { languageEmitter } from '@/locales';
import paperStatis from '@/assets/data/data-statistics.json';

const { t } = useI18n();

usePageTitle('menu.abstract');

const paperStatisRef = ref(paperStatis);
const paperCollection = ref([]);
const loading = ref(false);
const items = ref([]);
const selection = ref(null);

const loadPaperCollection = async (publication, year) => {
    loading.value = true;
    paperCollection.value = [];
    let fullDataPath;
    if (process.env.NODE_ENV === 'production') {
        fullDataPath = 'https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/meta_json/' + publication + ' - ' + year + '.json';
    } else {
        fullDataPath = '/src/assets/data/meta_json/' + publication + ' - ' + year + '.json';
    }

    try {
        const res = await fetch(fullDataPath);
        if (res.ok) {
            const data = await res.json();
            paperCollection.value = data;
        }
    } catch (error) {
        console.log(error);
    } finally {
        loading.value = false;
    }
};

const constructPublicationItems = () => {
    let newItems = [
        {
            label: t('abstract.topTier'),
            icon: 'pi pi-shield',
            items: []
        },
        {
            label: t('abstract.softwareEngineering'),
            icon: 'pi pi-code',
            items: []
        },
        {
            label: t('abstract.system'),
            icon: 'pi pi-cog',
            items: []
        }
    ];

    for (let publication in paperStatisRef.value.byPublicationAndYear) {
        let targetIndex;
        if (['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'].includes(publication)) {
            targetIndex = 0;
        } else if (['ISSTA', 'ICSE', 'FSE', 'ASE', 'TSE'].includes(publication)) {
            targetIndex = 1;
        } else if (['SOSP', 'ASPLOS'].includes(publication)) {
            targetIndex = 2;
        }
        const item = paperStatisRef.value.byPublicationAndYear[publication];
        let tempPublicationItem = {
            label: publication,
            items: []
        };
        for (let year in item) {
            tempPublicationItem.items.push({
                label: year,
                command: () => {
                    selection.value = { publication, year, count: item[year] };
                    loadPaperCollection(publication, year);
                }
            });
        }
        tempPublicationItem.items = tempPublicationItem.items.reverse();
        newItems[targetIndex].items.push([tempPublicationItem]);
    }
    items.value = newItems;
};

const handleLanguageChange = () => {
    constructPublicationItems();
};

onMounted(() => {
    constructPublicationItems();
    languageEmitter.on(handleLanguageChange);
});

onUnmounted(() => {
    languageEmitter.off(handleLanguageChange);
});
</script>

<style scoped>
.abstract-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.menu-card {
    padding: 0.5rem 0.75rem;
}

.menu-card :deep(.p-megamenu) {
    border: none;
    background: transparent;
}

.content-card {
    padding: 1.75rem 2rem 2rem 2rem;
}

.abstract-header {
    margin-bottom: 1.5rem;
}

.abstract-header--placeholder {
    color: var(--text-color-secondary);
}

.abstract-header-main {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.abstract-header-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    color: var(--primary-color);
    font-size: 1.35rem;
    flex-shrink: 0;
}

.abstract-title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 600;
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.abstract-year {
    font-size: 1rem;
    font-weight: 500;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
}

.abstract-subtitle {
    margin: 0.35rem 0 0 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.abstract-empty {
    text-align: center;
    padding: 4rem 1rem;
    color: var(--text-color-secondary);
}

.abstract-empty-icon {
    display: block;
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    color: var(--primary-color);
    opacity: 0.7;
}

.abstract-empty-text {
    margin: 0 auto;
    max-width: 32rem;
    line-height: 1.6;
}

.abstract-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.abstract-item {
    position: relative;
    padding: 1rem 1.1rem 1.1rem 1.25rem;
    border-radius: 10px;
    border: 1px solid transparent;
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.abstract-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 1.1rem;
    bottom: 1.1rem;
    width: 3px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--primary-color) 35%, transparent);
    opacity: 0;
    transition: opacity 0.15s ease;
}

.abstract-item:hover {
    background: color-mix(in srgb, var(--primary-color) 5%, transparent);
    border-color: color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.abstract-item:hover::before {
    opacity: 1;
}

.abstract-item--skeleton:hover {
    background: transparent;
    border-color: transparent;
}

.abstract-item--skeleton:hover::before {
    opacity: 0;
}

.abstract-item-title {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4rem;
    font-size: 1.02rem;
    font-weight: 600;
    line-height: 1.45;
    color: var(--text-color);
    text-decoration: none;
    transition: color 0.15s ease;
}

.abstract-item-title:hover {
    color: var(--primary-color);
}

.abstract-item-link-icon {
    font-size: 0.75rem;
    opacity: 0.5;
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.abstract-item-title:hover .abstract-item-link-icon {
    opacity: 1;
    transform: translate(1px, -1px);
}

.abstract-item-body {
    margin: 0.6rem 0 0 0;
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--text-color-secondary);
    text-align: justify;
    hyphens: auto;
}

.abstract-item-body--empty {
    font-style: italic;
    opacity: 0.7;
}

@media screen and (max-width: 768px) {
    .content-card {
        padding: 1.25rem 1rem;
    }
    .abstract-item {
        padding: 0.85rem 0.75rem 0.95rem 1rem;
    }
    .abstract-title {
        font-size: 1.15rem;
    }
}
</style>
