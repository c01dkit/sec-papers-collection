<template>
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 class="text-6xl font-bold text-primary mb-4">404</h1>
        <p class="text-xl mb-6">{{ t('notFound.message') }}</p>
        <Button :label="t('notFound.backHome')" icon="pi pi-home" @click="router.push('/')" />
    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { usePageTitle } from '@/composables/useI18n';

const { t } = useI18n();
const router = useRouter();
usePageTitle('notFound.title');
</script>
