<template>
    <div class="space-y-6">
        <StatsWidget/>
        <PaperStats/>
<!--        <NoticesWidget/>-->
    </div>
</template>

<script setup>
import { usePageTitle } from '@/composables/useI18n';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
// import NoticesWidget from '@/components/dashboard/NoticesWidget.vue';
import PaperStats from '@/components/dashboard/PaperStats.vue';

// 设置页面标题
usePageTitle('dashboard.title');
</script>

<style scoped>
h1 {
    font-weight: 600;
    font-size: 1.25rem;
}
</style>
