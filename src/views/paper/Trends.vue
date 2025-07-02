<template>
    <div class="card">
        <h1 class="mt-0">{{ t('trends.title') }}</h1>
        <Chart type="line" :data="chartData" :options="chartOptions" class="min-h-96"/>
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
const chartData = ref(null);
const chartOptions = ref(null);

// 方法
const viewBlocks = (id) => {
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
};

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    paperStatisRef.value.overview.forEach(element => {
        element.borderColor = documentStyle.getPropertyValue(element.borderColor);
    });
    
    return {
        labels: paperStatisRef.value.years,
        datasets: paperStatisRef.value.overview,
    };
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
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

// 暴露给模板的数据和方法
defineExpose({
    viewBlocks,
    onFiltering,
    loading,
    loaded,
    paperStatis: paperStatisRef,
    chartData,
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
</style>