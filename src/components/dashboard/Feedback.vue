<script setup>
import { ref } from 'vue';
import { Popover } from 'primevue';
const showSponsor = ref(process.env.NODE_ENV === 'production');
const op = ref();
const toggle = (event) =>{
    op.value.toggle(event);
}
</script>

<template>
    <div class="col-span-12 card">
        <h1 class="mb-4">Feedback</h1>
        <Divider/>
        <div class="mb-3 ">
            Hi, there!</div>
        <div class="mb-3">
            It's great to meet you after a long journey, and welcome to the third version of the website! Compared to the previous two versions, the current one adopts their advantages.</div>
        <div class="mb-3">
            Of course, the website is still quite simple at the moment. I plan to make more updates in the future! Since the entire website is under construction by myself, I can easily implement many ideas! I also look forward to your feedback and issues.</div>
        <div class="mb-3">
            If you find this website helpful, you can support me with a cup of coffee ☕ 😃 ... or, <span class="text-primary cursor-pointer" @click="toggle"> a cup of Chinese tea 🍵</span> 😆</div>

        <form v-if="showSponsor" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
            <input type="hidden" name="cmd" value="_s-xclick" />
            <input type="hidden" name="hosted_button_id" value="Y5HS3WCERWAAQ" />
            <input type="hidden" name="currency_code" value="USD" />
            <input type="image" id='pay' src="https://c01dkit.s3.ap-northeast-1.amazonaws.com/assets/images/a_cup_of_coffee_with_1_on_it.png" border="0" name="submit" title="Support Me with a Cup of Coffee💕" alt="立即购买" />
        </form>
        <Popover ref="op">
            <div class="flex flex-row gap-4 w-auto">
                <img src="@/assets/images/ali-sponsor.jpg" />
                <img src="@/assets/images/wec-sponsor.jpg" />
            </div>
        </Popover>

        <div class="mb-3 ">
            Besides, if you have any suggestions, please do not hesitate to let me know! You can post an <a class="text-primary" href="https://github.com/c01dkit/sec-papers-collection/issues" target="_blank">issue in the repository <i class="pi pi-github "></i></a>
            or fill in a<a class="text-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link" target="_blank"> google form <i class="pi pi-google "></i></a> !
        </div>
    </div>
</template>

<style scoped>
h1 {
    @apply font-semibold text-xl ;
}
</style>