<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useI18n } from 'vue-i18n';
import { languageEmitter } from '@/locales';
import { ref, onMounted, onUnmounted } from 'vue';
import AppConfigurator from './AppConfigurator.vue';

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const { locale, t } = useI18n();

const availableLocales = [
    { code: 'zh', name: '简体中文', flagClass: 'flag flag-cn' },
    { code: 'en', name: 'English', flagClass: 'flag flag-us' }
];

const showLanguageMenu = ref(false);
const languageMenuRef = ref(null);

function openURL(url) {
    window.open(url, '_blank');
}

function changeLanguage(newLocale) {
    locale.value = newLocale;
    localStorage.setItem('locale', newLocale);
    showLanguageMenu.value = false;
    
    // 发送语言切换事件
    languageEmitter.emit(newLocale);
}

function toggleLanguageMenu() {
    showLanguageMenu.value = !showLanguageMenu.value;
}
function handleClickOutside(event) {
    if (languageMenuRef.value && !languageMenuRef.value.contains(event.target)) {
        showLanguageMenu.value = false;
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div class="layout-topbar shadow-md">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <span class="font-bold"> {{ t('common.title') }}</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <!-- Language Switcher -->
                <div class="relative" ref="languageMenuRef">
                    <button
                        type="button"
                        class="layout-topbar-action"
                        @click="toggleLanguageMenu"
                        :title="t('common.language')"
                    >
                        <i class="pi pi-language"></i>
                    </button>
                    <div
                        v-if="showLanguageMenu"
                        class="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px]"
                        @click.stop
                    >
                        <div
                            v-for="lang in availableLocales"
                            :key="lang.code"
                            class="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            :class="{ 'bg-blue-50 dark:bg-blue-900/20': locale === lang.code }"
                            @click="changeLanguage(lang.code)"
                        >
                            <span :class="lang.flagClass" style="width: 20px; height: 14px; display: inline-block; margin-right: 8px;"></span>
                            <span class="text-sm">{{ lang.name }}</span>
                        </div>
                    </div>
                </div>
                
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode" :title="t('common.theme')">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        :title="t('common.customStyle')"
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button :title="t('common.sourceCode')" type="button" @click="openURL('https://github.com/c01dkit/sec-papers-collection')" class="layout-topbar-action">
                        <i class="pi pi-github"></i>
                        <span>Github</span>
                    </button>
                    <button :title="t('common.feedback')" type="button" @click="openURL('https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link')" class="layout-topbar-action">
                            <i class="pi pi-inbox"></i>
                            <span>Feedback</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
