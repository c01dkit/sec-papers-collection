import{B as S,Z as v,a as E,b as O,g as w,$ as T,c as z,f as K,i as D,C as I,d as j,s as A,U as B,R as P,e as R,r as H,h as N,o as l,j as V,w as y,k as u,T as q,m,l as U,n as p,p as _,q as L,_ as Z,t as o,u as b,v as k,x as f,y as F,z as M,A as Q}from"./index-580c222f.js";import{O as d,F as Y,s as G}from"./index-0deaead3.js";import{p as J}from"./data-statistics-2713a3e5.js";var W=function(e){var n=e.dt;return`
.p-popover {
    margin-top: `.concat(n("popover.gutter"),`;
    background: `).concat(n("popover.background"),`;
    color: `).concat(n("popover.color"),`;
    border: 1px solid `).concat(n("popover.border.color"),`;
    border-radius: `).concat(n("popover.border.radius"),`;
    box-shadow: `).concat(n("popover.shadow"),`;
}

.p-popover-content {
    padding: `).concat(n("popover.content.padding"),`;
}

.p-popover-flipped {
    margin-top: calc(`).concat(n("popover.gutter"),` * -1);
    margin-bottom: `).concat(n("popover.gutter"),`;
}

.p-popover-enter-from {
    opacity: 0;
    transform: scaleY(0.8);
}

.p-popover-leave-to {
    opacity: 0;
}

.p-popover-enter-active {
    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);
}

.p-popover-leave-active {
    transition: opacity 0.1s linear;
}

.p-popover:after,
.p-popover:before {
    bottom: 100%;
    left: calc(`).concat(n("popover.arrow.offset")," + ").concat(n("popover.arrow.left"),`);
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
}

.p-popover:after {
    border-width: calc(`).concat(n("popover.gutter"),` - 2px);
    margin-left: calc(-1 * (`).concat(n("popover.gutter"),` - 2px));
    border-style: solid;
    border-color: transparent;
    border-bottom-color: `).concat(n("popover.background"),`;
}

.p-popover:before {
    border-width: `).concat(n("popover.gutter"),`;
    margin-left: calc(-1 * `).concat(n("popover.gutter"),`);
    border-style: solid;
    border-color: transparent;
    border-bottom-color: `).concat(n("popover.border.color"),`;
}

.p-popover-flipped:after,
.p-popover-flipped:before {
    bottom: auto;
    top: 100%;
}

.p-popover.p-popover-flipped:after {
    border-bottom-color: transparent;
    border-top-color: `).concat(n("popover.background"),`;
}

.p-popover.p-popover-flipped:before {
    border-bottom-color: transparent;
    border-top-color: `).concat(n("popover.border.color"),`;
}
`)},X={root:"p-popover p-component",content:"p-popover-content"},$=S.extend({name:"popover",theme:W,classes:X}),ee={name:"BasePopover",extends:R,props:{dismissable:{type:Boolean,default:!0},appendTo:{type:[String,Object],default:"body"},baseZIndex:{type:Number,default:0},autoZIndex:{type:Boolean,default:!0},breakpoints:{type:Object,default:null},closeOnEscape:{type:Boolean,default:!0}},style:$,provide:function(){return{$pcPopover:this,$parentInstance:this}}},x={name:"Popover",extends:ee,inheritAttrs:!1,emits:["show","hide"],data:function(){return{visible:!1}},watch:{dismissable:{immediate:!0,handler:function(e){e?this.bindOutsideClickListener():this.unbindOutsideClickListener()}}},selfClick:!1,target:null,eventTarget:null,outsideClickListener:null,scrollHandler:null,resizeListener:null,container:null,styleElement:null,overlayEventListener:null,documentKeydownListener:null,beforeUnmount:function(){this.dismissable&&this.unbindOutsideClickListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.destroyStyle(),this.unbindResizeListener(),this.target=null,this.container&&this.autoZIndex&&v.clear(this.container),this.overlayEventListener&&(d.off("overlay-click",this.overlayEventListener),this.overlayEventListener=null),this.container=null},mounted:function(){this.breakpoints&&this.createStyle()},methods:{toggle:function(e,n){this.visible?this.hide():this.show(e,n)},show:function(e,n){this.visible=!0,this.eventTarget=e.currentTarget,this.target=n||e.currentTarget},hide:function(){this.visible=!1},onContentClick:function(){this.selfClick=!0},onEnter:function(e){var n=this;this.container.setAttribute(this.attributeSelector,""),E(e,{position:"absolute",top:"0",left:"0"}),this.alignOverlay(),this.dismissable&&this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.autoZIndex&&v.set("overlay",e,this.baseZIndex+this.$primevue.config.zIndex.overlay),this.overlayEventListener=function(r){n.container.contains(r.target)&&(n.selfClick=!0)},this.focus(),d.on("overlay-click",this.overlayEventListener),this.$emit("show"),this.closeOnEscape&&this.bindDocumentKeyDownListener()},onLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.unbindDocumentKeyDownListener(),d.off("overlay-click",this.overlayEventListener),this.overlayEventListener=null,this.$emit("hide")},onAfterLeave:function(e){this.autoZIndex&&v.clear(e)},alignOverlay:function(){O(this.container,this.target,!1);var e=w(this.container),n=w(this.target),r=0;e.left<n.left&&(r=n.left-e.left),this.container.style.setProperty(T("popover.arrow.left").name,"".concat(r,"px")),e.top<n.top&&(this.container.setAttribute("data-p-popover-flipped","true"),!this.isUnstyled&&z(this.container,"p-popover-flipped"))},onContentKeydown:function(e){e.code==="Escape"&&this.closeOnEscape&&(this.hide(),K(this.target))},onButtonKeydown:function(e){switch(e.code){case"ArrowDown":case"ArrowUp":case"ArrowLeft":case"ArrowRight":e.preventDefault()}},focus:function(){var e=this.container.querySelector("[autofocus]");e&&e.focus()},onKeyDown:function(e){e.code==="Escape"&&this.closeOnEscape&&(this.visible=!1)},bindDocumentKeyDownListener:function(){this.documentKeydownListener||(this.documentKeydownListener=this.onKeyDown.bind(this),window.document.addEventListener("keydown",this.documentKeydownListener))},unbindDocumentKeyDownListener:function(){this.documentKeydownListener&&(window.document.removeEventListener("keydown",this.documentKeydownListener),this.documentKeydownListener=null)},bindOutsideClickListener:function(){var e=this;!this.outsideClickListener&&D()&&(this.outsideClickListener=function(n){e.visible&&!e.selfClick&&!e.isTargetClicked(n)&&(e.visible=!1),e.selfClick=!1},document.addEventListener("click",this.outsideClickListener))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener),this.outsideClickListener=null,this.selfClick=!1)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new I(this.target,function(){e.visible&&(e.visible=!1)})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.visible&&!j()&&(e.visible=!1)},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},isTargetClicked:function(e){return this.eventTarget&&(this.eventTarget===e.target||this.eventTarget.contains(e.target))},containerRef:function(e){this.container=e},createStyle:function(){if(!this.styleElement&&!this.isUnstyled){var e;this.styleElement=document.createElement("style"),this.styleElement.type="text/css",A(this.styleElement,"nonce",(e=this.$primevue)===null||e===void 0||(e=e.config)===null||e===void 0||(e=e.csp)===null||e===void 0?void 0:e.nonce),document.head.appendChild(this.styleElement);var n="";for(var r in this.breakpoints)n+=`
                        @media screen and (max-width: `.concat(r,`) {
                            .p-popover[`).concat(this.attributeSelector,`] {
                                width: `).concat(this.breakpoints[r],` !important;
                            }
                        }
                    `);this.styleElement.innerHTML=n}},destroyStyle:function(){this.styleElement&&(document.head.removeChild(this.styleElement),this.styleElement=null)},onOverlayClick:function(e){d.emit("overlay-click",{originalEvent:e,target:this.target})}},computed:{attributeSelector:function(){return B()}},directives:{focustrap:Y,ripple:P},components:{Portal:G}},te=["aria-modal"];function ne(t,e,n,r,a,i){var c=H("Portal"),h=N("focustrap");return l(),V(c,{appendTo:t.appendTo},{default:y(function(){return[u(q,m({name:"p-popover",onEnter:i.onEnter,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave},t.ptm("transition")),{default:y(function(){return[a.visible?U((l(),p("div",m({key:0,ref:i.containerRef,role:"dialog","aria-modal":a.visible,onClick:e[3]||(e[3]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),class:t.cx("root")},t.ptmi("root")),[t.$slots.container?_(t.$slots,"container",{key:0,closeCallback:i.hide,keydownCallback:function(C){return i.onButtonKeydown(C)}}):(l(),p("div",m({key:1,class:t.cx("content"),onClick:e[0]||(e[0]=function(){return i.onContentClick&&i.onContentClick.apply(i,arguments)}),onMousedown:e[1]||(e[1]=function(){return i.onContentClick&&i.onContentClick.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onContentKeydown&&i.onContentKeydown.apply(i,arguments)})},t.ptm("content")),[_(t.$slots,"default")],16))],16,te)),[[h]]):L("",!0)]}),_:3},16,["onEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])}x.render=ne;const oe="/assets/ali-sponsor-fa785a56.jpg",ie="/assets/wec-sponsor-ce5c3272.jpg";const se={methods:{viewBlocks(t){document.querySelector(t).scrollIntoView({behavior:"smooth"})},toggle(t){this.$refs.op.toggle(t)},async fetchGithubStats(){let t=await fetch("https://api.github.com/repos/c01dkit/sec-papers-collection");t=await t.json(),this.github.stars=t.stargazers_count,this.github.forks=" / "+t.forks_count,this.github.watches=" / "+t.watchers_count}},data(){return{showSponsor:!0,paperStatis:J,github:{stars:"loading",forks:"...",watches:null}}},mounted(){this.fetchGithubStats()}},s=t=>(F("data-v-e452914f"),t=t(),M(),t),re={class:"p-5"},ae={class:"grid"},le={class:"col-12 lg:col-6 xl:col-3"},ce={class:"surface-card shadow-2 p-3 border-1 border-50 border-round"},de={class:"flex justify-content-between mb-3"},ue=s(()=>o("span",{class:"block text-500 font-medium mb-3"},"Total Papers",-1)),pe={class:"text-900 font-medium text-xl"},fe=s(()=>o("div",{class:"flex align-items-center justify-content-center bg-blue-100 border-round",style:{width:"2.5rem",height:"2.5rem"}},[o("i",{class:"pi pi-file text-blue-500 text-xl"})],-1)),he=f('<div class="col-12 lg:col-6 xl:col-3" data-v-e452914f><div class="surface-card shadow-2 p-3 border-1 border-50 border-round" data-v-e452914f><div class="flex justify-content-between mb-3" data-v-e452914f><div data-v-e452914f><span class="block text-500 font-medium mb-3" data-v-e452914f>Total Publications</span><div class="text-900 font-medium text-xl" data-v-e452914f>6</div></div><div class="flex align-items-center justify-content-center bg-indigo-100 border-round" style="width:2.5rem;height:2.5rem;" data-v-e452914f><i class="pi pi-book text-indigo-500 text-xl" data-v-e452914f></i></div></div></div></div>',1),ve={class:"hidden lg:block col-12 md:col-6 xl:col-3"},me={class:"surface-card shadow-2 p-3 border-1 border-50 border-round"},be={class:"flex justify-content-between mb-3"},ye=s(()=>o("span",{class:"block text-500 font-medium mb-3"},"Project Stars / Forks ",-1)),ge={class:"text-900 font-medium text-xl"},we=s(()=>o("div",{class:"flex align-items-center justify-content-center bg-yellow-100 border-round",style:{width:"2.5rem",height:"2.5rem"}},[o("i",{class:"pi pi-star text-yellow-500 text-xl"})],-1)),_e=f('<div class="hidden lg:block col-12 md:col-6 xl:col-3" data-v-e452914f><div class="surface-card shadow-2 p-3 border-1 border-50 border-round" data-v-e452914f><div class="flex justify-content-between mb-3" data-v-e452914f><div data-v-e452914f><span class="block text-500 font-medium mb-3" data-v-e452914f>Site Visitors / Visits</span><span id="busuanzi_value_site_uv" class="text-900 font-medium text-xl" data-v-e452914f>😃</span><span class="text-900 font-medium text-xl" data-v-e452914f> / </span><span id="busuanzi_value_site_pv" class="text-900 font-medium text-xl" data-v-e452914f>😃</span></div><div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width:2.5rem;height:2.5rem;" data-v-e452914f><i class="pi pi-user text-orange-500 text-xl" data-v-e452914f></i></div></div></div></div>',1),ke={class:"col-12"},Le={class:"surface-card shadow-2 border-round p-4"},xe=s(()=>o("h1",{class:"mt-0"},"Announcements",-1)),Ce=f('<ul class="list-none p-0 m-0" data-v-e452914f><li class="pb-3 border-bottom-1 surface-border" data-v-e452914f><div class="flex justify-content-between mb-3" data-v-e452914f><div class="font-medium text-900 mb-2" data-v-e452914f>NEWS! </div><div class="text-500 ml-3" data-v-e452914f>2024-09-01</div></div><div class="line-height-3 text-600" data-v-e452914f> My new security paper collection is online now. You can start your journal from &quot;Search&quot; button in the Side bar. This site is still under construction, of course. NOTE: The website is tested in Chrome, and some items may not be loaded correctly in other browsers. </div></li></ul>',1),Se={class:"col-12"},Ee={class:"surface-card shadow-2 border-round p-4"},Oe=s(()=>o("h1",{class:"mt-0"},"Feedback",-1)),Te=s(()=>o("div",{class:"mb-3 line-height-4"}," Hi, there!",-1)),ze=s(()=>o("div",{class:"mb-3 line-height-4"}," It's great to meet you after a long journey, and welcome to the second version of the website! Compared to the first version, I've learned Vue3 and used the PrimeVue front-end framework for the development. I also purchased the expensive PrimeVue Blocks for learning and the result is still quite close to my expectations. ",-1)),Ke=s(()=>o("div",{class:"mb-3 line-height-4"}," Of course, the website is still quite simple at the moment, with only a simple table function implemented. I plan to make more updates in the future! Since the entire website is developed independently by me, I can easily implement many ideas! I also look forward to your feedback and issues.",-1)),De={class:"mb-3 line-height-4"},Ie={key:0,action:"https://www.paypal.com/cgi-bin/webscr",method:"post",target:"_top"},je=s(()=>o("input",{type:"hidden",name:"cmd",value:"_s-xclick"},null,-1)),Ae=s(()=>o("input",{type:"hidden",name:"hosted_button_id",value:"Y5HS3WCERWAAQ"},null,-1)),Be=s(()=>o("input",{type:"hidden",name:"currency_code",value:"USD"},null,-1)),Pe=s(()=>o("input",{type:"image",id:"pay",src:"https://c01dkit.s3.ap-northeast-1.amazonaws.com/assets/images/a_cup_of_coffee_with_1_on_it.png",border:"0",name:"submit",title:"Support Me with a Cup of Coffee💕",alt:"立即购买"},null,-1)),Re=[je,Ae,Be,Pe],He=s(()=>o("div",{class:"flex flex-col gap-4 w-[25rem]"},[o("img",{src:oe}),o("img",{src:ie})],-1)),Ne=f('<div class="mb-3 line-height-4" data-v-e452914f> Besides, if you have any suggestions, please do not hesitate to let me know! You can post an <a class="text-primary" href="https://github.com/c01dkit/sec-papers-collection/issues" target="_blank" data-v-e452914f>issue in the repository <i class="pi pi-github" data-v-e452914f></i></a> or fill in a<a class="text-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link" target="_blank" data-v-e452914f> google form <i class="pi pi-google" data-v-e452914f></i></a> ! </div>',1);function Ve(t,e,n,r,a,i){const c=Q,h=x;return l(),p("div",re,[o("div",ae,[o("div",le,[o("div",ce,[o("div",de,[o("div",null,[ue,o("div",pe,b(a.paperStatis.total),1)]),fe])])]),he,o("div",ve,[o("div",me,[o("div",be,[o("div",null,[ye,o("div",ge,b(a.github.stars)+b(a.github.forks),1)]),we])])]),_e,o("div",ke,[o("div",Le,[xe,u(c),Ce])]),o("div",Se,[o("div",Ee,[Oe,u(c),Te,ze,Ke,o("div",De,[k(" If you find this website helpful, you can pay me a cup of coffee ☕ 😃 ... or, "),o("span",{class:"text-primary cursor-pointer",onClick:e[0]||(e[0]=(...g)=>i.toggle&&i.toggle(...g))}," a cup of Chinese tea 🍵"),k(" 😆")]),a.showSponsor?(l(),p("form",Ie,Re)):L("",!0),u(h,{ref:"op"},{default:y(()=>[He]),_:1},512),Ne])])])])}const Fe=Z(se,[["render",Ve],["__scopeId","data-v-e452914f"]]);export{Fe as default};
