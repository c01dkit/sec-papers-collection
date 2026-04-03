<template>
    <div class="card">
        <Toast/>
        <DataTable
            :value="displayedPaperData"
            selection-mode="single"
            size="small"
            v-model:selection="selectedPaper"
            v-model:filters="filters"
            data-key="id"
            paginator show-gridlines :rows=15
            filter-display="menu"
            @filter="onFiltering"
            @row-select="onRowSelect"
            :globalFilterFields="['title']"
            :page-link-size="5"
            paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport JumpToPageDropdown"
            :current-page-report-template="currentPageReportTemplate"
            :rows-per-page-options="[15,30,50,100]"
        >

            <template #header>
                <div class="flex justify-between">
                    <div class="flex gap-2">
                        <Button type="button" icon="pi pi-filter-slash" :label="t('search.clearFilters')" outlined @click="initFilters()" />
                        <Button type="button" :icon="showFavoritesOnly ? 'pi pi-star-fill' : 'pi pi-star'" :label="t('search.favoritesOnly')" :severity="showFavoritesOnly ? 'warn' : 'secondary'" :outlined="!showFavoritesOnly" @click="showFavoritesOnly = !showFavoritesOnly" />
                    </div>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" :placeholder="t('search.searchPlaceholder')" />
                    </IconField>
                </div>
            </template>

            <template #empty>{{ t('search.noResults') }}</template>

            <Column header="ID" field="id"/>

            <Column :header="t('search.publication')" filter-field="publication" :show-filter-match-modes="false" :filter-menu-style="{'min-width': '20rem'}">
                <template #body="{ data }">
                    {{ data.publication }}
                </template>
                <template #filter="{ filterModel }">
                    <MultiSelect display="chip" v-model="filterModel.value" :options="publicationList" option-label="name" option-value="name" :placeholder="t('search.anyPublication')">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <span>{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                        <template #footer>
                            <div class="py-2 px-4">
                                <b>{{ filterModel.value ? filterModel.value.length : 0 }}</b>
                                {{ locale === 'zh'
                                    ? '已选择 ' + (filterModel.value ? filterModel.value.length : 0) + ' 个会议/期刊。'
                                    : (filterModel.value ? filterModel.value.length : 0) + ' publication' + ((filterModel.value ? filterModel.value.length : 0) > 1 ? 's' : '') + ' selected.'
                                }}
                            </div>
                        </template>
                    </MultiSelect>
                </template>
            </Column>

            <Column :header="t('search.title')">
                <template #body="{ data }">
                    <template v-for="(seg, idx) in titleSegments(data.title)" :key="idx">
                        <span :class="seg.cls">{{ seg.text }}</span>
                    </template>
                </template>
            </Column>

            <Column :header="t('search.year')" filter-field="year" :show-filter-match-modes="false">
                <template #body="{ data }">
                    {{ data.year }}
                </template>
                <template #filter="{ filterModel }">
                    <MultiSelect v-model="filterModel.value" :options="publicationYears" option-label="name" option-value="name" :placeholder="t('search.anyYear')">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <span>{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </MultiSelect>
                </template>
            </Column>

            <Column :header="t('search.paper')">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <Button v-if="slotProps.data.paper!=='#'" type="button" icon="pi pi-paperclip text-primary-300" text size="small" @click="openNewWebsite(slotProps.data.paper)"></Button>
                        <Button v-else type="button" icon="pi pi-paperclip" class="text-gray-300" text size="small" disabled></Button>
                        <Button type="button" :icon="isFavorite(slotProps.data.id) ? 'pi pi-star-fill' : 'pi pi-star'" :class="isFavorite(slotProps.data.id) ? 'text-yellow-400' : 'text-gray-300'" text size="small" @click="toggleFavorite(slotProps.data.id)"></Button>
                    </div>
                </template>
            </Column>

            <template #footer>
                {{ footerHint }}
            </template>

        </DataTable>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { usePageTitle } from '@/composables/useI18n';
import { highlightSegments } from '@/composables/useHighlight';
import { loadFavorites, saveFavorites } from '@/service/SettingsService';
import paperDataQuickView from '@/assets/data/data-quick-view.json';
import paperStatics from '@/assets/data/data-statistics.json';

const { t, locale } = useI18n();
const toast = useToast();
usePageTitle('menu.search');

const filters = ref(null);
const loading = ref(false);
const loaded = ref(false);
const paperData = ref(paperDataQuickView);
const paperNum = ref(paperDataQuickView.length);
const footerHint = ref('');
const selectedPaper = ref(null);
const publicationList = ref([]);
const publicationYears = ref([]);
const favorites = ref(new Set());
const showFavoritesOnly = ref(false);

const displayedPaperData = computed(() => {
    if (!showFavoritesOnly.value) return paperData.value;
    return paperData.value.filter(p => favorites.value.has(p.id));
});

function isFavorite(id) {
    return favorites.value.has(id);
}

async function toggleFavorite(id) {
    const favs = new Set(favorites.value);
    if (favs.has(id)) {
        favs.delete(id);
    } else {
        favs.add(id);
    }
    favorites.value = favs;
    try {
        await saveFavorites([...favs]);
    } catch (e) {
        console.warn('Could not save favorites', e);
    }
}

const currentPageReportTemplate = computed(() => {
    return locale.value === 'zh'
        ? '显示第 {first} 到 {last} 条，共 {totalRecords} 篇论文。跳转到页面'
        : 'Showing {first} to {last} of {totalRecords} papers. Jump to page';
});

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        publication: { value: null, matchMode: FilterMatchMode.IN },
        year: { value: null, matchMode: FilterMatchMode.IN }
    };
}

