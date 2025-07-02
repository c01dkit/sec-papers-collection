<template>
    <div class="card">
        <accordion multiple>
            <accordion-panel v-for="(item, index) in awards" :key="index" :value="item.publication">
                <accordion-header> {{ item.publication }}</accordion-header>
                <accordion-content>
                    <div v-for="(award, i) in item.awards" :key="i" class="mb-4">
                        <div v-for="(paper, j) in award.papers" :key="j" class="mb-4">
                            <h3 class="font-semibold pb-2">{{ paper.title }}</h3>
                            <div class="flex items-center space-x-2">
                                <badge :value="award.name" class="mr-2" style="color: white;"></badge>
                                <badge :value="paper.year" style="color: white;"></badge>
                            </div>
                            <divider/>
                        </div>
                    </div>
                </accordion-content>
            </accordion-panel>
        </accordion>
    </div>
</template>

<script setup>
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

import { AwardService } from '@/service/AwardService.js';
import { onMounted, ref } from 'vue';

const awards = ref([])

onMounted(()=> {
    AwardService.getAward().then((res) => {
        awards.value = res;
    });
})

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
