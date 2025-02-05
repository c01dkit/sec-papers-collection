<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';
import { Divider } from 'primevue';

const model = ref([
    {
        label: 'Main',
        items: [{ label: 'Home', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: 'Paper',
        items: [
            { label: 'Search', icon: 'pi pi-fw pi-search', to: '/paper/search', class: 'rotated-icon' },
            { label: 'Trends', icon: 'pi pi-fw pi-chart-line', to: '/paper/trends' },
            { label: 'View Abstract', icon: 'pi pi-fw pi-book', to: '/paper/view-abstract' },
            { label: 'Submission Timeline', icon: 'pi pi-fw pi-file-arrow-up', to: '/paper/submission-timeline' },
        ]
    },
    {
        label: 'Misc',
        items: [
            { label: 'About', icon: 'pi pi-fw pi-info-circle', to: '/misc/about', class: 'rotated-icon' },
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
