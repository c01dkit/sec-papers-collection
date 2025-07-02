<script setup>
import { useI18n } from 'vue-i18n';
import { languageEmitter } from '@/locales';
import { onMounted, onUnmounted} from 'vue';

const { t, locale } = useI18n();

// // 语言切换处理
const handleLanguageChange = () => {
    // 当语言切换时，可以在这里处理特定的逻辑
    // 目前大部分内容会自动更新
};
// // 语言切换处理
// const handleLanguageChange = (newLocale) => {
//     AboutService.getUpdateTimelineData(newLocale).then((res) => {
//         events.value = res;
//     });
// };

onMounted(() => {
    languageEmitter.on(handleLanguageChange);
});

onUnmounted(() => {
    languageEmitter.off(handleLanguageChange);
});
</script>

<template>
    <div class="col-span-12 card">
        <h1 class="mb-4"> {{ t('dashboard.notices')}}</h1>
        <Divider/>
        <div v-if="locale === 'en'">
            <div class="flex justify-between mb-3">
                <div class="font-medium">NEWS! </div>
                <div>2024-09-01</div>
            </div>
            <div >
                Our new security paper collection is online now.
                You can start your journal from "Search" button in the Side bar.
                This site is still under construction, of course.<br/>
                NOTE1: The website is tested in Chrome, and some items may not be loaded correctly in other browsers.<br/>
                NOTE2: If buttons do not respond, please make a force refresh ( Ctrl + F5 ) to clear the cache.
            </div>
        </div>
        <div v-else-if="locale === 'zh'">
            <div class="flex justify-between mb-3">
                <div class="font-medium">最新消息! </div>
                <div>2024-09-01</div>
            </div>
            <div >
                我们的新安全论文集现已上线。🥰<br/>
                你可以通过侧边栏的“搜索”按钮开始快速检索。
                当然，本网站仍在建设中。请注意：本网站仅在 Chrome 浏览器中测试，其他浏览器可能存在部分内容无法正常加载的情况；如果按钮无响应，请强制刷新页面（Ctrl + F5）以清除缓存。
            </div>
        </div>
    </div>
</template>

<style scoped>
h1 {
    @apply font-semibold text-xl ;
}
</style>