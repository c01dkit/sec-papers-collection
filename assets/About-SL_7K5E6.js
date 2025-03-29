import{B as S,a as l,c,m as o,i as p,g as v,b as r,l as M,v as F,aA as h,az as b,O as R,F as w,y as B,r as $,o as X,f as g,a4 as y,a3 as k,t as f,s as I}from"./index-JzkcMubZ.js";import{U as x}from"./index-DwkR3mcV.js";var P=function(e){var n=e.dt;return`
.p-card {
    background: `.concat(n("card.background"),`;
    color: `).concat(n("card.color"),`;
    box-shadow: `).concat(n("card.shadow"),`;
    border-radius: `).concat(n("card.border.radius"),`;
    display: flex;
    flex-direction: column;
}

.p-card-caption {
    display: flex;
    flex-direction: column;
    gap: `).concat(n("card.caption.gap"),`;
}

.p-card-body {
    padding: `).concat(n("card.body.padding"),`;
    display: flex;
    flex-direction: column;
    gap: `).concat(n("card.body.gap"),`;
}

.p-card-title {
    font-size: `).concat(n("card.title.font.size"),`;
    font-weight: `).concat(n("card.title.font.weight"),`;
}

.p-card-subtitle {
    color: `).concat(n("card.subtitle.color"),`;
}
`)},Y={root:"p-card p-component",header:"p-card-header",body:"p-card-body",caption:"p-card-caption",title:"p-card-title",subtitle:"p-card-subtitle",content:"p-card-content",footer:"p-card-footer"},K=S.extend({name:"card",theme:P,classes:Y}),E={name:"BaseCard",extends:M,style:K,provide:function(){return{$pcCard:this,$parentInstance:this}}},D={name:"Card",extends:E,inheritAttrs:!1};function O(t,e,n,a,m,i){return l(),c("div",o({class:t.cx("root")},t.ptmi("root")),[t.$slots.header?(l(),c("div",o({key:0,class:t.cx("header")},t.ptm("header")),[p(t.$slots,"header")],16)):v("",!0),r("div",o({class:t.cx("body")},t.ptm("body")),[t.$slots.title||t.$slots.subtitle?(l(),c("div",o({key:0,class:t.cx("caption")},t.ptm("caption")),[t.$slots.title?(l(),c("div",o({key:0,class:t.cx("title")},t.ptm("title")),[p(t.$slots,"title")],16)):v("",!0),t.$slots.subtitle?(l(),c("div",o({key:1,class:t.cx("subtitle")},t.ptm("subtitle")),[p(t.$slots,"subtitle")],16)):v("",!0)],16)):v("",!0),r("div",o({class:t.cx("content")},t.ptm("content")),[p(t.$slots,"content")],16),t.$slots.footer?(l(),c("div",o({key:1,class:t.cx("footer")},t.ptm("footer")),[p(t.$slots,"footer")],16)):v("",!0)],16)],16)}D.render=O;var H=function(e){var n=e.dt;return`
.p-scrollpanel-content-container {
    overflow: hidden;
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
    float: left;
}

.p-scrollpanel-content {
    height: calc(100% + calc(2 * `.concat(n("scrollpanel.bar.size"),`));
    width: calc(100% + calc(2 * `).concat(n("scrollpanel.bar.size"),`));
    padding-inline: 0 calc(2 * `).concat(n("scrollpanel.bar.size"),`);
    padding-block: 0 calc(2 * `).concat(n("scrollpanel.bar.size"),`);
    position: relative;
    overflow: auto;
    box-sizing: border-box;
    scrollbar-width: none;
}

.p-scrollpanel-content::-webkit-scrollbar {
    display: none;
}

.p-scrollpanel-bar {
    position: relative;
    border-radius: `).concat(n("scrollpanel.bar.border.radius"),`;
    z-index: 2;
    cursor: pointer;
    opacity: 0;
    outline-color: transparent;
    background: `).concat(n("scrollpanel.bar.background"),`;
    border: 0 none;
    transition: outline-color `).concat(n("scrollpanel.transition.duration"),", opacity ").concat(n("scrollpanel.transition.duration"),`;
}

.p-scrollpanel-bar:focus-visible {
    box-shadow: `).concat(n("scrollpanel.bar.focus.ring.shadow"),`;
    outline: `).concat(n("scrollpanel.barfocus.ring.width")," ").concat(n("scrollpanel.bar.focus.ring.style")," ").concat(n("scrollpanel.bar.focus.ring.color"),`;
    outline-offset: `).concat(n("scrollpanel.barfocus.ring.offset"),`;
}

.p-scrollpanel-bar-y {
    width: `).concat(n("scrollpanel.bar.size"),`;
    inset-block-start: 0;
}

.p-scrollpanel-bar-x {
    height: `).concat(n("scrollpanel.bar.size"),`;
    inset-block-end: 0;
}

.p-scrollpanel-hidden {
    visibility: hidden;
}

.p-scrollpanel:hover .p-scrollpanel-bar,
.p-scrollpanel:active .p-scrollpanel-bar {
    opacity: 1;
}

.p-scrollpanel-grabbed {
    user-select: none;
}
`)},N={root:"p-scrollpanel p-component",contentContainer:"p-scrollpanel-content-container",content:"p-scrollpanel-content",barX:"p-scrollpanel-bar p-scrollpanel-bar-x",barY:"p-scrollpanel-bar p-scrollpanel-bar-y"},q=S.extend({name:"scrollpanel",theme:H,classes:N}),V={name:"BaseScrollPanel",extends:M,props:{step:{type:Number,default:5}},style:q,provide:function(){return{$pcScrollPanel:this,$parentInstance:this}}},z={name:"ScrollPanel",extends:V,inheritAttrs:!1,initialized:!1,documentResizeListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,frame:null,scrollXRatio:null,scrollYRatio:null,isXBarClicked:!1,isYBarClicked:!1,lastPageX:null,lastPageY:null,timer:null,outsideClickListener:null,data:function(){return{id:this.$attrs.id,orientation:"vertical",lastScrollTop:0,lastScrollLeft:0}},watch:{"$attrs.id":function(e){this.id=e||x()}},mounted:function(){this.id=this.id||x(),this.$el.offsetParent&&this.initialize()},updated:function(){!this.initialized&&this.$el.offsetParent&&this.initialize()},beforeUnmount:function(){this.unbindDocumentResizeListener(),this.frame&&window.cancelAnimationFrame(this.frame)},methods:{initialize:function(){this.moveBar(),this.bindDocumentResizeListener(),this.calculateContainerHeight()},calculateContainerHeight:function(){var e=getComputedStyle(this.$el),n=getComputedStyle(this.$refs.xBar),a=F(this.$el)-parseInt(n.height,10);e["max-height"]!=="none"&&a===0&&(this.$refs.content.offsetHeight+parseInt(n.height,10)>parseInt(e["max-height"],10)?this.$el.style.height=e["max-height"]:this.$el.style.height=this.$refs.content.offsetHeight+parseFloat(e.paddingTop)+parseFloat(e.paddingBottom)+parseFloat(e.borderTopWidth)+parseFloat(e.borderBottomWidth)+"px")},moveBar:function(){var e=this;if(this.$refs.content){var n=this.$refs.content.scrollWidth,a=this.$refs.content.clientWidth,m=(this.$el.clientHeight-this.$refs.xBar.clientHeight)*-1;this.scrollXRatio=a/n;var i=this.$refs.content.scrollHeight,d=this.$refs.content.clientHeight,s=(this.$el.clientWidth-this.$refs.yBar.clientWidth)*-1;this.scrollYRatio=d/i,this.frame=this.requestAnimationFrame(function(){e.$refs.xBar&&(e.scrollXRatio>=1?(e.$refs.xBar.setAttribute("data-p-scrollpanel-hidden","true"),!e.isUnstyled&&h(e.$refs.xBar,"p-scrollpanel-hidden")):(e.$refs.xBar.setAttribute("data-p-scrollpanel-hidden","false"),!e.isUnstyled&&b(e.$refs.xBar,"p-scrollpanel-hidden"),e.$refs.xBar.style.cssText="width:"+Math.max(e.scrollXRatio*100,10)+"%; inset-inline-start:"+Math.abs(e.$refs.content.scrollLeft)/n*100+"%;bottom:"+m+"px;")),e.$refs.yBar&&(e.scrollYRatio>=1?(e.$refs.yBar.setAttribute("data-p-scrollpanel-hidden","true"),!e.isUnstyled&&h(e.$refs.yBar,"p-scrollpanel-hidden")):(e.$refs.yBar.setAttribute("data-p-scrollpanel-hidden","false"),!e.isUnstyled&&b(e.$refs.yBar,"p-scrollpanel-hidden"),e.$refs.yBar.style.cssText="height:"+Math.max(e.scrollYRatio*100,10)+"%; top: calc("+e.$refs.content.scrollTop/i*100+"% - "+e.$refs.xBar.clientHeight+"px); inset-inline-end:"+s+"px;"))})}},onYBarMouseDown:function(e){this.isYBarClicked=!0,this.$refs.yBar.focus(),this.lastPageY=e.pageY,this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","true"),!this.isUnstyled&&h(this.$refs.yBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","true"),!this.isUnstyled&&h(document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),e.preventDefault()},onXBarMouseDown:function(e){this.isXBarClicked=!0,this.$refs.xBar.focus(),this.lastPageX=e.pageX,this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&h(this.$refs.xBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&h(document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),e.preventDefault()},onScroll:function(e){this.lastScrollLeft!==e.target.scrollLeft?(this.lastScrollLeft=e.target.scrollLeft,this.orientation="horizontal"):this.lastScrollTop!==e.target.scrollTop&&(this.lastScrollTop=e.target.scrollTop,this.orientation="vertical"),this.moveBar()},onKeyDown:function(e){if(this.orientation==="vertical")switch(e.code){case"ArrowDown":{this.setTimer("scrollTop",this.step),e.preventDefault();break}case"ArrowUp":{this.setTimer("scrollTop",this.step*-1),e.preventDefault();break}case"ArrowLeft":case"ArrowRight":{e.preventDefault();break}}else if(this.orientation==="horizontal")switch(e.code){case"ArrowRight":{this.setTimer("scrollLeft",this.step),e.preventDefault();break}case"ArrowLeft":{this.setTimer("scrollLeft",this.step*-1),e.preventDefault();break}case"ArrowDown":case"ArrowUp":{e.preventDefault();break}}},onKeyUp:function(){this.clearTimer()},repeat:function(e,n){this.$refs.content[e]+=n,this.moveBar()},setTimer:function(e,n){var a=this;this.clearTimer(),this.timer=setTimeout(function(){a.repeat(e,n)},40)},clearTimer:function(){this.timer&&clearTimeout(this.timer)},onDocumentMouseMove:function(e){this.isXBarClicked?this.onMouseMoveForXBar(e):this.isYBarClicked?this.onMouseMoveForYBar(e):(this.onMouseMoveForXBar(e),this.onMouseMoveForYBar(e))},onMouseMoveForXBar:function(e){var n=this,a=e.pageX-this.lastPageX;this.lastPageX=e.pageX,this.frame=this.requestAnimationFrame(function(){n.$refs.content.scrollLeft+=a/n.scrollXRatio})},onMouseMoveForYBar:function(e){var n=this,a=e.pageY-this.lastPageY;this.lastPageY=e.pageY,this.frame=this.requestAnimationFrame(function(){n.$refs.content.scrollTop+=a/n.scrollYRatio})},onFocus:function(e){this.$refs.xBar.isSameNode(e.target)?this.orientation="horizontal":this.$refs.yBar.isSameNode(e.target)&&(this.orientation="vertical")},onBlur:function(){this.orientation==="horizontal"&&(this.orientation="vertical")},onDocumentMouseUp:function(){this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&b(this.$refs.yBar,"p-scrollpanel-grabbed"),this.$refs.xBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&b(this.$refs.xBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&b(document.body,"p-scrollpanel-grabbed"),this.unbindDocumentMouseListeners(),this.isXBarClicked=!1,this.isYBarClicked=!1},requestAnimationFrame:function(e){var n=window.requestAnimationFrame||this.timeoutFrame;return n(e)},refresh:function(){this.moveBar()},scrollTop:function(e){var n=this.$refs.content.scrollHeight-this.$refs.content.clientHeight;e=e>n?n:e>0?e:0,this.$refs.content.scrollTop=e},timeoutFrame:function(e){setTimeout(e,0)},bindDocumentMouseListeners:function(){var e=this;this.documentMouseMoveListener||(this.documentMouseMoveListener=function(n){e.onDocumentMouseMove(n)},document.addEventListener("mousemove",this.documentMouseMoveListener)),this.documentMouseUpListener||(this.documentMouseUpListener=function(n){e.onDocumentMouseUp(n)},document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseListeners:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null),this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},bindDocumentResizeListener:function(){var e=this;this.documentResizeListener||(this.documentResizeListener=function(){e.moveBar()},window.addEventListener("resize",this.documentResizeListener))},unbindDocumentResizeListener:function(){this.documentResizeListener&&(window.removeEventListener("resize",this.documentResizeListener),this.documentResizeListener=null)}},computed:{contentId:function(){return this.id+"_content"}}},W=["id"],j=["aria-controls","aria-valuenow"],G=["aria-controls","aria-valuenow"];function Q(t,e,n,a,m,i){return l(),c("div",o({class:t.cx("root")},t.ptmi("root")),[r("div",o({class:t.cx("contentContainer")},t.ptm("contentContainer")),[r("div",o({ref:"content",id:i.contentId,class:t.cx("content"),onScroll:e[0]||(e[0]=function(){return i.onScroll&&i.onScroll.apply(i,arguments)}),onMouseenter:e[1]||(e[1]=function(){return i.moveBar&&i.moveBar.apply(i,arguments)})},t.ptm("content")),[p(t.$slots,"default")],16,W)],16),r("div",o({ref:"xBar",class:t.cx("barx"),tabindex:"0",role:"scrollbar","aria-orientation":"horizontal","aria-controls":i.contentId,"aria-valuenow":m.lastScrollLeft,onMousedown:e[2]||(e[2]=function(){return i.onXBarMouseDown&&i.onXBarMouseDown.apply(i,arguments)}),onKeydown:e[3]||(e[3]=function(d){return i.onKeyDown(d)}),onKeyup:e[4]||(e[4]=function(){return i.onKeyUp&&i.onKeyUp.apply(i,arguments)}),onFocus:e[5]||(e[5]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[6]||(e[6]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)})},t.ptm("barx"),{"data-pc-group-section":"bar"}),null,16,j),r("div",o({ref:"yBar",class:t.cx("bary"),tabindex:"0",role:"scrollbar","aria-orientation":"vertical","aria-controls":i.contentId,"aria-valuenow":m.lastScrollTop,onMousedown:e[7]||(e[7]=function(){return i.onYBarMouseDown&&i.onYBarMouseDown.apply(i,arguments)}),onKeydown:e[8]||(e[8]=function(d){return i.onKeyDown(d)}),onKeyup:e[9]||(e[9]=function(){return i.onKeyUp&&i.onKeyUp.apply(i,arguments)}),onFocus:e[10]||(e[10]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)})},t.ptm("bary"),{"data-pc-group-section":"bar"}),null,16,G)],16)}z.render=Q;var J=function(e){var n=e.dt;return`
.p-timeline {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    direction: ltr;
}

.p-timeline-left .p-timeline-event-opposite {
    text-align: right;
}

.p-timeline-left .p-timeline-event-content {
    text-align: left;
}

.p-timeline-right .p-timeline-event {
    flex-direction: row-reverse;
}

.p-timeline-right .p-timeline-event-opposite {
    text-align: left;
}

.p-timeline-right .p-timeline-event-content {
    text-align: right;
}

.p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) {
    flex-direction: row-reverse;
}

.p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(odd) .p-timeline-event-opposite {
    text-align: right;
}

.p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(odd) .p-timeline-event-content {
    text-align: left;
}

.p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) .p-timeline-event-opposite {
    text-align: left;
}

.p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) .p-timeline-event-content {
    text-align: right;
}

.p-timeline-vertical .p-timeline-event-opposite,
.p-timeline-vertical .p-timeline-event-content {
    padding: `.concat(n("timeline.vertical.event.content.padding"),`;
}

.p-timeline-vertical .p-timeline-event-connector {
    width: `).concat(n("timeline.event.connector.size"),`;
}

.p-timeline-event {
    display: flex;
    position: relative;
    min-height: `).concat(n("timeline.event.min.height"),`;
}

.p-timeline-event:last-child {
    min-height: 0;
}

.p-timeline-event-opposite {
    flex: 1;
}

.p-timeline-event-content {
    flex: 1;
}

.p-timeline-event-separator {
    flex: 0;
    display: flex;
    align-items: center;
    flex-direction: column;
}

.p-timeline-event-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    align-self: baseline;
    border-width: `).concat(n("timeline.event.marker.border.width"),`;
    border-style: solid;
    border-color: `).concat(n("timeline.event.marker.border.color"),`;
    border-radius: `).concat(n("timeline.event.marker.border.radius"),`;
    width: `).concat(n("timeline.event.marker.size"),`;
    height: `).concat(n("timeline.event.marker.size"),`;
    background: `).concat(n("timeline.event.marker.background"),`;
}

.p-timeline-event-marker::before {
    content: " ";
    border-radius: `).concat(n("timeline.event.marker.content.border.radius"),`;
    width: `).concat(n("timeline.event.marker.content.size"),`;
    height:`).concat(n("timeline.event.marker.content.size"),`;
    background: `).concat(n("timeline.event.marker.content.background"),`;
}

.p-timeline-event-marker::after {
    content: " ";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: `).concat(n("timeline.event.marker.border.radius"),`;
    box-shadow: `).concat(n("timeline.event.marker.content.inset.shadow"),`;
}

.p-timeline-event-connector {
    flex-grow: 1;
    background: `).concat(n("timeline.event.connector.color"),`;
}

.p-timeline-horizontal {
    flex-direction: row;
}

.p-timeline-horizontal .p-timeline-event {
    flex-direction: column;
    flex: 1;
}

.p-timeline-horizontal .p-timeline-event:last-child {
    flex: 0;
}

.p-timeline-horizontal .p-timeline-event-separator {
    flex-direction: row;
}

.p-timeline-horizontal .p-timeline-event-connector {
    width: 100%;
    height: `).concat(n("timeline.event.connector.size"),`;
}

.p-timeline-horizontal .p-timeline-event-opposite,
.p-timeline-horizontal .p-timeline-event-content {
    padding: `).concat(n("timeline.horizontal.event.content.padding"),`;
}

.p-timeline-horizontal.p-timeline-alternate .p-timeline-event:nth-child(even) {
    flex-direction: column-reverse;
}

.p-timeline-bottom .p-timeline-event {
    flex-direction: column-reverse;
}
`)},Z={root:function(e){var n=e.props;return["p-timeline p-component","p-timeline-"+n.align,"p-timeline-"+n.layout]},event:"p-timeline-event",eventOpposite:"p-timeline-event-opposite",eventSeparator:"p-timeline-event-separator",eventMarker:"p-timeline-event-marker",eventConnector:"p-timeline-event-connector",eventContent:"p-timeline-event-content"},_=S.extend({name:"timeline",theme:J,classes:Z}),ee={name:"BaseTimeline",extends:M,props:{value:null,align:{mode:String,default:"left"},layout:{mode:String,default:"vertical"},dataKey:null},style:_,provide:function(){return{$pcTimeline:this,$parentInstance:this}}},L={name:"Timeline",extends:ee,inheritAttrs:!1,methods:{getKey:function(e,n){return this.dataKey?R(e,this.dataKey):n},getPTOptions:function(e,n){return this.ptm(e,{context:{index:n,count:this.value.length}})}}};function te(t,e,n,a,m,i){return l(),c("div",o({class:t.cx("root")},t.ptmi("root")),[(l(!0),c(w,null,B(t.value,function(d,s){return l(),c("div",o({key:i.getKey(d,s),class:t.cx("event"),ref_for:!0},i.getPTOptions("event",s)),[r("div",o({class:t.cx("eventOpposite",{index:s}),ref_for:!0},i.getPTOptions("eventOpposite",s)),[p(t.$slots,"opposite",{item:d,index:s})],16),r("div",o({class:t.cx("eventSeparator"),ref_for:!0},i.getPTOptions("eventSeparator",s)),[p(t.$slots,"marker",{item:d,index:s},function(){return[r("div",o({class:t.cx("eventMarker"),ref_for:!0},i.getPTOptions("eventMarker",s)),null,16)]}),s!==t.value.length-1?p(t.$slots,"connector",{key:0,item:d,index:s},function(){return[r("div",o({class:t.cx("eventConnector"),ref_for:!0},i.getPTOptions("eventConnector",s)),null,16)]}):v("",!0)],16),r("div",o({class:t.cx("eventContent"),ref_for:!0},i.getPTOptions("eventContent",s)),[p(t.$slots,"content",{item:d,index:s})],16)],16)}),128))],16)}L.render=te;const A={updateTimelineData(){return[{status:"v0.3.1",date:"2025-03-04",content:["✨ Add paper awards","Fix paper/search load error in local development mode","Fix incomplete abstract for NDSS","Update NDSS-2025 (Fall Cycle)","Add afdian support plan in Chinese"]},{status:"v0.3.0",date:"2025-01-21",content:["✨ Add paper submission timeline","Received the first support!","Add custom primary color support","Add dark mode support","Fix left sidebar following"]},{status:"v0.2.4",date:"2024-11-21",content:["Update NDSS-2025 (Summer Cycle)","Update ICSE-2025","Update Oakland-2025 (First Round)"]},{status:"v0.2.3",date:"2024-10-11",content:['✨ Add abstract support in "View Abstract".',"Remove useless websocket module.","Fix the inconsistency of total papers number count."]},{status:"v0.2.2",date:"2024-09-16",content:["Support analyzer for xplore and ACM dataset.","Update paper links for ACM CCS 15~23.","Update all paper links for ISSTA and ICSE.","Update all paper links for IEEE S&P.","Adjust feedback and acceptance positions.","Support feedback via Google form."]},{status:"v0.2.1",date:"2024-09-03",content:["Rewrite main.py for better understanding.","Add ali and wechat sponsor QR code.","Add background color.","Support one-click auto title copy.","Support quicker load (two-phase load) in Birdview."]},{status:"v0.2.0 Milestone",date:"2024-09-01",content:["Reconstruct the website with Vue3.","Archive previous mkdocs version.","Open partial source code of the vue version.","Add paypal sponsor link."]},{status:"v0.1.7",date:"2024-08-21",content:["Update USENIX Sec-2024 (227->419) and ISSTA-2024 (42->143)."]},{status:"v0.1.6",date:"2024-07-17",content:["Better search: now the page will scroll to the paper under search and highlight the url link."]},{status:"v0.1.5",date:"2024-07-10",content:["Add accepted-paper growth figures.","Add page view support in footer.","Merge icse_2015-1 and icse_2015-2."]},{status:"v0.1.4",date:"2024-05-09",content:["Add ISSTA-2024, USENIX Sec-2024-Fall cycle.","Support multiple urls with the same xpath now."]},{status:"v0.1.3",date:"2024-05-02",content:["Add NDSS-2024, S&P-2024, USENIX Sec-2024-Summer cycle.","Update ICSE-2024."]},{status:"v0.1.2",date:"2023-06-19",content:["Add ICSE and ISSTA support.","Update Oakland 2023."]},{status:"v0.1.1",date:"2023-06-19",content:["Add ICSE and ISSTA support.","Update Oakland 2023."]},{status:"v0.1.0",date:"2023-05-15",content:["First time to publish sec.c01dkit.com.","Use mkdocs as website generator."]}]},sponsorData(){return[{name:"cy",amount:"66",date:"2025-01-21",comment:""},{name:"k*j",amount:"20",date:"2025-01-21",comment:"感谢开发的secpaper网站，省了不少时间"}]},getUpdateTimelineData(){return Promise.resolve(this.updateTimelineData())},getSponsorData(){return Promise.resolve(this.sponsorData())}},ne={class:"grid grid-cols-12 gap-4"},ie={class:"col-span-9 card"},re=r("h1",null,"Timeline",-1),oe={class:"mb-5"},ae={class:"col-span-3 card",style:{height:"calc(100vh - 11rem)"}},se=r("h1",null,[k("Sponsors "),r("i",{class:"pi pi-heart"})],-1),le={class:"flex flex-col gap-3"},pe={__name:"About",setup(t){const e=$([]),n=$([]);return X(()=>{A.getUpdateTimelineData().then(a=>{e.value=a}),A.getSponsorData().then(a=>{n.value=a})}),(a,m)=>{const i=I,d=D,s=L,T=z;return l(),c("div",ne,[r("div",ie,[re,g(i),r("div",oe,[g(T,{style:{height:"calc(100vh - 20rem)"},dt:{bar:{background:"{primary.color}"}}},{default:y(()=>[g(s,{value:e.value,align:"alternate",class:"customized-timeline mb-2"},{content:y(u=>[g(d,{class:"mt-2"},{title:y(()=>[k(f(u.item.status),1)]),subtitle:y(()=>[k(f(u.item.date),1)]),content:y(()=>[(l(!0),c(w,null,B(u.item.content,(U,C)=>(l(),c("p",{key:C,class:"mt-0 mb-2"},f(U),1))),128))]),_:2},1024)]),_:1},8,["value"])]),_:1})])]),r("div",ae,[se,g(i),r("div",le,[(l(!0),c(w,null,B(n.value,u=>(l(),c("div",{key:u.date,class:"flex flex-row justify-between"},[r("div",null,f(u.name),1),r("div",null,f(u.amount),1),r("div",null,f(u.date),1)]))),128))])])])}}};export{pe as default};
