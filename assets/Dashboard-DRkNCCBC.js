import{p as I}from"./data-statistics-DPCciKhS.js";import{B as K,Z as m,a as R,b as j,g as x,$ as A,c as B,f as P,i as H,d as N,s as Z,R as $,e as F,h as U,r as V,j as W,o as a,k as q,w as _,l as c,T as M,m as b,n as Q,p as l,q as C,t as E,_ as f,u,v as Y,x as o,y,z as g,A as w,C as k,D,E as S,F as J}from"./index-BAsaSFlo.js";import{C as G}from"./index-BsuepzRO.js";import{O as p,F as X}from"./index-DBNU0Dms.js";var ee=function(e){var n=e.dt;return`
.p-popover {
    margin-block-start: `.concat(n("popover.gutter"),`;
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
    margin-block-start: calc(`).concat(n("popover.gutter"),` * -1);
    margin-block-end: `).concat(n("popover.gutter"),`;
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
`)},te={root:"p-popover p-component",content:"p-popover-content"},ne=K.extend({name:"popover",theme:ee,classes:te}),oe={name:"BasePopover",extends:U,props:{dismissable:{type:Boolean,default:!0},appendTo:{type:[String,Object],default:"body"},baseZIndex:{type:Number,default:0},autoZIndex:{type:Boolean,default:!0},breakpoints:{type:Object,default:null},closeOnEscape:{type:Boolean,default:!0}},style:ne,provide:function(){return{$pcPopover:this,$parentInstance:this}}},O={name:"Popover",extends:oe,inheritAttrs:!1,emits:["show","hide"],data:function(){return{visible:!1}},watch:{dismissable:{immediate:!0,handler:function(e){e?this.bindOutsideClickListener():this.unbindOutsideClickListener()}}},selfClick:!1,target:null,eventTarget:null,outsideClickListener:null,scrollHandler:null,resizeListener:null,container:null,styleElement:null,overlayEventListener:null,documentKeydownListener:null,beforeUnmount:function(){this.dismissable&&this.unbindOutsideClickListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.destroyStyle(),this.unbindResizeListener(),this.target=null,this.container&&this.autoZIndex&&m.clear(this.container),this.overlayEventListener&&(p.off("overlay-click",this.overlayEventListener),this.overlayEventListener=null),this.container=null},mounted:function(){this.breakpoints&&this.createStyle()},methods:{toggle:function(e,n){this.visible?this.hide():this.show(e,n)},show:function(e,n){this.visible=!0,this.eventTarget=e.currentTarget,this.target=n||e.currentTarget},hide:function(){this.visible=!1},onContentClick:function(){this.selfClick=!0},onEnter:function(e){var n=this;R(e,{position:"absolute",top:"0",left:"0"}),this.alignOverlay(),this.dismissable&&this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.autoZIndex&&m.set("overlay",e,this.baseZIndex+this.$primevue.config.zIndex.overlay),this.overlayEventListener=function(i){n.container.contains(i.target)&&(n.selfClick=!0)},this.focus(),p.on("overlay-click",this.overlayEventListener),this.$emit("show"),this.closeOnEscape&&this.bindDocumentKeyDownListener()},onLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.unbindDocumentKeyDownListener(),p.off("overlay-click",this.overlayEventListener),this.overlayEventListener=null,this.$emit("hide")},onAfterLeave:function(e){this.autoZIndex&&m.clear(e)},alignOverlay:function(){j(this.container,this.target,!1);var e=x(this.container),n=x(this.target),i=0;e.left<n.left&&(i=n.left-e.left),this.container.style.setProperty(A("popover.arrow.left").name,"".concat(i,"px")),e.top<n.top&&(this.container.setAttribute("data-p-popover-flipped","true"),!this.isUnstyled&&B(this.container,"p-popover-flipped"))},onContentKeydown:function(e){e.code==="Escape"&&this.closeOnEscape&&(this.hide(),P(this.target))},onButtonKeydown:function(e){switch(e.code){case"ArrowDown":case"ArrowUp":case"ArrowLeft":case"ArrowRight":e.preventDefault()}},focus:function(){var e=this.container.querySelector("[autofocus]");e&&e.focus()},onKeyDown:function(e){e.code==="Escape"&&this.closeOnEscape&&(this.visible=!1)},bindDocumentKeyDownListener:function(){this.documentKeydownListener||(this.documentKeydownListener=this.onKeyDown.bind(this),window.document.addEventListener("keydown",this.documentKeydownListener))},unbindDocumentKeyDownListener:function(){this.documentKeydownListener&&(window.document.removeEventListener("keydown",this.documentKeydownListener),this.documentKeydownListener=null)},bindOutsideClickListener:function(){var e=this;!this.outsideClickListener&&H()&&(this.outsideClickListener=function(n){e.visible&&!e.selfClick&&!e.isTargetClicked(n)&&(e.visible=!1),e.selfClick=!1},document.addEventListener("click",this.outsideClickListener))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener),this.outsideClickListener=null,this.selfClick=!1)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new G(this.target,function(){e.visible&&(e.visible=!1)})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.visible&&!N()&&(e.visible=!1)},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},isTargetClicked:function(e){return this.eventTarget&&(this.eventTarget===e.target||this.eventTarget.contains(e.target))},containerRef:function(e){this.container=e},createStyle:function(){if(!this.styleElement&&!this.isUnstyled){var e;this.styleElement=document.createElement("style"),this.styleElement.type="text/css",Z(this.styleElement,"nonce",(e=this.$primevue)===null||e===void 0||(e=e.config)===null||e===void 0||(e=e.csp)===null||e===void 0?void 0:e.nonce),document.head.appendChild(this.styleElement);var n="";for(var i in this.breakpoints)n+=`
                        @media screen and (max-width: `.concat(i,`) {
                            .p-popover[`).concat(this.$attrSelector,`] {
                                width: `).concat(this.breakpoints[i],` !important;
                            }
                        }
                    `);this.styleElement.innerHTML=n}},destroyStyle:function(){this.styleElement&&(document.head.removeChild(this.styleElement),this.styleElement=null)},onOverlayClick:function(e){p.emit("overlay-click",{originalEvent:e,target:this.target})}},directives:{focustrap:X,ripple:$},components:{Portal:F}},se=["aria-modal"];function ie(t,e,n,i,d,s){var v=V("Portal"),T=W("focustrap");return a(),q(v,{appendTo:t.appendTo},{default:_(function(){return[c(M,b({name:"p-popover",onEnter:s.onEnter,onLeave:s.onLeave,onAfterLeave:s.onAfterLeave},t.ptm("transition")),{default:_(function(){return[d.visible?Q((a(),l("div",b({key:0,ref:s.containerRef,role:"dialog","aria-modal":d.visible,onClick:e[3]||(e[3]=function(){return s.onOverlayClick&&s.onOverlayClick.apply(s,arguments)}),class:t.cx("root")},t.ptmi("root")),[t.$slots.container?C(t.$slots,"container",{key:0,closeCallback:s.hide,keydownCallback:function(z){return s.onButtonKeydown(z)}}):(a(),l("div",b({key:1,class:t.cx("content"),onClick:e[0]||(e[0]=function(){return s.onContentClick&&s.onContentClick.apply(s,arguments)}),onMousedown:e[1]||(e[1]=function(){return s.onContentClick&&s.onContentClick.apply(s,arguments)}),onKeydown:e[2]||(e[2]=function(){return s.onContentKeydown&&s.onContentKeydown.apply(s,arguments)})},t.ptm("content")),[C(t.$slots,"default")],16))],16,se)),[[T]]):E("",!0)]}),_:3},16,["onEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])}O.render=ie;const re="https://api.github.com/repos/c01dkit/sec-papers-collection";async function ae(){try{return await(await fetch(re)).json()}catch(t){console.error(t)}}const ce={getRepoStatisticsData(){return ae()}},h=t=>(w("data-v-dfc41d67"),t=t(),k(),t),le={class:"grid grid-cols-12 gap-8 mb-8"},de={class:"col-span-12 lg:col-span-6 xl:col-span-3"},pe={class:"card mb-0"},ue={class:"flex justify-between mb-4"},fe=h(()=>o("span",{class:"block text-muted-color font-medium mb-4"},"Total Papers",-1)),he={class:"font-medium text-xl"},ve=h(()=>o("div",{class:"flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border",style:{width:"2.5rem",height:"2.5rem"}},[o("i",{class:"pi pi-file text-blue-500 !text-xl"})],-1)),me=g('<div class="col-span-12 lg:col-span-6 xl:col-span-3" data-v-dfc41d67><div class="card mb-0" data-v-dfc41d67><div class="flex justify-between mb-4" data-v-dfc41d67><div data-v-dfc41d67><span class="block text-muted-color font-medium mb-4" data-v-dfc41d67>Total Publications</span><div class="font-medium text-xl" data-v-dfc41d67>6</div></div><div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-400/10 rounded-border" style="width:2.5rem;height:2.5rem;" data-v-dfc41d67><i class="pi pi-book text-indigo-500 !text-xl" data-v-dfc41d67></i></div></div></div></div>',1),be={class:"col-span-12 lg:col-span-6 xl:col-span-3"},ye={class:"card mb-0"},_e={class:"flex justify-between mb-4"},ge=h(()=>o("span",{class:"block text-muted-color font-medium mb-4"},"Project Stars / Forks ",-1)),we={class:"font-medium text-xl"},ke=h(()=>o("div",{class:"flex items-center justify-center bg-yellow-100 dark:bg-yellow-400/10 rounded-border",style:{width:"2.5rem",height:"2.5rem"}},[o("i",{class:"pi pi-star text-yellow-500 text-xl"})],-1)),Le=g('<div class="col-span-12 lg:col-span-6 xl:col-span-3" data-v-dfc41d67><div class="card mb-0" data-v-dfc41d67><div class="flex justify-between mb-4" data-v-dfc41d67><div data-v-dfc41d67><span class="block text-500 font-medium mb-3" data-v-dfc41d67>Site Visitors / Visits</span><span id="busuanzi_value_site_uv" class="text-900 font-medium text-xl" data-v-dfc41d67>😃</span><span class="text-900 font-medium text-xl" data-v-dfc41d67> / </span><span id="busuanzi_value_site_pv" class="text-900 font-medium text-xl" data-v-dfc41d67>😃</span></div><div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width:2.5rem;height:2.5rem;" data-v-dfc41d67><i class="pi pi-user text-orange-500 !text-xl" data-v-dfc41d67></i></div></div></div></div>',1),xe={__name:"StatsWidget",setup(t){const e=u(I),n=u({stars:"loading",forks:" ..."});return Y(()=>{ce.getRepoStatisticsData().then(i=>{n.value={stars:i.stargazers_count,forks:" / "+i.forks_count}})}),(i,d)=>(a(),l("div",le,[o("div",de,[o("div",pe,[o("div",ue,[o("div",null,[fe,o("div",he,y(e.value.total),1)]),ve])])]),me,o("div",be,[o("div",ye,[o("div",_e,[o("div",null,[ge,o("div",we,y(n.value.stars)+" "+y(n.value.forks),1)]),ke])])]),Le]))}},Ce=f(xe,[["__scopeId","data-v-dfc41d67"]]),Se={},L=t=>(w("data-v-386bae57"),t=t(),k(),t),Ee={class:"col-span-12 card"},De=L(()=>o("h1",{class:"mb-4"},"Announcements",-1)),Oe=L(()=>o("div",{class:"flex justify-between mb-3"},[o("div",{class:"font-medium"},"NEWS! "),o("div",null,"2024-09-01")],-1)),Te=L(()=>o("div",null,' My new security paper collection is online now. You can start your journal from "Search" button in the Side bar. This site is still under construction, of course. NOTE: The website is tested in Chrome, and some items may not be loaded correctly in other browsers. ',-1));function ze(t,e){const n=D;return a(),l("div",Ee,[De,c(n),Oe,Te])}const Ie=f(Se,[["render",ze],["__scopeId","data-v-386bae57"]]),Ke="/assets/ali-sponsor-DO3S1p70.jpg",Re="/assets/wec-sponsor-kc7RAjDy.jpg",r=t=>(w("data-v-005530cf"),t=t(),k(),t),je={class:"col-span-12 card"},Ae=r(()=>o("h1",{class:"mb-4"},"Feedback",-1)),Be=r(()=>o("div",{class:"mb-3"}," Hi, there!",-1)),Pe=r(()=>o("div",{class:"mb-3"}," It's great to meet you after a long journey, and welcome to the third version of the website! Compared to the previous two versions, the current one adopts their advantages.",-1)),He=r(()=>o("div",{class:"mb-3"}," Of course, the website is still quite simple at the moment. I plan to make more updates in the future! Since the entire website is under construction by myself, I can easily implement many ideas! I also look forward to your feedback and issues.",-1)),Ne={key:0,action:"https://www.paypal.com/cgi-bin/webscr",method:"post",target:"_top"},Ze=r(()=>o("input",{type:"hidden",name:"cmd",value:"_s-xclick"},null,-1)),$e=r(()=>o("input",{type:"hidden",name:"hosted_button_id",value:"Y5HS3WCERWAAQ"},null,-1)),Fe=r(()=>o("input",{type:"hidden",name:"currency_code",value:"USD"},null,-1)),Ue=r(()=>o("input",{type:"image",id:"pay",src:"https://c01dkit.s3.ap-northeast-1.amazonaws.com/assets/images/a_cup_of_coffee_with_1_on_it.png",border:"0",name:"submit",title:"Support Me with a Cup of Coffee💕",alt:"立即购买"},null,-1)),Ve=[Ze,$e,Fe,Ue],We=r(()=>o("div",{class:"flex flex-row gap-4 w-auto"},[o("img",{src:Ke}),o("img",{src:Re})],-1)),qe=g('<div class="mb-3" data-v-005530cf> Besides, if you have any suggestions, please do not hesitate to let me know! You can post an <a class="text-primary" href="https://github.com/c01dkit/sec-papers-collection/issues" target="_blank" data-v-005530cf>issue in the repository <i class="pi pi-github" data-v-005530cf></i></a> or fill in a<a class="text-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSdCJoJiUNJmRN7AXvdh6TbP3sZE6Srgj5hMRlQBqTkq2NiG4Q/viewform?usp=sf_link" target="_blank" data-v-005530cf> google form <i class="pi pi-google" data-v-005530cf></i></a> ! </div>',1),Me={__name:"Feedback",setup(t){const e=u(!0),n=u(),i=d=>{n.value.toggle(d)};return(d,s)=>{const v=D;return a(),l("div",je,[Ae,c(v),Be,Pe,He,o("div",{class:"mb-3"},[S(" If you find this website helpful, you can support me with a cup of coffee ☕ 😃 ... or, "),o("span",{class:"text-primary cursor-pointer",onClick:i}," a cup of Chinese tea 🍵"),S(" 😆")]),e.value?(a(),l("form",Ne,Ve)):E("",!0),c(J(O),{ref_key:"op",ref:n},{default:_(()=>[We]),_:1},512),qe])}}},Qe=f(Me,[["__scopeId","data-v-005530cf"]]),Ye={class:""},Je={__name:"Dashboard",setup(t){return(e,n)=>(a(),l("div",Ye,[c(Ce),c(Ie),c(Qe)]))}},ot=f(Je,[["__scopeId","data-v-14fbec6a"]]);export{ot as default};
