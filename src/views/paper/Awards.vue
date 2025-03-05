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

// import paperStatis from '@/assets/data/data-statistics.json'
// export default {
//     methods: {
//         viewBlocks(id) {
//             document.querySelector(id).scrollIntoView({
//                 behavior: 'smooth'
//             });
//         },
//         async loadPaperCollection(publication, year) {
//             this.loading = true
//             let fullDataPath
//             if (process.env.NODE_ENV === 'production') {
//                 fullDataPath = 'https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/meta_json/'+publication+' - '+year+'.json'
//             } else {
//                 fullDataPath = '/src/assets/data/meta_json/'+publication+' - '+year+'.json'
//             }
//             await fetch(fullDataPath)
//                 .then((res) => {
//                     if (res.ok) {
//                         return res.json()
//                     }
//                 })
//                 .then(data=>{
//                     this.paperCollection = data
//                 })
//                 .catch(error=>{
//                     console.log(error)
//                 })
//                 .then(()=>{
//                     this.loading = false
//                 })
//         },
//         constructPublicationItems() {
//             let newItems = [
//                 {
//                     label: 'Top Tier',
//                     icon: 'pi pi-shield',
//                     items: [],
//                 },
//                 {
//                     label: 'Software Engineering',
//                     icon: 'pi pi-code',
//                     items: [],
//                 }
//             ]
//
//             for (let publication in this.paperStatis.byPublicationAndYear) {
//                 let targetIndex
//                 if (['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'].includes(publication)) {
//                     targetIndex = 0
//                 } else if (['ISSTA', 'ICSE'].includes(publication)) {
//                     targetIndex = 1
//                 }
//                 const item = this.paperStatis.byPublicationAndYear[publication]
//                 let tempPublicationItem = {
//                     label: publication,
//                     items: [],
//                 }
//                 for (let year in item) {
//                     tempPublicationItem.items.push({
//                         label: year,
//                         command: ()=> {
//                             this.paperSet = `${publication} ${year} - ${item[year]} papers`
//                             this.paperCollection = this.loadPaperCollection(publication, year)
//                         }
//                     })
//                 }
//                 tempPublicationItem.items = tempPublicationItem.items.reverse()
//                 newItems[targetIndex].items.push([tempPublicationItem])
//             }
//             this.items = newItems
//         },
//     },
//     data() {
//         return {
//             paperStatis: paperStatis,
//             paperCollection: [],
//             loading: false,
//             paperSet: 'Please select a publication first.',
//             items: [],
//         }
//     },
//     mounted() {
//         this.constructPublicationItems()
//     }
// };
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
