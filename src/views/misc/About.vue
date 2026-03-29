<template>
    <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 lg:col-span-7 card">
            <h1>{{ t('about.timeline') }}</h1>
            <Divider/>
            <div class="mb-5 " >
                <ScrollPanel
                    style="height: calc(100vh - 20rem);"
                    :dt="{ bar: {background: '{primary.color}'}}"
                >
                    <Timeline :value="events" align="alternate" class="customized-timeline mb-2">
                        <template #content="slotProps">
                            <Card class="mt-2">
                                <template #title>
                                    {{ slotProps.item.status }}
                                </template>
                                <template #subtitle>
                                    {{ slotProps.item.date }}
                                </template>
                                <template #content>
                                    <p v-for="(item, index) in slotProps.item.content" :key="index" class="mt-0 mb-2">
                                        {{ item }}
                                    </p>
                                </template>
                            </Card>
                        </template>
                    </Timeline>
                </ScrollPanel>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-5 flex flex-col gap-4" style="height: calc(100vh - 11rem);">
            <!-- 反馈内容区域 - 上半部分 -->
            <div class="card flex-1 min-h-0 mb-0">
                <h1>{{ t('dashboard.feedback') }}</h1>
                <Divider/>
                <div class="feedback-content">
                    <div v-if="locale === 'en'">
                        <div class="mb-3">
                            Hi, there!</div>
                        <div class="mb-3">
                            It's great to meet you after a long journey, and welcome to the third version of the website! Compared to the previous two versions, the current one adopts their advantages.</div>
                        <div class="mb-3">
                            Of course, the website is still quite simple at the moment. Since the entire website is under construction by myself, I can easily implement many ideas! I also look forward to your feedback and issues.</div>
                        <div class="mb-3">
                            If you find this website helpful, you can support me with a cup of coffee ☕ 😃 ... or, <a class="text-primary cursor-pointer" target="_blank" href="https://afdian.com/a/c01dkit"> a cup of Chinese tea 🍵</a> 😆</div>

                        <form v-if="showSponsor" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                            <input type="hidden" name="cmd" value="_s-xclick" />
                            <input type="hidden" name="hosted_button_id" value="Y5HS3WCERWAAQ" />
                            <input type="hidden" name="currency_code" value="USD" />
                            <input type="image" id='pay' src="https://c01dkit.s3.ap-northeast-1.amazonaws.com/assets/images/a_cup_of_coffee_with_1_on_it.png" border="0" name="submit" title="Support Me with a Cup of Coffee💕" alt="立即购买" />
                        </form>

                        <div class="mb-3">
                            Besides, if you have any suggestions, please do not hesitate to let me know! You can post an <a class="text-primary" href="https://github.com/c01dkit/sec-papers-collection/issues" target="_blank">issue in the repository <i class="pi pi-github "></i></a>
                            or fill in a<a class="text-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link" target="_blank"> google form <i class="pi pi-google "></i></a> !
                        </div>
                    </div>
                    <div v-else-if="locale === 'zh'">
                        <div class="mb-3">
                           你好!</div>
                        <div class="mb-3">
                            很高兴在经历漫长旅程后与你相遇，欢迎来到本网站的第三个版本！与前两个版本相比，当前版本融合了它们的优点。</div>
                        <div class="mb-3">
                            目前网站支持按标题搜索安全四大、软工与系统顶会论文，以及摘要阅读、最佳论文等奖项检索、四大投稿时间线等。未来计划进行更多更新。</div>
                        <div class="mb-3">
                            如果你觉得这个网站帮到了你，可以悄悄请我喝杯咖啡 ☕ 😃 ... </div>
<!--                        或者, <a class="text-primary cursor-pointer" target="_blank" href="https://afdian.com/a/c01dkit"> 一杯中国茶！ 🍵</a> 😆 （爱发电跑路了）-->
                        <form v-if="showSponsor" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                            <input type="hidden" name="cmd" value="_s-xclick" />
                            <input type="hidden" name="hosted_button_id" value="Y5HS3WCERWAAQ" />
                            <input type="hidden" name="currency_code" value="USD" />
                            <input type="image" id='pay' src="https://c01dkit.s3.ap-northeast-1.amazonaws.com/assets/images/a_cup_of_coffee_with_1_on_it.png" border="0" name="submit" title="Support Me with a Cup of Coffee💕" alt="立即购买" />
                        </form>

                        <div class="mb-3">
                            此外，如果你有任何建议或者意见，请直接告诉我，不要犹豫！你可以在Github上提交一个<a class="text-primary" href="https://github.com/c01dkit/sec-papers-collection/issues" target="_blank">issue<i class="pi pi-github "></i></a>
                            或者填写一个<a class="text-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link" target="_blank">谷歌问卷<i class="pi pi-google "></i></a> !
                        </div>
                    </div>
                </div>
            </div>

            <!-- 赞助者区域 - 下半部分 -->
            <div class="card flex-1 min-h-0">
                <h1>{{ t('about.sponsors') }} <i class="pi pi-heart"></i></h1>
                <Divider/>
                <div class="flex flex-col gap-3">
                    <div v-for="item in sponsors" :key="item.date" class="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center" :title="item.comment">
                        <div class="text-left truncate">{{ item.name }}</div>
                        <div class="text-left">{{ item.amount}} </div>
                        <div class="text-right">{{ item.date}} </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { AboutService } from '@/service/AboutService.js';
import { useI18n } from 'vue-i18n';
import { usePageTitle } from '@/composables/useI18n';
import { languageEmitter } from '@/locales';
import { onMounted, ref, onUnmounted } from 'vue';

const { t, locale } = useI18n();
const events = ref([])
const sponsors = ref([])
const showSponsor = ref(process.env.NODE_ENV === 'production');

// 设置页面标题
usePageTitle('menu.about');

// 加载数据的函数
const loadData = () => {
    AboutService.getUpdateTimelineData(locale.value).then((res) => {
        events.value = res;
    });
    AboutService.getSponsorData().then((res) => {
        sponsors.value = res;
    });
};

// 语言切换处理
const handleLanguageChange = (newLocale) => {
    AboutService.getUpdateTimelineData(newLocale).then((res) => {
        events.value = res;
    });
};

onMounted(() => {
    loadData();
    languageEmitter.on(handleLanguageChange);
});

onUnmounted(() => {
    languageEmitter.off(handleLanguageChange);
});

</script>

<style scoped>
a {
    text-decoration: none;
}

.feedback-content {
    height: 100%;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.feedback-content::-webkit-scrollbar {
    width: 4px;
}

.feedback-content::-webkit-scrollbar-track {
    background: transparent;
}

.feedback-content::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 2px;
}

.p-card .p-card-content {
    padding: 0;
}

h1 {
    font-weight: 600;
    font-size: 1.25rem;
}

@media screen and (max-width: 960px) {
    :deep(.customized-timeline) .p-timeline-event:nth-child(even) {
        flex-direction: row;
    }

    :deep(.customized-timeline) .p-timeline-event:nth-child(even) .p-timeline-event-content {
        text-align: left;
    }

    :deep(.customized-timeline) .p-timeline-event-opposite {
        flex: 0;
    }
}

@media screen and (max-width: 1024px) {
    .grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .col-span-12.lg\\:col-span-5 {
        height: auto !important;
        min-height: 60vh;
    }
    
    .col-span-12.lg\\:col-span-5 .card {
        min-height: 300px;
    }
}
</style>
