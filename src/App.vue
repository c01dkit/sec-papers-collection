<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { applySettingsToRuntime, checkDbExists, defaultSettings, loadSettings } from '@/service/SettingsService';

const { locale } = useI18n();

// 在应用启动时恢复保存的语言设置 & 应用本地配置
onMounted(async () => {
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && ['zh', 'en'].includes(savedLocale)) {
    locale.value = savedLocale;
  }

  try {
    const exists = await checkDbExists();
    if (exists) {
      const stored = await loadSettings();
      if (stored) {
        applySettingsToRuntime(stored, locale);
        return;
      }
    }
    applySettingsToRuntime(defaultSettings(), locale);
  } catch (err) {
    console.warn('[App] settings init failed', err);
  }
});
</script>

<template>
    <router-view />
</template>

