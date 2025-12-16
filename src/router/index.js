import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';

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
                path: '/reputation/awards',
                component: () => import('@/views/reputation/Awards.vue'),
            },
            {
                path: '/paper/view-abstract',
                component: () => import('@/views/paper/ViewAbstract.vue'),
            },
            {
                path: '/paper/submission-timeline',
                component: () => import('@/views/paper/SubmissionTimeline.vue'),
            },
            {
                path: '/misc/about',
                component: () => import('@/views/misc/About.vue'),
            },
            {
                path: '/misc/settings',
                component: () => import('@/views/misc/Settings.vue'),
            },
            {
                path: '/misc/i18n-test',
                component: () => import('@/views/misc/I18nTest.vue'),
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


