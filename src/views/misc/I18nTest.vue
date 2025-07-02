<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-4">{{ t('test.title') }}</h1>
      <p class="text-gray-600 dark:text-gray-300">{{ t('test.description') }}</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-3">{{ t('test.currentLanguage') }}</h2>
        <p class="mb-2">
          <strong>{{ t('test.locale') }}:</strong> {{ locale }}
        </p>
        <p class="mb-2">
          <strong>{{ t('test.direction') }}:</strong> {{ getTextDirection(locale) }}
        </p>
        <p>
          <strong>{{ t('test.currentTime') }}:</strong> {{ formatDate(new Date(), locale) }}
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-3">{{ t('test.samples') }}</h2>
        <ul class="space-y-2">
          <li><strong>{{ t('test.dashboard') }}:</strong> {{ t('dashboard.title') }}</li>
          <li><strong>{{ t('test.papers') }}:</strong> {{ t('papers.title') }}</li>
          <li><strong>{{ t('test.search') }}:</strong> {{ t('common.search') }}</li>
          <li><strong>{{ t('test.loading') }}:</strong> {{ t('common.loading') }}</li>
        </ul>
      </div>
    </div>
    
    <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-2">{{ t('test.instructions') }}</h3>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        {{ t('test.instructionsText') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { formatDate, getTextDirection } from '@/composables/useI18n';

const { t, locale } = useI18n();
</script>
