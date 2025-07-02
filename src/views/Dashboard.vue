<template>
    <div class="">
        <StatsWidget/>
        <NoticesWidget/>
        <Feedback/>
    </div>
</template>

<script setup>
import { usePageTitle } from '@/composables/useI18n';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import NoticesWidget from '@/components/dashboard/NoticesWidget.vue';
import Feedback from '@/components/dashboard/Feedback.vue';

// 设置页面标题
usePageTitle('dashboard.title');
</script>

<style scoped>
h1 {
    @apply font-semibold text-xl;
}
</style>
