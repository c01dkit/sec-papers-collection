import{B,U as M,G as C,c as m,aq as f,e as k,o as c,n as d,t as r,m as o,p,K as F,I as S,J as $,q as h,_ as I,k as v,w as b,v as w,u as y,A as R}from"./index-24e34c2a.js";import{p as X}from"./data-statistics-9cb0aee9.js";var Y=function(e){var n=e.dt;return`
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
    padding: 0 calc(2 * `).concat(n("scrollpanel.bar.size"),") calc(2 * ").concat(n("scrollpanel.bar.size"),`) 0;
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
    transition: outline-color `).concat(n("scrollpanel.transition.duration"),`;
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
    top: 0;
}

.p-scrollpanel-bar-x {
    height: `).concat(n("scrollpanel.bar.size"),`;
    bottom: 0;
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
`)},P={root:"p-scrollpanel p-component",contentContainer:"p-scrollpanel-content-container",content:"p-scrollpanel-content",barX:"p-scrollpanel-bar p-scrollpanel-bar-x",barY:"p-scrollpanel-bar p-scrollpanel-bar-y"},K=B.extend({name:"scrollpanel",theme:Y,classes:P}),E={name:"BaseScrollPanel",extends:k,props:{step:{type:Number,default:5}},style:K,provide:function(){return{$pcScrollPanel:this,$parentInstance:this}}},x={name:"ScrollPanel",extends:E,inheritAttrs:!1,initialized:!1,documentResizeListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,frame:null,scrollXRatio:null,scrollYRatio:null,isXBarClicked:!1,isYBarClicked:!1,lastPageX:null,lastPageY:null,timer:null,outsideClickListener:null,data:function(){return{id:this.$attrs.id,orientation:"vertical",lastScrollTop:0,lastScrollLeft:0}},watch:{"$attrs.id":function(e){this.id=e||M()}},mounted:function(){this.id=this.id||M(),this.$el.offsetParent&&this.initialize()},updated:function(){!this.initialized&&this.$el.offsetParent&&this.initialize()},beforeUnmount:function(){this.unbindDocumentResizeListener(),this.frame&&window.cancelAnimationFrame(this.frame)},methods:{initialize:function(){this.moveBar(),this.bindDocumentResizeListener(),this.calculateContainerHeight()},calculateContainerHeight:function(){var e=getComputedStyle(this.$el),n=getComputedStyle(this.$refs.xBar),l=C(this.$el)-parseInt(n.height,10);e["max-height"]!=="none"&&l===0&&(this.$refs.content.offsetHeight+parseInt(n.height,10)>parseInt(e["max-height"],10)?this.$el.style.height=e["max-height"]:this.$el.style.height=this.$refs.content.offsetHeight+parseFloat(e.paddingTop)+parseFloat(e.paddingBottom)+parseFloat(e.borderTopWidth)+parseFloat(e.borderBottomWidth)+"px")},moveBar:function(){var e=this;if(this.$refs.content){var n=this.$refs.content.scrollWidth,l=this.$refs.content.clientWidth,u=(this.$el.clientHeight-this.$refs.xBar.clientHeight)*-1;this.scrollXRatio=l/n;var i=this.$refs.content.scrollHeight,a=this.$refs.content.clientHeight,s=(this.$el.clientWidth-this.$refs.yBar.clientWidth)*-1;this.scrollYRatio=a/i,this.frame=this.requestAnimationFrame(function(){e.$refs.xBar&&(e.scrollXRatio>=1?(e.$refs.xBar.setAttribute("data-p-scrollpanel-hidden","true"),!e.isUnstyled&&m(e.$refs.xBar,"p-scrollpanel-hidden")):(e.$refs.xBar.setAttribute("data-p-scrollpanel-hidden","false"),!e.isUnstyled&&f(e.$refs.xBar,"p-scrollpanel-hidden"),e.$refs.xBar.style.cssText="width:"+Math.max(e.scrollXRatio*100,10)+"%; left:"+e.$refs.content.scrollLeft/n*100+"%;bottom:"+u+"px;")),e.$refs.yBar&&(e.scrollYRatio>=1?(e.$refs.yBar.setAttribute("data-p-scrollpanel-hidden","true"),!e.isUnstyled&&m(e.$refs.yBar,"p-scrollpanel-hidden")):(e.$refs.yBar.setAttribute("data-p-scrollpanel-hidden","false"),!e.isUnstyled&&f(e.$refs.yBar,"p-scrollpanel-hidden"),e.$refs.yBar.style.cssText="height:"+Math.max(e.scrollYRatio*100,10)+"%; top: calc("+e.$refs.content.scrollTop/i*100+"% - "+e.$refs.xBar.clientHeight+"px);right:"+s+"px;"))})}},onYBarMouseDown:function(e){this.isYBarClicked=!0,this.$refs.yBar.focus(),this.lastPageY=e.pageY,this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","true"),!this.isUnstyled&&m(this.$refs.yBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","true"),!this.isUnstyled&&m(document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),e.preventDefault()},onXBarMouseDown:function(e){this.isXBarClicked=!0,this.$refs.xBar.focus(),this.lastPageX=e.pageX,this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&m(this.$refs.xBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&m(document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),e.preventDefault()},onScroll:function(e){this.lastScrollLeft!==e.target.scrollLeft?(this.lastScrollLeft=e.target.scrollLeft,this.orientation="horizontal"):this.lastScrollTop!==e.target.scrollTop&&(this.lastScrollTop=e.target.scrollTop,this.orientation="vertical"),this.moveBar()},onKeyDown:function(e){if(this.orientation==="vertical")switch(e.code){case"ArrowDown":{this.setTimer("scrollTop",this.step),e.preventDefault();break}case"ArrowUp":{this.setTimer("scrollTop",this.step*-1),e.preventDefault();break}case"ArrowLeft":case"ArrowRight":{e.preventDefault();break}}else if(this.orientation==="horizontal")switch(e.code){case"ArrowRight":{this.setTimer("scrollLeft",this.step),e.preventDefault();break}case"ArrowLeft":{this.setTimer("scrollLeft",this.step*-1),e.preventDefault();break}case"ArrowDown":case"ArrowUp":{e.preventDefault();break}}},onKeyUp:function(){this.clearTimer()},repeat:function(e,n){this.$refs.content[e]+=n,this.moveBar()},setTimer:function(e,n){var l=this;this.clearTimer(),this.timer=setTimeout(function(){l.repeat(e,n)},40)},clearTimer:function(){this.timer&&clearTimeout(this.timer)},onDocumentMouseMove:function(e){this.isXBarClicked?this.onMouseMoveForXBar(e):this.isYBarClicked?this.onMouseMoveForYBar(e):(this.onMouseMoveForXBar(e),this.onMouseMoveForYBar(e))},onMouseMoveForXBar:function(e){var n=this,l=e.pageX-this.lastPageX;this.lastPageX=e.pageX,this.frame=this.requestAnimationFrame(function(){n.$refs.content.scrollLeft+=l/n.scrollXRatio})},onMouseMoveForYBar:function(e){var n=this,l=e.pageY-this.lastPageY;this.lastPageY=e.pageY,this.frame=this.requestAnimationFrame(function(){n.$refs.content.scrollTop+=l/n.scrollYRatio})},onFocus:function(e){this.$refs.xBar.isSameNode(e.target)?this.orientation="horizontal":this.$refs.yBar.isSameNode(e.target)&&(this.orientation="vertical")},onBlur:function(){this.orientation==="horizontal"&&(this.orientation="vertical")},onDocumentMouseUp:function(){this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&f(this.$refs.yBar,"p-scrollpanel-grabbed"),this.$refs.xBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&f(this.$refs.xBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&f(document.body,"p-scrollpanel-grabbed"),this.unbindDocumentMouseListeners(),this.isXBarClicked=!1,this.isYBarClicked=!1},requestAnimationFrame:function(e){var n=window.requestAnimationFrame||this.timeoutFrame;return n(e)},refresh:function(){this.moveBar()},scrollTop:function(e){var n=this.$refs.content.scrollHeight-this.$refs.content.clientHeight;e=e>n?n:e>0?e:0,this.$refs.content.scrollTop=e},timeoutFrame:function(e){setTimeout(e,0)},bindDocumentMouseListeners:function(){var e=this;this.documentMouseMoveListener||(this.documentMouseMoveListener=function(n){e.onDocumentMouseMove(n)},document.addEventListener("mousemove",this.documentMouseMoveListener)),this.documentMouseUpListener||(this.documentMouseUpListener=function(n){e.onDocumentMouseUp(n)},document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseListeners:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null),this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},bindDocumentResizeListener:function(){var e=this;this.documentResizeListener||(this.documentResizeListener=function(){e.moveBar()},window.addEventListener("resize",this.documentResizeListener))},unbindDocumentResizeListener:function(){this.documentResizeListener&&(window.removeEventListener("resize",this.documentResizeListener),this.documentResizeListener=null)}},computed:{contentId:function(){return this.id+"_content"}}},O=["id"],H=["aria-controls","aria-valuenow"],N=["aria-controls","aria-valuenow"];function q(t,e,n,l,u,i){return c(),d("div",o({class:t.cx("root")},t.ptmi("root")),[r("div",o({class:t.cx("contentContainer")},t.ptm("contentContainer")),[r("div",o({ref:"content",id:i.contentId,class:t.cx("content"),onScroll:e[0]||(e[0]=function(){return i.onScroll&&i.onScroll.apply(i,arguments)}),onMouseenter:e[1]||(e[1]=function(){return i.moveBar&&i.moveBar.apply(i,arguments)})},t.ptm("content")),[p(t.$slots,"default")],16,O)],16),r("div",o({ref:"xBar",class:t.cx("barx"),tabindex:"0",role:"scrollbar","aria-orientation":"horizontal","aria-controls":i.contentId,"aria-valuenow":u.lastScrollLeft,onMousedown:e[2]||(e[2]=function(){return i.onXBarMouseDown&&i.onXBarMouseDown.apply(i,arguments)}),onKeydown:e[3]||(e[3]=function(a){return i.onKeyDown(a)}),onKeyup:e[4]||(e[4]=function(){return i.onKeyUp&&i.onKeyUp.apply(i,arguments)}),onFocus:e[5]||(e[5]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[6]||(e[6]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)})},t.ptm("barx"),{"data-pc-group-section":"bar"}),null,16,H),r("div",o({ref:"yBar",class:t.cx("bary"),tabindex:"0",role:"scrollbar","aria-orientation":"vertical","aria-controls":i.contentId,"aria-valuenow":u.lastScrollTop,onMousedown:e[7]||(e[7]=function(){return i.onYBarMouseDown&&i.onYBarMouseDown.apply(i,arguments)}),onKeydown:e[8]||(e[8]=function(a){return i.onKeyDown(a)}),onKeyup:e[9]||(e[9]=function(){return i.onKeyUp&&i.onKeyUp.apply(i,arguments)}),onFocus:e[10]||(e[10]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)})},t.ptm("bary"),{"data-pc-group-section":"bar"}),null,16,N)],16)}x.render=q;var V=function(e){var n=e.dt;return`
.p-timeline {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
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
`)},W={root:function(e){var n=e.props;return["p-timeline p-component","p-timeline-"+n.align,"p-timeline-"+n.layout]},event:"p-timeline-event",eventOpposite:"p-timeline-event-opposite",eventSeparator:"p-timeline-event-separator",eventMarker:"p-timeline-event-marker",eventConnector:"p-timeline-event-connector",eventContent:"p-timeline-event-content"},j=B.extend({name:"timeline",theme:V,classes:W}),G={name:"BaseTimeline",extends:k,props:{value:null,align:{mode:String,default:"left"},layout:{mode:String,default:"vertical"},dataKey:null},style:j,provide:function(){return{$pcTimeline:this,$parentInstance:this}}},z={name:"Timeline",extends:G,inheritAttrs:!1,methods:{getKey:function(e,n){return this.dataKey?F(e,this.dataKey):n},getPTOptions:function(e,n){return this.ptm(e,{context:{index:n,count:this.value.length}})}}};function J(t,e,n,l,u,i){return c(),d("div",o({class:t.cx("root")},t.ptmi("root")),[(c(!0),d(S,null,$(t.value,function(a,s){return c(),d("div",o({key:i.getKey(a,s),class:t.cx("event"),ref_for:!0},i.getPTOptions("event",s)),[r("div",o({class:t.cx("eventOpposite",{index:s}),ref_for:!0},i.getPTOptions("eventOpposite",s)),[p(t.$slots,"opposite",{item:a,index:s})],16),r("div",o({class:t.cx("eventSeparator"),ref_for:!0},i.getPTOptions("eventSeparator",s)),[p(t.$slots,"marker",{item:a,index:s},function(){return[r("div",o({class:t.cx("eventMarker"),ref_for:!0},i.getPTOptions("eventMarker",s)),null,16)]}),s!==t.value.length-1?p(t.$slots,"connector",{key:0,item:a,index:s},function(){return[r("div",o({class:t.cx("eventConnector"),ref_for:!0},i.getPTOptions("eventConnector",s)),null,16)]}):h("",!0)],16),r("div",o({class:t.cx("eventContent"),ref_for:!0},i.getPTOptions("eventContent",s)),[p(t.$slots,"content",{item:a,index:s})],16)],16)}),128))],16)}z.render=J;var Q=function(e){var n=e.dt;return`
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
`)},Z={root:"p-card p-component",header:"p-card-header",body:"p-card-body",caption:"p-card-caption",title:"p-card-title",subtitle:"p-card-subtitle",content:"p-card-content",footer:"p-card-footer"},_=B.extend({name:"card",theme:Q,classes:Z}),ee={name:"BaseCard",extends:k,style:_,provide:function(){return{$pcCard:this,$parentInstance:this}}},L={name:"Card",extends:ee,inheritAttrs:!1};function te(t,e,n,l,u,i){return c(),d("div",o({class:t.cx("root")},t.ptmi("root")),[t.$slots.header?(c(),d("div",o({key:0,class:t.cx("header")},t.ptm("header")),[p(t.$slots,"header")],16)):h("",!0),r("div",o({class:t.cx("body")},t.ptm("body")),[t.$slots.title||t.$slots.subtitle?(c(),d("div",o({key:0,class:t.cx("caption")},t.ptm("caption")),[t.$slots.title?(c(),d("div",o({key:0,class:t.cx("title")},t.ptm("title")),[p(t.$slots,"title")],16)):h("",!0),t.$slots.subtitle?(c(),d("div",o({key:1,class:t.cx("subtitle")},t.ptm("subtitle")),[p(t.$slots,"subtitle")],16)):h("",!0)],16)):h("",!0),r("div",o({class:t.cx("content")},t.ptm("content")),[p(t.$slots,"content")],16),t.$slots.footer?(c(),d("div",o({key:1,class:t.cx("footer")},t.ptm("footer")),[p(t.$slots,"footer")],16)):h("",!0)],16)],16)}L.render=te;const ne={methods:{viewBlocks(t){document.querySelector(t).scrollIntoView({behavior:"smooth"})}},data(){return{paperStatis:X,events:[{status:"v0.2.3",date:"2024-10-11",content:['⚡ NEW FUNCTION: Add abstract support in "View Abstract".',"Remove useless websocket module.","Fix inconsistency of total papers number count."]},{status:"v0.2.2",date:"2024-09-16",content:["Support analyzer for xplore and ACM dataset.","Update paper links for ACM CCS 15~23.","Update all paper links for ISSTA and ICSE.","Update all paper links for IEEE S&P.","Adjust feedback and acceptance positions.","Support feedback via Google form."]},{status:"v0.2.1",date:"2024-09-03",content:["Rewrite server.py for better understanding.","Add ali and wechat sponsor QR code.","Add background color.","Support one-click auto title copy.","Support quicker load (two-phase load) in Birdview."]},{status:"v0.2.0 Milestone",date:"2024-09-01",content:["Reconstruct the website into with Vue3.","Archive v1 mkdocs version.","Open partial source code of the vue version.","Add paypal sponsor link."]},{status:"v0.1.7",date:"2024-08-21",content:["Update USENIX Sec-2024 (227->419) and ISSTA-2024 (42->143)."]},{status:"v0.1.6",date:"2024-07-17",content:["Better search: now the page will scroll to the paper under search and highlight the url link."]},{status:"v0.1.5",date:"2024-07-10",content:["Add accepted-paper growth figures.","Add page view support in footer.","Merge icse_2015-1 and icse_2015-2."]},{status:"v0.1.4",date:"2024-05-09",content:["Add ISSTA-2024, USENIX Sec-2024-Fall cycle.","Support multiple urls with the same xpath now."]},{status:"v0.1.3",date:"2024-05-02",content:["Add NDSS-2024, S&P-2024, USENIX Sec-2024-Summer cycle.","Update ICSE-2024."]},{status:"v0.1.2",date:"2023-06-19",content:["Add ICSE and ISSTA support.","Update Oakland 2023."]},{status:"v0.1.1",date:"2023-06-19",content:["Add ICSE and ISSTA support.","Update Oakland 2023."]},{status:"v0.1.0",date:"2023-05-15",content:["First time to publish sec.c01dkit.com.","Use mkdocs as website generator."]}]}},mounted(){}},ie={class:"p-5"},re={class:"grid"},oe={class:"col-12 md:col-9"},se={class:"surface-card shadow-2 border-round p-4"},ae=r("h1",null,"Timeline",-1),le={class:"mb-5 flex"},ce={class:"col-12 md:col-3"},de={class:"surface-card shadow-2 border-round p-4"},pe=r("h1",null,[w("Sponsors "),r("i",{class:"pi pi-heart"})],-1),ue=r("div",{class:"mb-3 line-height-4"}," Wait and see...",-1);function me(t,e,n,l,u,i){const a=R,s=L,A=z,T=x;return c(),d("div",ie,[r("div",re,[r("div",oe,[r("div",se,[ae,v(a),r("div",le,[v(T,{style:{width:"100%",height:"800px"},dt:{bar:{background:"{primary.color}"}}},{default:b(()=>[v(A,{value:u.events,align:"alternate",class:"customized-timeline mb-2"},{content:b(g=>[v(s,{class:"mt-2"},{title:b(()=>[w(y(g.item.status),1)]),subtitle:b(()=>[w(y(g.item.date),1)]),content:b(()=>[(c(!0),d(S,null,$(g.item.content,(D,U)=>(c(),d("p",{key:U,class:"mt-0 mb-2"},y(D),1))),128))]),_:2},1024)]),_:1},8,["value"])]),_:1})])])]),r("div",ce,[r("div",de,[pe,v(a),ue])])])])}const ve=I(ne,[["render",me]]);export{ve as default};
