<script setup>
import { useI18n } from 'vue-i18n';
import { languageEmitter } from '@/locales';
import paperStatistics from '@/assets/data/data-statistics.json'
import { GithubService } from '@/service/GithubService.js';
import { onMounted, onUnmounted, ref } from 'vue';

const { t } = useI18n();
const paperStatis = ref(paperStatistics);
const githubData = ref({stars:'loading',forks:' ...', pushed: 'loading ...'});

// 语言切换处理
const handleLanguageChange = () => {
    // 当语言切换时，可以在这里处理特定的逻辑
    // 目前大部分内容会自动更新
};

onMounted(() => {
    if (process.env.NODE_ENV === 'production') {
        GithubService.getRepoStatisticsData().then((res) => {
            const date = new Date(res['pushed_at']);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 月份是0-11，所以+1
            const day = date.getDate().toString().padStart(2, "0");
            const localDateStr = `${year}-${month}-${day}`;
            githubData.value = {
                stars: res['stargazers_count'],
                forks: ' / ' + res['forks_count'],
                pushed: localDateStr,
            }
        })
    }
    languageEmitter.on(handleLanguageChange);
});

onUnmounted(() => {
    languageEmitter.off(handleLanguageChange);
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8 mb-8">
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ t('dashboard.totalPapers') }}</span>
                        <div class="font-medium text-xl">{{ paperStatis.total }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-file text-blue-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ t('dashboard.totalPublications') }}</span>
                        <div class="font-medium text-xl">6</div>
                    </div>
                    <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-book text-indigo-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ t('dashboard.projectStars') }}</span>
                        <div class="font-medium text-xl">{{ githubData.stars }} {{ githubData.forks }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-yellow-100 dark:bg-yellow-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-star text-yellow-500 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ t('dashboard.recentUpdate') }}</span>
                        <span class="text-900 font-medium text-xl"> {{ githubData.pushed }} </span>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-sparkles text-orange-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<style scoped>
h1 {
    @apply font-semibold text-xl ;
}
</style>