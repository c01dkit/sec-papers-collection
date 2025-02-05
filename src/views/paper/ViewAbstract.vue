<template>
    <div class="card">
        <MegaMenu :model="items" ></MegaMenu>
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

<script>
import paperStatis from '@/assets/data/data-statistics.json'
export default {
    methods: {
        viewBlocks(id) {
            document.querySelector(id).scrollIntoView({
                behavior: 'smooth'
            });
        },
        async loadPaperCollection(publication, year) {
            this.loading = true
            let fullDataPath
            if (process.env.NODE_ENV === 'production') {
                fullDataPath = 'https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/meta_json/'+publication+' - '+year+'.json'
            } else {
                fullDataPath = '/src/assets/data/meta_json/'+publication+' - '+year+'.json'
            }
            await fetch(fullDataPath)
                .then((res) => {
                    if (res.ok) {
                        return res.json()
                    }
                })
                .then(data=>{
                    this.paperCollection = data
                })
                .catch(error=>{
                    console.log(error)
                })
                .then(()=>{
                    this.loading = false
                })
        },
        constructPublicationItems() {
            let newItems = [
                {
                    label: 'Top Tier',
                    icon: 'pi pi-shield',
                    items: [],
                },
                {
                    label: 'Software Engineering',
                    icon: 'pi pi-code',
                    items: [],
                }
            ]

            for (let publication in this.paperStatis.byPublicationAndYear) {
                let targetIndex
                if (['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'].includes(publication)) {
                    targetIndex = 0
                } else if (['ISSTA', 'ICSE'].includes(publication)) {
                    targetIndex = 1
                }
                const item = this.paperStatis.byPublicationAndYear[publication]
                let tempPublicationItem = {
                    label: publication,
                    items: [],
                }
                for (let year in item) {
                    tempPublicationItem.items.push({
                        label: year,
                        command: ()=> {
                            this.paperSet = `${publication} ${year} - ${item[year]} papers`
                            this.paperCollection = this.loadPaperCollection(publication, year)
                        }
                    })
                }
                tempPublicationItem.items = tempPublicationItem.items.reverse()
                newItems[targetIndex].items.push([tempPublicationItem])
            }
            this.items = newItems
        },
    },
    data() {
        return {
            paperStatis: paperStatis,
            paperCollection: [],
            loading: false,
            paperSet: 'Please select a publication first.',
            items: [],
        }
    },
    mounted() {
        this.constructPublicationItems()
    }
};
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
