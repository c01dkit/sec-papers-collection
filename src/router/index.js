import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
const baseURL = 'https://server.sabisu.tech';

const routes = [
    {
        path: '/',
        exact: true,
        component: AppLayout,
        // component: () => import('@/components/Home.vue')
        children: [
            {
                path: '/',
                component: ()=>import('@/views/Dashboard.vue'),
            },
            {
                path: '/paper/search',
                component: () => import('@/views/paper/Search.vue'),
            },
            {
                path: '/paper/trends',
                component: () => import('@/views/paper/Trends.vue'),
            },
            {
                path: '/paper/view-abstract',
                component: () => import('@/views/paper/ViewAbstract.vue'),
            },
            {
                path: '/paper/timeline',
                component: () => import('@/views/paper/Timeline.vue'),
            },
            {
                path: '/misc/about',
                component: () => import('@/views/misc/About.vue'),
            },
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        else return { left: 0, top: 0 };
    }
});

export default router;