function initTableMeta() {
    for (let publication in paperStatics.byPublication) {
        publicationList.value.push({ name: publication });
    }
    for (let year in paperStatics.byYear) {
        publicationYears.value.push({ name: parseInt(year) });
    }
}

function updateFooterHint() {
    if (loaded.value) {
        footerHint.value = t('search.totalPapers', { count: paperData.value.length });
    } else {
        footerHint.value = t('search.previewMessage', { count: paperData.value.length });
    }
}

async function loadFullData() {
    loading.value = true;
    try {
        let data;
        if (import.meta.env.PROD) {
            const res = await fetch('https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/data.json');
            if (res.ok) {
                data = await res.json();
            }
        } else {
            const module = await import('@/assets/data/data.json');
            data = module.default;
        }
        if (data) {
            paperData.value = data;
            loaded.value = true;
            footerHint.value = t('search.totalPapers', { count: paperData.value.length });
        }
    } catch (error) {
        console.log(error);
        footerHint.value = t('search.previewMessage', { count: paperData.value.length });
    } finally {
        loading.value = false;
    }
}

function openNewWebsite(url) {
    if (url !== '#') {
        window.open(url, '_blank');
    }
}

function onFiltering(event) {
    paperNum.value = event.filteredValue.length;
}

function onRowSelect(event) {
    navigator.clipboard.writeText(event.data.title).then(() => {
        toast.add({
            severity: 'info',
            summary: t('common.notice'),
            detail: t('search.copied'),
            life: 3000
        });
    });
}

function titleSegments(title) {
    const searchTerm = filters.value?.global?.value;
    const extra = searchTerm ? [{ text: searchTerm, cls: 'text-primary font-bold' }] : [];
    return highlightSegments(title, extra);
}

// Init
initFilters();

onMounted(async () => {
    initTableMeta();
    updateFooterHint();
    loadFullData();
    try {
        const stored = await loadFavorites();
        favorites.value = new Set(stored);
    } catch (e) {
        console.warn('Could not load favorites', e);
    }
});

watch(locale, () => {
    updateFooterHint();
});
</script>

<style scoped>
a {
    text-decoration: none;
}
</style>
