<template>
    <div class="card">
        <Toast/>
        <DataTable
            :value="paperData"
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
                    <div>
                        <Button type="button" icon="pi pi-filter-slash" :label="$t('search.clearFilters')" outlined @click="initFilters()" />
                    </div>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" :placeholder="$t('search.searchPlaceholder')" />
                    </IconField>
                </div>
            </template>

            <template #empty>{{ $t('search.noResults') }}</template>

            <Column header="ID" field="id"/>

            <Column :header="$t('search.publication')" filter-field="publication" :show-filter-match-modes="false" :filter-menu-style="{'min-width': '20rem'}">
                <template #body="{ data }">
                    {{ data.publication }}
                </template>
                <template #filter="{ filterModel }">
                    <MultiSelect display="chip" v-model="filterModel.value" :options="publicationList" option-label="name" option-value="name" :placeholder="$t('search.anyPublication')">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <span>{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                        <template #footer>
                            <div class="py-2 px-4">
                                <b>{{ filterModel.value ? filterModel.value.length : 0 }}</b> 
                                {{ $i18n.locale === 'zh' 
                                    ? '已选择 ' + (filterModel.value ? filterModel.value.length : 0) + ' 个会议/期刊。'
                                    : (filterModel.value ? filterModel.value.length : 0) + ' publication' + ((filterModel.value ? filterModel.value.length : 0) > 1 ? 's' : '') + ' selected.'
                                }}
                            </div>
                        </template>
                    </MultiSelect>
                </template>
            </Column>

            <Column :header="$t('search.title')">
                <template #body="{ data }">
                    <span >{{ highlightSearchPatterns(data.title,1,filters.global)}}</span>
                    <span class="text-primary font-bold">{{ highlightSearchPatterns(data.title,2,filters.global)}}</span>
                    <span >{{ highlightSearchPatterns(data.title,3,filters.global)}}</span>
                </template>
            </Column>

            <Column :header="$t('search.year')" filter-field="year" :show-filter-match-modes="false">
                <template #body="{ data }">
                    {{ data.year }}
                </template>
                <template #filter="{ filterModel }">
                    <MultiSelect v-model="filterModel.value" :options="publicationYears" option-label="name" option-value="name" :placeholder="$t('search.anyYear')">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <span>{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </MultiSelect>
                </template>
            </Column>

            <Column :header="$t('search.paper')">
                <template #body="slotProps">
                    <div class="flex items-center ">
                        <Button v-if="slotProps.data.paper!=='#'" type="button" icon="pi pi-paperclip text-primary-300 " text size="small" :disabled="slotProps.data.paper==='#'" @click="openNewWebsite(slotProps.data.paper)"></Button>
                        <Button v-else type="button" icon="pi pi-paperclip" class="text-gray-300" text size="small" :disabled="slotProps.data.paper==='#'"></Button>
                        <!--                                <Button type="button" icon="pi pi-star" :class="{'text-yellow-300': isFavorite(slotProps.data.id),'text-gray-300': !isFavorite(slotProps.data.id)}" text size="small" @click="toggleFavorite(slotProps.data.id,$event.target)"></Button>-->
                        <!--                                    <Button v-if="isFavorite(slotProps.data.id)" type="button" icon="pi pi-star" class="text-yellow-300" text size="small" @click="toggleFavorite(slotProps.data.id,$event.target)"></Button>-->
                        <!--                                    <Button v-else type="button" icon="pi pi-star" class="text-gray-300" text size="small" @click="toggleFavorite(slotProps.data.id,$event.target)"></Button>-->
                    </div>
                </template>
            </Column>

            <template #footer>
                {{ footerHint }}
            </template>

        </DataTable>
    </div>
</template>

<script>
import { FilterMatchMode } from '@primevue/core/api';
import paperData from '@/assets/data/data-quick-view.json';
import paperStatics from '@/assets/data/data-statistics.json'
export default {
    methods: {
        async loadFullData() {
            this.loading = true
            let fullDataPath
            if (process.env.NODE_ENV === 'production') {
                fullDataPath = 'https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/data.json'
            } else {
                fullDataPath = '../src/assets/data/data.json'
            }
            await fetch(fullDataPath)
                .then((res) => {
                    if (res.ok) {
                        return res.json()
                    }
                })
                .then(data=>{
                    this.paperData = data
                    this.loaded = true
                    this.footerHint = this.$t('search.totalPapers', { count: this.paperData.length })
                })
                .catch(error=>{
                    console.log(error)
                    this.footerHint = this.$t('search.previewMessage', { count: this.paperData.length })
                })
                .finally(()=>{
                    this.loading = false
                })
        },
        debug() {
            console.log(this.filters)
        },
        openNewWebsite(url) {
            if (url !== '#') {
                window.open(url, '_blank')
            }
        },
        initFilters() {
            this.filters = {
                global: {value: null, matchMode: FilterMatchMode.CONTAINS},
                publication: {value:null, matchMode: FilterMatchMode.IN},
                year: {value:null, matchMode: FilterMatchMode.IN}
            }
        },
        onFiltering(event) {
            this.paperNum = event.filteredValue.length

        },
        onRowSelect(event) {
            navigator.clipboard.writeText(event.data.title).then(()=>{
                this.$toast.add({ 
                    severity: 'info', 
                    summary: this.$t('common.notice'), 
                    detail: this.$t('search.copied'), 
                    life: 3000 
                });
            })
        },
        highlightSearchPatterns(data,step,filterModel) {
            if (step === 1) {
                if (filterModel.value && filterModel.value.length > 0) {
                    let i = data.toUpperCase().indexOf(filterModel.value.toUpperCase())
                    return data.slice(0,i)
                } else {
                    return data
                }
            } else if (step === 2) {
                if (filterModel.value && filterModel.value.length > 0) {
                    let i = data.toUpperCase().indexOf(filterModel.value.toUpperCase())
                    return data.slice(i, i+filterModel.value.length)
                } else {
                    return ''
                }
            } else if (step === 3) {
                if (filterModel.value && filterModel.value.length > 0) {
                    let i = data.toUpperCase().indexOf(filterModel.value.toUpperCase())
                    return data.slice(i+filterModel.value.length)
                } else {
                    return ''
                }
            }
        },
        toggleFavorite(paperID) {
            console.log(this.$route.meta.stars)
            if (paperID in this.$route.meta.stars) {
                this.$route.meta.stars[paperID] = !this.$route.meta.stars[paperID]
            } else {
                this.$route.meta.stars[paperID] = true
            }
            // if (this.$route.meta.stars[paperID]) {
            //     item.classList.remove('text-gray-300')
            //     item.classList.add('text-yellow-300')
            // } else {
            //     item.classList.remove('text-yellow-300')
            //     item.classList.add('text-gray-300')
            // }
        },
        isFavorite(paperID) {
            return this.$route.meta.stars[paperID]
        },
        initTableMeta(){
            for (let publication in this.paperStatics.byPublication) {
                this.publicationList.push({name:publication})
            }
            for (let year in this.paperStatics.byYear) {
                this.publicationYears.push({name:parseInt(year)})
            }
        },
        updateFooterHint() {
            if (this.loaded) {
                this.footerHint = this.$t('search.totalPapers', { count: this.paperData.length });
            } else {
                this.footerHint = this.$t('search.previewMessage', { count: this.paperData.length });
            }
        },
        updatePageTitle() {
            document.title = this.$t('menu.search') + ' - ' + this.$t('common.title');
        }
    },
    data(){
        return {
            filters: null,
            loading: false,
            loaded: false,
            paperData: paperData,
            paperStatics:paperStatics,
            paperNum: paperData.length,
            footerHint: this.$t ? this.$t('search.previewMessage', { count: paperData.length }) : paperData.length + ' papers in total. This is a preview version for fast loading. The full dataset is loading now...',
            selectedPaper: null,
            publicationList: [],
            publicationYears: [],
        }
    },
    created() {
        this.initFilters()
    },
    mounted() {
        this.initTableMeta()
        this.updateFooterHint()
        this.updatePageTitle()
        this.loadFullData()
    },
    beforeUnmount() {
        // 恢复默认标题
        document.title = this.$t('common.title');
    },
    watch: {
        '$i18n.locale'() {
            this.updateFooterHint();
            this.updatePageTitle();
        }
    },
    computed: {
        currentPageReportTemplate() {
            return this.$i18n.locale === 'zh' 
                ? '显示第 {first} 到 {last} 条，共 {totalRecords} 篇论文。跳转到页面'
                : 'Showing {first} to {last} of {totalRecords} papers. Jump to page';
        }
    },

};
</script>

<style scoped>
a {
    text-decoration: none;
}
</style>