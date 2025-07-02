<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AppMenuItem from './AppMenuItem.vue';
import { Divider } from 'primevue';

const { t } = useI18n();

const model = computed(() => [
    {
        label: t('menu.main'),
        items: [{ label: t('menu.home'), icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: t('menu.paper'),
        items: [
            { label: t('menu.search'), icon: 'pi pi-fw pi-search', to: '/paper/search', class: 'rotated-icon' },
            { label: t('menu.trends'), icon: 'pi pi-fw pi-chart-line', to: '/paper/trends' },
            { label: t('menu.abstract'), icon: 'pi pi-fw pi-book', to: '/paper/view-abstract' },
            { label: t('menu.submissionTimeline'), icon: 'pi pi-fw pi-file-arrow-up', to: '/paper/submission-timeline' },
        ]
    },
    {
        label: t('menu.reputation'),
        items: [
            { label: t('menu.awards'), icon: 'pi pi-fw pi-crown', to: '/reputation/awards' },
        ]
    },
    {
        label: t('menu.misc'),
        items: [
            { label: t('menu.about'), icon: 'pi pi-fw pi-info-circle', to: '/misc/about', class: 'rotated-icon' },
            // { label: 'I18n Test', icon: 'pi pi-fw pi-globe', to: '/misc/i18n-test', class: 'hidden'},
        ]
    },
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <!-- <li v-if="item.separator" class="menu-separator"></li> -->
            <Divider v-if="item.separator" ></Divider>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
