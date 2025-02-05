<template>
    <div class="">
        <StatsWidget/>
        <NoticesWidget/>
        <Feedback/>
    </div>
</template>

<script setup>
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import NoticesWidget from '@/components/dashboard/NoticesWidget.vue';
import Feedback from '@/components/dashboard/Feedback.vue';
</script>

<style scoped>
h1 {
    @apply font-semibold text-xl;
}
</style>
