<template>
    <div class="grid grid-cols-12 gap-4">
        <div class="col-span-9 card">
            <h1>Timeline</h1>
            <Divider/>
            <div class="mb-5 " >
                <ScrollPanel
                    style="height: calc(100vh - 20rem);"
                    :dt="{ bar: {background: '{primary.color}'}}"
                >
                    <Timeline :value="events" align="alternate" class="customized-timeline mb-2">
                        <template #content="slotProps">
                            <Card class="mt-2">
                                <template #title>
                                    {{ slotProps.item.status }}
                                </template>
                                <template #subtitle>
                                    {{ slotProps.item.date }}
                                </template>
                                <template #content>
                                    <p v-for="(item, index) in slotProps.item.content" :key="index" class="mt-0 mb-2">
                                        {{ item }}
                                    </p>
                                </template>
                            </Card>
                        </template>
                    </Timeline>
                </ScrollPanel>
            </div>
        </div>

        <div class="col-span-3 card "  style="height: calc(100vh - 11rem);">
            <h1>Sponsors <i class="pi pi-heart"></i></h1>
            <Divider/>
            <div class="flex flex-col gap-3">
            <div v-for="item in sponsors" :key="item.date" class="flex flex-row justify-between">
                <div>{{ item.name }}</div>
                <div>{{ item.amount}} </div>
                <div>{{ item.date}} </div>
            </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { AboutService } from '@/service/AboutService.js';
import { onMounted, ref } from 'vue';

const events = ref([])
const sponsors = ref([])

onMounted(()=> {
    AboutService.getUpdateTimelineData().then((res) => {
        events.value = res;
    });
    AboutService.getSponsorData().then((res) => {
        sponsors.value = res;
    });
})

</script>

<style >
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
h1 {
    @apply font-semibold text-xl;
}
</style>
