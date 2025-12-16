<template>
    <div class="card">
        <MegaMenu :model="items" />
        <div class="p-4">
            <div class="text-xl text-900 font-medium my-2">{{ paperSet }}</div>
            <ScrollTop  v-animateonscroll="{ enterClass: 'animate-fadeinleft', leaveClass: 'animate-fadeout'}" class="animate-duration-1000 animate-ease-in-out"/>
            <ul class="list-none p-0 mt-4">
                <li  v-for="item in paperCollection" :key="item.id" >
                    <div class="font-medium text-900 mb-2 mt-2">
                        <a class="text-primary" :href="item.paper" target="_blank">{{ item.title }}</a></div>
                    <div class="line-height-3 text-600" >{{ item.abstract }}</div>
                    <Divider/>
                </li>
            </ul>
            <ProgressBar mode="indeterminate" style="height: 6px" v-if="loading"></ProgressBar>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePageTitle } from '@/composables/useI18n';
import { languageEmitter } from '@/locales';
import paperStatis from '@/assets/data/data-statistics.json';

const { t } = useI18n();

// 设置页面标题
usePageTitle('menu.abstract');

// 响应式数据
const paperStatisRef = ref(paperStatis);
const paperCollection = ref([]);
const loading = ref(false);
const paperSet = ref('');
const items = ref([]);

// 初始化默认文本
const initDefaultText = () => {
    paperSet.value = t('abstract.selectPublication');
};

// 方法
const viewBlocks = (id) => {
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
};

const loadPaperCollection = async (publication, year) => {
    loading.value = true;
    let fullDataPath;
    if (process.env.NODE_ENV === 'production') {
        fullDataPath = 'https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/meta_json/'+publication+' - '+year+'.json';
    } else {
        fullDataPath = '/src/assets/data/meta_json/'+publication+' - '+year+'.json';
    }
    
    try {
        const res = await fetch(fullDataPath);
        if (res.ok) {
            const data = await res.json();
            paperCollection.value = data;
        }
    } catch (error) {
        console.log(error);
    } finally {
        loading.value = false;
    }
};

const constructPublicationItems = () => {
    let newItems = [
        {
            label: t('abstract.topTier'),
            icon: 'pi pi-shield',
            items: [],
        },
        {
            label: t('abstract.softwareEngineering'),
            icon: 'pi pi-code',
            items: [],
        }
    ];

    for (let publication in paperStatisRef.value.byPublicationAndYear) {
        let targetIndex;
        if (['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'].includes(publication)) {
            targetIndex = 0;
        } else if (['ISSTA', 'ICSE'].includes(publication)) {
            targetIndex = 1;
        }
        const item = paperStatisRef.value.byPublicationAndYear[publication];
        let tempPublicationItem = {
            label: publication,
            items: [],
        };
        for (let year in item) {
            tempPublicationItem.items.push({
                label: year,
                command: () => {
                    paperSet.value = `${publication} ${year} - ${item[year]} ${t('abstract.papers')}`;
                    loadPaperCollection(publication, year);
                }
            });
        }
        tempPublicationItem.items = tempPublicationItem.items.reverse();
        newItems[targetIndex].items.push([tempPublicationItem]);
    }
    items.value = newItems;
    console.log(items.value)
};

// 语言切换处理
const handleLanguageChange = () => {
    initDefaultText();
    constructPublicationItems();
};

// 生命周期
onMounted(() => {
    initDefaultText();
    constructPublicationItems();
    languageEmitter.on(handleLanguageChange);
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
    languageEmitter.off(handleLanguageChange);
});

// 暴露给模板的数据和方法
defineExpose({
    viewBlocks,
    loadPaperCollection,
    constructPublicationItems,
    paperStatis: paperStatisRef,
    paperCollection,
    loading,
    paperSet,
    items
});
</script>

<style>
a {
    text-decoration: none;
}

@media screen and (max-width: 960px) {
    ::v-deep(.customized-timeline) {
        .p-timeline-event:nth-child(even) {
            flex-direction: row;

            .p-timeline-event-content {
                text-align: left;
            }
        }

        .p-timeline-event-opposite {
            flex: 0;
        }
    }
}

.p-card .p-card-content {
    padding: 0;
}
@keyframes slidedown-icon {
    0% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(20px);
    }

    100% {
        transform: translateY(0);
    }
}

.slidedown-icon {
    animation: slidedown-icon;
    animation-duration: 3s;
    animation-iteration-count: infinite;
}
</style>
