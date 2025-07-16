<template>
        <!-- 上方：会议选择区域 -->
        <div class="mb-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                    v-for="(item, index) in awards" 
                    :key="index"
                    @click="selectConference(item)"
                    :class="[
                        'conference-card',
                        { 'selected': selectedConference?.publication === item.publication }
                    ]"
                >
                    <div class="conference-cover">
                        <div class="conference-title">{{ item.publication }}</div>
                        <div class="conference-stats">
                            <div class="stat-item">
                                <span class="stat-number">{{ getTotalPapers(item) }}</span>
                                <span class="stat-label">{{ t('awards.papers')}}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">{{ item.awards.length }}</span>
                                <span class="stat-label">{{ t('awards.awards') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 下方：详细展示区域 -->
        <div class="details-panel" v-if="selectedConference">
            <div class="panel-header">
                <h2 class="text-2xl font-bold mb-4">{{ selectedConference.publication }} </h2>
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-sm">{{ t('awards.groupBy') }}</span>
                    <ToggleSwitch 
                        v-model="groupByYear" 
                        @change="updateTabs"
                    />
                    <span class="text-sm">{{ groupByYear ? t('awards.byYear') : t('awards.byType') }}</span>
                </div>
            </div>

            <Tabs v-model:value="activeTab" scrollable>
                <TabList>
                    <Tab 
                        v-for="tab in tabs" 
                        :key="tab.key" 
                        :value="tab.key"
                    >
                        {{ tab.label }}
                        <Badge 
                            :value="tab.count" 
                            severity="secondary" 
                            class="ml-2"
                        />
                    </Tab>
                </TabList>
                
                <TabPanels>
                    <TabPanel 
                        v-for="tab in tabs" 
                        :key="tab.key" 
                        :value="tab.key"
                    >
                        <div class="tab-content">
                            <div 
                                v-for="(paper, index) in tab.papers" 
                                :key="index"
                                class="paper-item"
                            >
                                <div class="paper-header">
                                    <span>{{ paper.title }}</span>
                                    <div class="paper-badges">
                                        <Badge 
                                            v-if="!groupByYear" 
                                            :value="paper.year" 
                                            class="mr-2"
                                        />
                                        <Badge 
                                            v-if="groupByYear" 
                                            :value="paper.awardName" 
                                        />
                                    </div>
                                </div>
                                <Divider />
                            </div>
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <!-- 未选择会议时的提示 -->
        <div v-else class="empty-state">
            <div class="text-center py-12">
                <i class="pi pi-trophy text-6xl mb-4 empty-icon"></i>
                <h3 class="text-xl mb-2 empty-title">{{ t('awards.selectHint') }}</h3>
                <p class="empty-description">{{ t('awards.selectHintDetail') }}</p>
            </div>
        </div>
</template>

<script setup>
import { AwardService } from '@/service/AwardService.js';
import { onMounted, ref, computed } from 'vue';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import ToggleSwitch from 'primevue/toggleswitch';
import Badge from 'primevue/badge';
import Divider from 'primevue/divider';
import { useI18n } from 'vue-i18n';

const awards = ref([]);
const selectedConference = ref(null);
const groupByYear = ref(false);
const activeTab = ref(null);
const { t } = useI18n();

// 获取总论文数
const getTotalPapers = (conference) => {
    return conference.awards.reduce((total, award) => total + award.papers.length, 0);
};

// 选择会议
const selectConference = (conference) => {
    selectedConference.value = conference;
    updateTabs();
};

// 计算tabs数据
const tabs = computed(() => {
    if (!selectedConference.value) return [];
    
    if (groupByYear.value) {
        // 按年份分组
        const yearGroups = {};
        selectedConference.value.awards.forEach(award => {
            award.papers.forEach(paper => {
                if (!yearGroups[paper.year]) {
                    yearGroups[paper.year] = [];
                }
                yearGroups[paper.year].push({
                    ...paper,
                    awardName: award.name
                });
            });
        });
        
        return Object.keys(yearGroups)
            .sort((a, b) => b - a) // 年份降序
            .map(year => ({
                key: `year-${year}`,
                label: year,
                count: yearGroups[year].length,
                papers: yearGroups[year]
            }));
    } else {
        // 按奖项类型分组
        return selectedConference.value.awards.map(award => ({
            key: `award-${award.name}`,
            label: award.name,
            count: award.papers.length,
            papers: award.papers.map(paper => ({
                ...paper,
                awardName: award.name
            }))
        }));
    }
});

// 更新tabs
const updateTabs = () => {
    if (tabs.value.length > 0) {
        activeTab.value = tabs.value[0].key;
    }
};

onMounted(() => {
    AwardService.getAward().then((res) => {
        awards.value = res;
    });
});
</script>

<style scoped>
/* 会议选择卡片样式 */

.conference-card {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px var(--p-content-border-color);
    background: var(--p-content-background);
    border: 1px solid var(--p-content-border-color);
    min-height: 150px;
    position: relative;
}

.conference-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px var(--p-content-border-color);
    border-color: var(--p-primary-color);
}

.conference-card.selected {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px var(--p-primary-color);
    border: 2px solid var(--p-primary-color);
    background: var(--p-primary-color);
}

.conference-cover {
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
}

.conference-card:not(.selected) .conference-cover {
    color: var(--p-text-color);
}

.conference-card.selected .conference-cover {
    color: var(--p-primary-contrast-color);
}

.conference-cover::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--p-surface-100);
    border-radius: 8px;
    margin: 8px;
    opacity: 0.1;
}

.conference-card.selected .conference-cover::before {
    background: var(--p-primary-contrast-color);
    opacity: 0.1;
}

.conference-title {
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1rem;
    z-index: 1;
    position: relative;
}

.conference-stats {
    display: flex;
    justify-content: space-around;
    z-index: 1;
    position: relative;
}

.stat-item {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
}

.stat-label {
    display: block;
    font-size: 0.875rem;
    opacity: 0.9;
    margin-top: 0.25rem;
}

/* 详细面板样式 */
.details-panel {
    background: var(--p-content-background);
    color: var(--p-text-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px var(--p-content-border-color);
    border: 1px solid var(--p-content-border-color);
}

.panel-header {
    border-bottom: 1px solid var(--p-content-border-color);
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
}

.tab-content {
    padding: 1rem 0;
}

.paper-item {
    margin-bottom: 1rem;
}

.paper-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.paper-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--p-text-color);
    flex: 1;
    line-height: 1.4;
}

.paper-badges {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

/* 空状态样式 */
.empty-state {
    background: var(--p-content-background);
    color: var(--p-text-color);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px var(--p-content-border-color);
    border: 1px solid var(--p-content-border-color);
}

.empty-state .text-gray-300 {
    color: var(--p-text-muted-color);
}

.empty-state .text-gray-600 {
    color: var(--p-text-color);
}

.empty-state .text-gray-500 {
    color: var(--p-text-muted-color);
}

.empty-icon {
    color: var(--p-text-muted-color);
}

.empty-title {
    color: var(--p-text-color);
}

.empty-description {
    color: var(--p-text-muted-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .conference-card {
        min-height: 120px;
    }
    
    .conference-title {
        font-size: 1rem;
    }
    
    .stat-number {
        font-size: 1.25rem;
    }
    
    .paper-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .paper-badges {
        align-self: flex-end;
    }
}

/* 动画效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.details-panel {
    animation: fadeIn 0.3s ease-out;
}

/* Dark mode specific adjustments */
:global(.dark) .conference-cover::before {
    opacity: 0.05;
}

:global(.dark) .conference-card.selected .conference-cover::before {
    opacity: 0.15;
}
</style>
