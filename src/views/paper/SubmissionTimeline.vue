<script setup>
import { SubmissionTimelineService } from '@/service/SubmissionTimelineService.js';
import { onMounted, ref } from 'vue'
import Stepper from 'primevue/stepper';
import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import StepItem from 'primevue/stepitem';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';
import { useI18n } from 'vue-i18n';

const {locale} = useI18n();
const timeline = ref([]);

onMounted(()=>{
    SubmissionTimelineService.getSubmissionTimeline().then((res)=>{
        timeline.value = res;
    })
})
function findNextStage(cycle) {
    // 获取今天的日期，忽略时间部分
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天的 00:00:00

    // 将日期范围字符串拆分为单个日期，并存储对应的阶段信息
    const expandedDates = [];
    cycle.forEach(item => {
        const { value, stage, date } = item;

        if (date.includes("~")) {
            // 如果日期是范围，用 ~ 分割
            const [startDate, endDate] = date.split("~").map(d => d.trim());
            expandedDates.push({ value, stage, date: normalizeDate(new Date(startDate)) });
            expandedDates.push({ value, stage, date: normalizeDate(new Date(endDate)) });
        } else {
            // 单一日期
            expandedDates.push({ value, stage, date: normalizeDate(new Date(date)) });
        }
    });

    // 按日期排序，找出今天之后的最近日期
    const nextStage = expandedDates
        .filter(item => item.date >= today) // 过滤出今天或更晚的日期
        .sort((a, b) => a.date - b.date)[0]; // 按日期升序排序，取第一个

    // 返回对应的 value，如果没有下一个阶段则返回 null
    return nextStage ? nextStage.value : null;
}

// 将日期归一化为当天的 00:00:00
function normalizeDate(date) {
    date.setHours(0, 0, 0, 0);
    return date;
}

function openURL(url) {
    window.open(url, '_blank');
}
</script>

<template>
    <div class="card">
        <div v-if="locale === 'en'" class="mb-4">
        <p class="mb-4">
            NOTE 1: The following deadlines are manually extracted from websites, rather than crawling. Sometimes, the paper submission due is updated by the official. Therefore, please refer to the official websites for the accuracy.
        </p>
        <p class="mb-4">
            NOTE 2: The approaching deadlines are automatically highlighted with no considerations in the timezone, resulting in a deviation around 1 day.
        </p>
        </div>
        <div v-else-if="locale === 'zh'" class="mb-4">
            <p class="mb-4">
                以下截止日期是手动从各官方网站提取的，并非通过爬虫获取。有时官方会更新论文提交截止时间，因此请以各官方网站为准。临近的截止日期会被自动高亮显示，但未考虑时区因素，可能会有1天左右的误差。
            </p>
        </div>
        <div v-for="publication in timeline" :key="publication.publication">
            <div class="flex flex-row justify-between">
                <h1 class="hover:cursor-pointer w-1/4 mb-4" @click="openURL(publication.url)">{{ publication.publication }} <i class="pi pi-external-link"></i></h1>
                <span class="font-semibold">Timezone: {{publication.timezone}}</span>
            </div>
            <div class="flex flex-row gap-8 pb-2">
                <span title="Conference Period"><i class="pi pi-calendar"></i> {{ publication.date }}</span>
                <span title="Conference Location"><i class="pi pi-map-marker"></i> {{ publication.place }}</span>
                <span title="Last sync time" class="text-gray-400"><i class="pi pi-refresh"></i> {{ publication.update }}</span>
            </div>
            <div class="flex flex-row">
                <div v-for="cycle in publication.cycles" :key="cycle.publication" class="w-1/2">
                    <span class="font-semibold">{{ cycle.name }}</span>
                <Stepper :value="findNextStage(cycle.ddls)" linear>
                    <StepItem v-for="ddlinfo in cycle.ddls" :value="ddlinfo.value" :key="ddlinfo.value">
                        <Step>
                            <div class="flex flex-col text-left">
                                <span>{{ ddlinfo.date }}</span>
                                <span>{{ ddlinfo.stage}}</span>
                            </div>
                        </Step>
                    </StepItem>
                </Stepper>
                </div>

            </div>
            <Divider/>

        </div>

    </div>
</template>

<style scoped>
h1 {
    @apply font-semibold text-xl ;
}
</style>