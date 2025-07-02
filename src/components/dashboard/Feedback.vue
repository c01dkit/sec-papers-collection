<script setup>
import { ref } from 'vue';
import { Popover } from 'primevue';
import { useI18n } from 'vue-i18n';

const showSponsor = ref(process.env.NODE_ENV === 'production');
const op = ref();
const toggle = (event) =>{
    op.value.toggle(event);
}
const { t, locale } = useI18n();

</script>

<template>
    <div class="col-span-12 card">
        <h1 class="mb-4">{{ t('dashboard.feedback')}}</h1>
        <Divider/>
        <div v-if="locale === 'en'">
        <div class="mb-3 ">
            Hi, there!</div>
        <div class="mb-3">
            It's great to meet you after a long journey, and welcome to the third version of the website! Compared to the previous two versions, the current one adopts their advantages.</div>
        <div class="mb-3">
            Of course, the website is still quite simple at the moment. I plan to make more updates in the future! Since the entire website is under construction by myself, I can easily implement many ideas! I also look forward to your feedback and issues.</div>
        <div class="mb-3">
            If you find this website helpful, you can support me with a cup of coffee ☕ 😃 ... or, <a class="text-primary cursor-pointer" target="_blank" href="https://afdian.com/a/c01dkit"> a cup of Chinese tea 🍵</a> 😆</div>

        <form v-if="showSponsor" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
            <input type="hidden" name="cmd" value="_s-xclick" />
            <input type="hidden" name="hosted_button_id" value="Y5HS3WCERWAAQ" />
            <input type="hidden" name="currency_code" value="USD" />
            <input type="image" id='pay' src="https://c01dkit.s3.ap-northeast-1.amazonaws.com/assets/images/a_cup_of_coffee_with_1_on_it.png" border="0" name="submit" title="Support Me with a Cup of Coffee💕" alt="立即购买" />
        </form>

        <div class="mb-3 ">
            Besides, if you have any suggestions, please do not hesitate to let me know! You can post an <a class="text-primary" href="https://github.com/c01dkit/sec-papers-collection/issues" target="_blank">issue in the repository <i class="pi pi-github "></i></a>
            or fill in a<a class="text-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link" target="_blank"> google form <i class="pi pi-google "></i></a> !
        </div>
        </div>
        <div v-else-if="locale === 'zh'">
            <div class="mb-3 ">
               你好!</div>
            <div class="mb-3">
                很高兴在经历漫长旅程后与你相遇，欢迎来到本网站的第三个版本！与前两个版本相比，当前版本融合了它们的优点。</div>
            <div class="mb-3">
                当然，目前网站还比较简单。未来我计划进行更多更新！由于整个网站都是我个人搭建的，所以我可以很方便地实现许多想法！也期待你的反馈和问题。</div>
            <div class="mb-3">
                如果你觉得这个网站帮到了你，可以悄悄请我喝杯咖啡 ☕ 😃 ... 或者, <a class="text-primary cursor-pointer" target="_blank" href="https://afdian.com/a/c01dkit"> 一杯中国茶！ 🍵</a> 😆</div>

            <form v-if="showSponsor" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                <input type="hidden" name="cmd" value="_s-xclick" />
                <input type="hidden" name="hosted_button_id" value="Y5HS3WCERWAAQ" />
                <input type="hidden" name="currency_code" value="USD" />
                <input type="image" id='pay' src="https://c01dkit.s3.ap-northeast-1.amazonaws.com/assets/images/a_cup_of_coffee_with_1_on_it.png" border="0" name="submit" title="Support Me with a Cup of Coffee💕" alt="立即购买" />
            </form>

            <div class="mb-3 ">
                此外，如果你有任何建议或者意见，请直接告诉我，不要犹豫！你可以在Github上提交一个<a class="text-primary" href="https://github.com/c01dkit/sec-papers-collection/issues" target="_blank">issue<i class="pi pi-github "></i></a>
                或者填写一个<a class="text-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link" target="_blank">谷歌问卷<i class="pi pi-google "></i></a> !
            </div>
        </div>
    </div>
</template>

<style scoped>
h1 {
    @apply font-semibold text-xl ;
}
</style>