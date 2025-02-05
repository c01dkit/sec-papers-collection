<template>
    <div class="card">
        <h1 class="mt-0">Accepted Papers</h1>
        <Chart type="line" :data="chartData" :options="chartOptions" class="min-h-96"/>
    </div>
</template>

<script>
import paperStatis from '@/assets/data/data-statistics.json'
import io from 'socket.io-client'
export default {
    methods: {
        viewBlocks(id) {
            document.querySelector(id).scrollIntoView({
                behavior: 'smooth'
            });
        },
        setChartData() {
            const documentStyle = getComputedStyle(document.documentElement);
            this.paperStatis.overview.forEach(element => {element.borderColor = documentStyle.getPropertyValue(element.borderColor)})
            return {
                labels: this.paperStatis.years,
                datasets: this.paperStatis.overview,
            };
        },
        setChartOptions() {
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
        },

        onFiltering(event) {
            this.paperNum = event.filteredValue.length
        },
    },

    data() {
        return {
            loading: false,
            loaded: false,
            paperStatis: paperStatis,
            chartData: null,
            chartOptions: null,
            // ws: io('https://google.c01dkit.com:8090', { transports: ['websocket'] })
        }
    },
    created() {
    },
    mounted() {
        this.chartData = this.setChartData()
        this.chartOptions = this.setChartOptions()
    },

};
</script>

<style >
a {
    text-decoration: none;
}
h1 {
    @apply font-semibold text-xl;
}
</style>
