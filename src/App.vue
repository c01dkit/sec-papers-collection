<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

// 在应用启动时恢复保存的语言设置
onMounted(() => {
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && ['zh', 'en'].includes(savedLocale)) {
    locale.value = savedLocale;
  }
});
</script>

<template>
    <router-view />
</template>

