<template>
    <div class="card" v-for="category in categories" :key="category">
        <h1 class="mt-0">{{ t('trends.title') }} - {{ categoryNameMap[category.replace('-', '').replace(' ','').toLowerCase()] }}</h1>
            <Chart type="line" :data="chartDataByCategory[category]" :options="chartOptions" class="min-h-96"/>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePageTitle } from '@/composables/useI18n';
import paperStatis from '@/assets/data/data-statistics.json';

const { t } = useI18n();

// 设置页面标题
usePageTitle('menu.trends');

// 响应式数据
const loading = ref(false);
const loaded = ref(false);
const paperStatisRef = ref(paperStatis);
const chartDataByCategory = ref({});
const categories = ref([]);
const categoryNameMap = computed(()=>({
    'toptier': t('abstract.topTier'),
    'softwareengineering': t('abstract.softwareEngineering'),
    'system': t('abstract.system')
}));
const chartOptions = ref(null);

// 方法
const viewBlocks = (id) => {
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
};

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    // 按category分组
    const groupedData = {};
    
    paperStatisRef.value.overview.forEach(element => {
        const category = element.category;
        if (!groupedData[category]) {
            groupedData[category] = {
                datasets: [],
                years: new Set()
            };
        }
        
        // 收集所有年份
        Object.keys(element.map_data).forEach(year => groupedData[category].years.add(year));
        
        groupedData[category].datasets.push({
            label: element.label,
            map_data: element.map_data,
            fill: element.fill,
            borderColor: documentStyle.getPropertyValue(element.borderColor),
            tension: element.tension
        });
    });
    
    // 为每个category创建chartData
    const chartDataObj = {};
    
    Object.keys(groupedData).forEach(category => {
        const sortedYears = Array.from(groupedData[category].years).sort();
        
        // 为每个dataset转换map_data为data数组
        const datasets = groupedData[category].datasets.map(dataset => {
            const dataValues = sortedYears.map(year => dataset.map_data[year] || null);
            return {
                label: dataset.label,
                data: dataValues,
                fill: dataset.fill,
                borderColor: dataset.borderColor,
                tension: dataset.tension
            };
        });
        chartDataObj[category] = {
            labels: sortedYears,
            datasets: datasets
        };
    });
    
    return { chartDataObj, categories: Object.keys(groupedData) };
};

const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            },
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
};

const onFiltering = (event) => {
    // 这个方法在当前组件中似乎没有被使用，保留以防需要
    console.log('Filtering:', event.filteredValue.length);
};

// 生命周期
onMounted(() => {
    const { chartDataObj, categories: cats } = setChartData();
    chartDataByCategory.value = chartDataObj;
    categories.value = cats;
});

// 暴露给模板的数据和方法
defineExpose({
    viewBlocks,
    onFiltering,
    loading,
    loaded,
    paperStatis: paperStatisRef,
    chartDataByCategory,
    categories,
    chartOptions
});
</script>

<style>
a {
    text-decoration: none;
}
h1 {
    @apply font-semibold text-xl;
}
h2 {
    @apply font-medium;
}
</style>