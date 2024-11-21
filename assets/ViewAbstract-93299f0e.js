import{B as E,e as K,o as r,n as c,m as u,p as y,v as q,u as k,q as p,t as g,Z as P,ao as H,r as A,j as I,w as V,a1 as z,a0 as x,T as Z,U as F,N as f,aE as B,f as w,M as W,D as T,H as M,d as X,X as D,R as Y,h as J,I as v,J as C,l as O,a6 as Q,k as S,a2 as $,aF as ee,_ as ne,A as te,aG as ie}from"./index-580c222f.js";import{s as ae,d as se,e as oe,c as re,b as ue}from"./index-09c12475.js";import{p as me}from"./data-statistics-2713a3e5.js";var le=function(e){var n=e.dt;return`
.p-progressbar {
    position: relative;
    overflow: hidden;
    height: `.concat(n("progressbar.height"),`;
    background: `).concat(n("progressbar.background"),`;
    border-radius: `).concat(n("progressbar.border.radius"),`;
}

.p-progressbar-value {
    margin: 0;
    background: `).concat(n("progressbar.value.background"),`;
}

.p-progressbar-label {
    color: `).concat(n("progressbar.label.color"),`;
    font-size: `).concat(n("progressbar.label.font.size"),`;
    font-weight: `).concat(n("progressbar.label.font.weight"),`;
}

.p-progressbar-determinate .p-progressbar-value {
    height: 100%;
    width: 0%;
    position: absolute;
    display: none;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: width 1s ease-in-out;
}

.p-progressbar-determinate .p-progressbar-label {
    display: inline-flex;
}

.p-progressbar-indeterminate .p-progressbar-value::before {
    content: "";
    position: absolute;
    background: inherit;
    top: 0;
    left: 0;
    bottom: 0;
    will-change: left, right;
    animation: p-progressbar-indeterminate-anim 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
}

.p-progressbar-indeterminate .p-progressbar-value::after {
    content: "";
    position: absolute;
    background: inherit;
    top: 0;
    left: 0;
    bottom: 0;
    will-change: left, right;
    animation: p-progressbar-indeterminate-anim-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
    animation-delay: 1.15s;
}

@-webkit-keyframes p-progressbar-indeterminate-anim {
    0% {
        left: -35%;
        right: 100%;
    }
    60% {
        left: 100%;
        right: -90%;
    }
    100% {
        left: 100%;
        right: -90%;
    }
}
@keyframes p-progressbar-indeterminate-anim {
    0% {
        left: -35%;
        right: 100%;
    }
    60% {
        left: 100%;
        right: -90%;
    }
    100% {
        left: 100%;
        right: -90%;
    }
}
@-webkit-keyframes p-progressbar-indeterminate-anim-short {
    0% {
        left: -200%;
        right: 100%;
    }
    60% {
        left: 107%;
        right: -8%;
    }
    100% {
        left: 107%;
        right: -8%;
    }
}
@keyframes p-progressbar-indeterminate-anim-short {
    0% {
        left: -200%;
        right: 100%;
    }
    60% {
        left: 107%;
        right: -8%;
    }
    100% {
        left: 107%;
        right: -8%;
    }
}
`)},ce={root:function(e){var n=e.instance;return["p-progressbar p-component",{"p-progressbar-determinate":n.determinate,"p-progressbar-indeterminate":n.indeterminate}]},value:"p-progressbar-value",label:"p-progressbar-label"},de=E.extend({name:"progressbar",theme:le,classes:ce}),he={name:"BaseProgressBar",extends:K,props:{value:{type:Number,default:null},mode:{type:String,default:"determinate"},showValue:{type:Boolean,default:!0}},style:de,provide:function(){return{$pcProgressBar:this,$parentInstance:this}}},_={name:"ProgressBar",extends:he,inheritAttrs:!1,computed:{progressStyle:function(){return{width:this.value+"%",display:"flex"}},indeterminate:function(){return this.mode==="indeterminate"},determinate:function(){return this.mode==="determinate"}}},fe=["aria-valuenow"];function ge(t,e,n,a,o,i){return r(),c("div",u({role:"progressbar",class:t.cx("root"),"aria-valuemin":"0","aria-valuenow":t.value,"aria-valuemax":"100"},t.ptmi("root")),[i.determinate?(r(),c("div",u({key:0,class:t.cx("value"),style:i.progressStyle},t.ptm("value")),[t.value!=null&&t.value!==0&&t.showValue?(r(),c("div",u({key:0,class:t.cx("label")},t.ptm("label")),[y(t.$slots,"default",{},function(){return[q(k(t.value+"%"),1)]})],16)):p("",!0)],16)):i.indeterminate?(r(),c("div",u({key:1,class:t.cx("value")},t.ptm("value")),null,16)):p("",!0)],16,fe)}_.render=ge;var R={name:"ChevronUpIcon",extends:ae},pe=g("path",{d:"M12.2097 10.4113C12.1057 10.4118 12.0027 10.3915 11.9067 10.3516C11.8107 10.3118 11.7237 10.2532 11.6506 10.1792L6.93602 5.46461L2.22139 10.1476C2.07272 10.244 1.89599 10.2877 1.71953 10.2717C1.54307 10.2556 1.3771 10.1808 1.24822 10.0593C1.11933 9.93766 1.035 9.77633 1.00874 9.6011C0.982477 9.42587 1.0158 9.2469 1.10338 9.09287L6.37701 3.81923C6.52533 3.6711 6.72639 3.58789 6.93602 3.58789C7.14565 3.58789 7.3467 3.6711 7.49502 3.81923L12.7687 9.09287C12.9168 9.24119 13 9.44225 13 9.65187C13 9.8615 12.9168 10.0626 12.7687 10.2109C12.616 10.3487 12.4151 10.4207 12.2097 10.4113Z",fill:"currentColor"},null,-1),be=[pe];function Ie(t,e,n,a,o,i){return r(),c("svg",u({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),be,16)}R.render=Ie;var ve=function(e){return e.dt,`
.p-scrolltop.p-button {
    position: fixed !important;
    bottom: 20px;
    right: 20px;
}

.p-scrolltop-sticky.p-button {
    position: sticky !important;
    display: flex;
    margin-left: auto;
}

.p-scrolltop-enter-from {
    opacity: 0;
}

.p-scrolltop-enter-active {
    transition: opacity 0.15s;
}

.p-scrolltop.p-scrolltop-leave-to {
    opacity: 0;
}

.p-scrolltop-leave-active {
    transition: opacity 0.15s;
}
`},ye={root:function(e){var n=e.props;return["p-scrolltop",{"p-scrolltop-sticky":n.target!=="window"}]},icon:"p-scrolltop-icon"},ke=E.extend({name:"scrolltop",theme:ve,classes:ye}),Le={name:"BaseScrollTop",extends:K,props:{target:{type:String,default:"window"},threshold:{type:Number,default:400},icon:{type:String,default:void 0},behavior:{type:String,default:"smooth"},buttonProps:{type:Object,default:function(){return{rounded:!0}}}},style:ke,provide:function(){return{$pcScrollTop:this,$parentInstance:this}}},G={name:"ScrollTop",extends:Le,inheritAttrs:!1,scrollListener:null,container:null,data:function(){return{visible:!1}},mounted:function(){this.target==="window"?this.bindDocumentScrollListener():this.target==="parent"&&this.bindParentScrollListener()},beforeUnmount:function(){this.target==="window"?this.unbindDocumentScrollListener():this.target==="parent"&&this.unbindParentScrollListener(),this.container&&(P.clear(this.container),this.overlay=null)},methods:{onClick:function(){var e=this.target==="window"?window:this.$el.parentElement;e.scroll({top:0,behavior:this.behavior})},checkVisibility:function(e){e>this.threshold?this.visible=!0:this.visible=!1},bindParentScrollListener:function(){var e=this;this.scrollListener=function(){e.checkVisibility(e.$el.parentElement.scrollTop)},this.$el.parentElement.addEventListener("scroll",this.scrollListener)},bindDocumentScrollListener:function(){var e=this;this.scrollListener=function(){e.checkVisibility(H())},window.addEventListener("scroll",this.scrollListener)},unbindParentScrollListener:function(){this.scrollListener&&(this.$el.parentElement.removeEventListener("scroll",this.scrollListener),this.scrollListener=null)},unbindDocumentScrollListener:function(){this.scrollListener&&(window.removeEventListener("scroll",this.scrollListener),this.scrollListener=null)},onEnter:function(e){P.set("overlay",e,this.$primevue.config.zIndex.overlay)},onAfterLeave:function(e){P.clear(e)},containerRef:function(e){this.container=e?e.$el:void 0},rootPTOptions:function(){return u(this.ptmi("root"),this.ptm("button"))},iconPTOptions:function(){return u(this.ptmi("root").icon,this.ptm("button").icon)}},computed:{scrollTopAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.scrollTop:void 0}},components:{ChevronUpIcon:R,Button:se}};function we(t,e,n,a,o,i){var m=A("Button");return r(),I(Z,u({name:"p-scrolltop",appear:"",onEnter:i.onEnter,onAfterLeave:i.onAfterLeave},t.ptm("transition")),{default:V(function(){return[o.visible?(r(),I(m,u({key:0,ref:i.containerRef,class:t.cx("root"),onClick:i.onClick,"aria-label":i.scrollTopAriaLabel,unstyled:t.unstyled},t.buttonProps,{pt:i.rootPTOptions()}),{icon:V(function(d){return[y(t.$slots,"icon",{class:z(t.cx("icon"))},function(){return[(r(),I(x(t.icon?"span":"ChevronUpIcon"),u({class:[t.cx("icon"),t.icon,d.class]},i.iconPTOptions),null,16,["class"]))]})]}),_:3},16,["class","onClick","aria-label","unstyled","pt"])):p("",!0)]}),_:3},16,["onEnter","onAfterLeave"])}G.render=we;var xe=function(e){var n=e.dt;return`
.p-megamenu {
    position: relative;
    display: flex;
    align-items: center;
    background: `.concat(n("megamenu.background"),`;
    border: 1px solid `).concat(n("megamenu.border.color"),`;
    border-radius: `).concat(n("megamenu.border.radius"),`;
    color: `).concat(n("megamenu.color"),`;
    gap: `).concat(n("megamenu.gap"),`;
}

.p-megamenu-start,
.p-megamenu-end {
    display: flex;
    align-items: center;
}

.p-megamenu-root-list {
    margin: 0;
    padding: 0;
    list-style: none;
    outline: 0 none;
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: `).concat(n("megamenu.gap"),`;
}

.p-megamenu-root-list > .p-megamenu-item > .p-menumegamenubar-item-content {
    border-radius: `).concat(n("megamenu.base.item.border.radius"),`;
}

.p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content > .p-megamenu-item-link {
    padding: `).concat(n("megamenu.base.item.padding"),`;
}

.p-megamenu-item-content {
    transition: background `).concat(n("megamenu.transition.duration"),", color ").concat(n("megamenu.transition.duration"),`;
    border-radius: `).concat(n("megamenu.item.border.radius"),`;
    color: `).concat(n("megamenu.item.color"),`;
}

.p-megamenu-item-link {
    cursor: pointer;
    display: flex;
    align-items: center;
    text-decoration: none;
    overflow: hidden;
    position: relative;
    color: inherit;
    padding: `).concat(n("megamenu.item.padding"),`;
    gap: `).concat(n("megamenu.item.gap"),`;
    user-select: none;
    outline: 0 none;
}

.p-megamenu-item-label {
    line-height: 1;
}

.p-megamenu-item-icon {
    color: `).concat(n("megamenu.item.icon.color"),`;
}

.p-megamenu-submenu-icon {
    color: `).concat(n("megamenu.submenu.icon.color"),`;
    font-size: `).concat(n("megamenu.submenu.icon.size"),`;
    width: `).concat(n("megamenu.submenu.icon.size"),`;
    height: `).concat(n("megamenu.submenu.icon.size"),`;
}

.p-megamenu-item.p-focus > .p-megamenu-item-content {
    color: `).concat(n("megamenu.item.focus.color"),`;
    background: `).concat(n("megamenu.item.focus.background"),`;
}

.p-megamenu-item.p-focus > .p-megamenu-item-content .p-megamenu-item-icon {
    color: `).concat(n("megamenu.item.icon.focus.color"),`;
}

.p-megamenu-item.p-focus > .p-megamenu-item-content .p-megamenu-submenu-icon {
    color: `).concat(n("megamenu.submenu.icon.focus.color"),`;
}

.p-megamenu-item:not(.p-disabled) > .p-megamenu-item-content:hover {
    color: `).concat(n("megamenu.item.focus.color"),`;
    background: `).concat(n("megamenu.item.focus.background"),`;
}

.p-megamenu-item:not(.p-disabled) > .p-megamenu-item-content:hover .p-megamenu-item-icon {
    color: `).concat(n("megamenu.item.icon.focus.color"),`;
}

.p-megamenu-item:not(.p-disabled) > .p-megamenu-item-content:hover .p-megamenu-submenu-icon {
    color: `).concat(n("megamenu.submenu.icon.focus.color"),`;
}

.p-megamenu-item-active > .p-megamenu-item-content {
    color: `).concat(n("megamenu.item.active.color"),`;
    background: `).concat(n("megamenu.item.active.background"),`;
}

.p-megamenu-item-active > .p-megamenu-item-content .p-megamenu-item-icon {
    color: `).concat(n("megamenu.item.icon.active.color"),`;
}

.p-megamenu-item-active > .p-megamenu-item-content .p-megamenu-submenu-icon {
    color: `).concat(n("megamenu.submenu.icon.active.color"),`;
}

.p-megamenu-overlay {
    display: none;
    position: absolute;
    width: auto;
    z-index: 1;
    left: 0;
    min-width: 100%;
    padding: `).concat(n("megamenu.overlay.padding"),`;
    background: `).concat(n("megamenu.overlay.background"),`;
    color: `).concat(n("megamenu.overlay.color"),`;
    border: 1px solid `).concat(n("megamenu.overlay.border.color"),`;
    border-radius: `).concat(n("megamenu.overlay.border.radius"),`;
    box-shadow: `).concat(n("megamenu.overlay.shadow"),`;
}

.p-megamenu-root-list > .p-megamenu-item-active > .p-megamenu-overlay {
    display: block;
}

.p-megamenu-submenu {
    margin: 0;
    list-style: none;
    padding: `).concat(n("megamenu.submenu.padding"),`;
    min-width: 12.5rem;
    display: flex;
    flex-direction: column;
    gap: `).concat(n("megamenu.submenu.gap"),`
}

.p-megamenu-submenu-label {
    padding: `).concat(n("megamenu.submenu.label.padding"),`;
    color: `).concat(n("megamenu.submenu.label.color"),`;
    font-weight: `).concat(n("megamenu.submenu.label.font.weight"),`;
    background: `).concat(n("megamenu.submenu.label.background"),`;
}

.p-megamenu-separator {
    border-top: 1px solid `).concat(n("megamenu.separator.border.color"),`;
}

.p-megamenu-horizontal {
    align-items: center;
    padding: `).concat(n("megamenu.horizontal.orientation.padding"),`;
}

.p-megamenu-horizontal .p-megamenu-root-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: `).concat(n("megamenu.horizontal.orientation.gap"),`;
}

.p-megamenu-horizontal .p-megamenu-end {
    margin-left: auto;
    align-self: center;
}

.p-megamenu-vertical {
    display: inline-flex;
    min-width: 12.5rem;
    flex-direction: column;
    align-items: stretch;
    padding: `).concat(n("megamenu.vertical.orientation.padding"),`;
}

.p-megamenu-vertical .p-megamenu-root-list {
    align-items: stretch;
    flex-direction: column;
    gap: `).concat(n("megamenu.vertical.orientation.gap"),`;
}

.p-megamenu-vertical .p-megamenu-root-list > .p-megamenu-item-active > .p-megamenu-overlay {
    left: 100%;
    top: 0;
}

.p-megamenu-vertical .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content .p-megamenu-submenu-icon {
    margin-left: auto;
}

.p-megamenu-grid {
    display: flex;
}

.p-megamenu-col-2,
.p-megamenu-col-3,
.p-megamenu-col-4,
.p-megamenu-col-6,
.p-megamenu-col-12 {
    flex: 0 0 auto;
    padding: `).concat(n("megamenu.overlay.gap"),`;
}

.p-megamenu-col-2 {
    width: 16.6667%;
}

.p-megamenu-col-3 {
    width: 25%;
}

.p-megamenu-col-4 {
    width: 33.3333%;
}

.p-megamenu-col-6 {
    width: 50%;
}

.p-megamenu-col-12 {
    width: 100%;
}

.p-megamenu-button {
    display: none;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: `).concat(n("megamenu.mobile.button.size"),`;
    height: `).concat(n("megamenu.mobile.button.size"),`;
    position: relative;
    color: `).concat(n("megamenu.mobile.button.color"),`;
    border: 0 none;
    background: transparent;
    border-radius: `).concat(n("megamenu.mobile.button.border.radius"),`;
    transition: background `).concat(n("megamenu.transition.duration"),", color ").concat(n("megamenu.transition.duration"),", outline-color ").concat(n("megamenu.transition.duration"),", ox-shadow ").concat(n("megamenu.transition.duration"),`;
    outline-color: transparent;
}

.p-megamenu-button:hover {
    color: `).concat(n("megamenu.mobile.button.hover.color"),`;
    background: `).concat(n("megamenu.mobile.button.hover.background"),`;
}

.p-megamenu-button:focus-visible {
    box-shadow: `).concat(n("megamenu.mobile.button.focus.ring.shadow"),`;
    outline: `).concat(n("megamenu.mobile.button.focus.ring.width")," ").concat(n("megamenu.mobile.button.focus.ring.style")," ").concat(n("megamenu.mobile.button.focus.ring.color"),`;
    outline-offset: `).concat(n("megamenu.mobile.button.focus.ring.offset"),`;
}

.p-megamenu-mobile {
    display: flex;
}

.p-megamenu-mobile .p-megamenu-button {
    display: flex;
}

.p-megamenu-mobile .p-megamenu-root-list {
    position: absolute;
    display: none;
    flex-direction: column;
    top: 100%;
    left: 0;
    z-index: 1;
    width: 100%;
    padding: `).concat(n("megamenu.submenu.padding"),`;
    gap: `).concat(n("megamenu.submenu.gap"),`;
    background: `).concat(n("megamenu.overlay.background"),`;
    border: 1px solid `).concat(n("megamenu.overlay.border.color"),`;
    box-shadow: `).concat(n("menubar.overlay.shadow"),`;
}

.p-megamenu-mobile-active .p-megamenu-root-list {
    display: flex;
}

.p-megamenu-mobile .p-megamenu-root-list .p-megamenu-item {
    width: 100%;
    position: static;
}

.p-megamenu-mobile .p-megamenu-overlay {
    position: static;
    border: 0 none;
    border-radius: 0;
    box-shadow: none;
}

.p-megamenu-mobile .p-megamenu-grid {
    flex-wrap: wrap;
    overflow: auto;
    max-height: 90%;
}

.p-megamenu-mobile .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content .p-megamenu-submenu-icon {
    margin-left: auto;
    transition: transform 0.2s;
}

.p-megamenu-mobile .p-megamenu-root-list > .p-megamenu-item-active > .p-megamenu-item-content .p-megamenu-submenu-icon {
    transform: rotate(-180deg);
}
`)},Pe={submenu:function(e){var n=e.instance,a=e.processedItem;return{display:n.isItemActive(a)?"block":"none"}}},Se={root:function(e){var n=e.instance;return["p-megamenu p-component",{"p-megamenu-mobile":n.queryMatches,"p-megamenu-mobile-active":n.mobileActive,"p-megamenu-horizontal":n.horizontal,"p-megamenu-vertical":n.vertical}]},start:"p-megamenu-start",button:"p-megamenu-button",rootList:"p-megamenu-root-list",submenuLabel:function(e){var n=e.instance,a=e.processedItem;return["p-megamenu-submenu-label",{"p-disabled":n.isItemDisabled(a)}]},item:function(e){var n=e.instance,a=e.processedItem;return["p-megamenu-item",{"p-megamenu-item-active":n.isItemActive(a),"p-focus":n.isItemFocused(a),"p-disabled":n.isItemDisabled(a)}]},itemContent:"p-megamenu-item-content",itemLink:"p-megamenu-item-link",itemIcon:"p-megamenu-item-icon",itemLabel:"p-megamenu-item-label",submenuIcon:"p-megamenu-submenu-icon",overlay:"p-megamenu-overlay",grid:"p-megamenu-grid",column:function(e){var n=e.instance,a=e.processedItem,o=n.isItemGroup(a)?a.items.length:0,i;if(n.$parentInstance.queryMatches)i="p-megamenu-col-12";else switch(o){case 2:i="p-megamenu-col-6";break;case 3:i="p-megamenu-col-4";break;case 4:i="p-megamenu-col-3";break;case 6:i="p-megamenu-col-2";break;default:i="p-megamenu-col-12";break}return i},submenu:"p-megamenu-submenu",separator:"p-megamenu-separator",end:"p-megamenu-end"},Ce=E.extend({name:"megamenu",theme:xe,classes:Se,inlineStyles:Pe}),Ae={name:"BaseMegaMenu",extends:K,props:{model:{type:Array,default:null},orientation:{type:String,default:"horizontal"},breakpoint:{type:String,default:"960px"},disabled:{type:Boolean,default:!1},tabindex:{type:Number,default:0},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:Ce,provide:function(){return{$pcMegaMenu:this,$parentInstance:this}}},N={name:"MegaMenuSub",hostName:"MegaMenu",extends:K,emits:["item-click","item-mouseenter"],props:{menuId:{type:String,default:null},focusedItemId:{type:String,default:null},horizontal:{type:Boolean,default:!1},submenu:{type:Object,default:null},mobileActive:{type:Boolean,default:!1},items:{type:Array,default:null},level:{type:Number,default:0},templates:{type:Object,default:null},activeItem:{type:Object,default:null},tabindex:{type:Number,default:0}},methods:{getSubListId:function(e){return"".concat(this.getItemId(e),"_list")},getSubListKey:function(e){return this.getSubListId(e)},getItemId:function(e){return"".concat(this.menuId,"_").concat(e.key)},getItemKey:function(e){return this.getItemId(e)},getItemProp:function(e,n,a){return e&&e.item?B(e.item[n],a):void 0},getItemLabel:function(e){return this.getItemProp(e,"label")},getPTOptions:function(e,n,a){return this.ptm(a,{context:{item:e.item,index:n,active:this.isItemActive(e),focused:this.isItemFocused(e),disabled:this.isItemDisabled(e)}})},isItemActive:function(e){return f(this.activeItem)?this.activeItem.key===e.key:!1},isItemVisible:function(e){return this.getItemProp(e,"visible")!==!1},isItemDisabled:function(e){return this.getItemProp(e,"disabled")},isItemFocused:function(e){return this.focusedItemId===this.getItemId(e)},isItemGroup:function(e){return f(e.items)},onItemClick:function(e,n){this.getItemProp(n,"command",{originalEvent:e,item:n.item}),this.$emit("item-click",{originalEvent:e,processedItem:n,isFocus:!0})},onItemMouseEnter:function(e,n){this.$emit("item-mouseenter",{originalEvent:e,processedItem:n})},getAriaSetSize:function(){var e=this;return this.items.filter(function(n){return e.isItemVisible(n)&&!e.getItemProp(n,"separator")}).length},getAriaPosInset:function(e){var n=this;return e-this.items.slice(0,e).filter(function(a){return n.isItemVisible(a)&&n.getItemProp(a,"separator")}).length+1},getMenuItemProps:function(e,n){return{action:u({class:this.cx("itemLink"),tabindex:-1,"aria-hidden":!0},this.getPTOptions(e,n,"itemLink")),icon:u({class:[this.cx("itemIcon"),this.getItemProp(e,"icon")]},this.getPTOptions(e,n,"itemIcon")),label:u({class:this.cx("label")},this.getPTOptions(e,n,"label")),submenuicon:u({class:this.cx("submenuIcon")},this.getPTOptions(e,n,"submenuIcon"))}}},components:{AngleRightIcon:re,AngleDownIcon:ue},directives:{ripple:Y}},Ke=["tabindex"],Me=["id","aria-label","aria-disabled","aria-expanded","aria-haspopup","aria-level","aria-setsize","aria-posinset","data-p-active","data-p-focused","data-p-disabled"],Ee=["onClick","onMouseenter"],ze=["href","target"],Ve=["id"];function Fe(t,e,n,a,o,i){var m=A("MegaMenuSub",!0),d=J("ripple");return r(),c("ul",u({class:n.level===0?t.cx("rootList"):t.cx("submenu"),tabindex:n.tabindex},n.level===0?t.ptm("rootList"):t.ptm("submenu")),[n.submenu?(r(),c("li",u({key:0,class:[t.cx("submenuLabel",{submenu:n.submenu}),i.getItemProp(n.submenu,"class")],style:i.getItemProp(n.submenu,"style"),role:"presentation"},t.ptm("submenuLabel")),k(i.getItemLabel(n.submenu)),17)):p("",!0),(r(!0),c(v,null,C(n.items,function(s,l){return r(),c(v,{key:i.getItemKey(s)},[i.isItemVisible(s)&&!i.getItemProp(s,"separator")?(r(),c("li",u({key:0,id:i.getItemId(s),style:i.getItemProp(s,"style"),class:[t.cx("item",{processedItem:s}),i.getItemProp(s,"class")],role:"menuitem","aria-label":i.getItemLabel(s),"aria-disabled":i.isItemDisabled(s)||void 0,"aria-expanded":i.isItemGroup(s)?i.isItemActive(s):void 0,"aria-haspopup":i.isItemGroup(s)&&!i.getItemProp(s,"to")?"menu":void 0,"aria-level":n.level+1,"aria-setsize":i.getAriaSetSize(),"aria-posinset":i.getAriaPosInset(l),ref_for:!0},i.getPTOptions(s,l,"item"),{"data-p-active":i.isItemActive(s),"data-p-focused":i.isItemFocused(s),"data-p-disabled":i.isItemDisabled(s)}),[g("div",u({class:t.cx("itemContent"),onClick:function(h){return i.onItemClick(h,s)},onMouseenter:function(h){return i.onItemMouseEnter(h,s)},ref_for:!0},i.getPTOptions(s,l,"itemContent")),[n.templates.item?(r(),I(x(n.templates.item),{key:1,item:s.item,hasSubmenu:i.isItemGroup(s),label:i.getItemLabel(s),props:i.getMenuItemProps(s,l)},null,8,["item","hasSubmenu","label","props"])):O((r(),c("a",u({key:0,href:i.getItemProp(s,"url"),class:t.cx("itemLink"),target:i.getItemProp(s,"target"),tabindex:"-1",ref_for:!0},i.getPTOptions(s,l,"itemLink")),[n.templates.itemicon?(r(),I(x(n.templates.itemicon),{key:0,item:s.item,class:z(t.cx("itemIcon"))},null,8,["item","class"])):i.getItemProp(s,"icon")?(r(),c("span",u({key:1,class:[t.cx("itemIcon"),i.getItemProp(s,"icon")],ref_for:!0},i.getPTOptions(s,l,"itemIcon")),null,16)):p("",!0),g("span",u({class:t.cx("itemLabel"),ref_for:!0},i.getPTOptions(s,l,"itemLabel")),k(i.getItemLabel(s)),17),i.isItemGroup(s)?(r(),c(v,{key:2},[n.templates.submenuicon?(r(),I(x(n.templates.submenuicon),u({key:0,active:i.isItemActive(s),class:t.cx("submenuIcon"),ref_for:!0},i.getPTOptions(s,l,"submenuIcon")),null,16,["active","class"])):(r(),I(x(n.horizontal||n.mobileActive?"AngleDownIcon":"AngleRightIcon"),u({key:1,class:t.cx("submenuIcon"),ref_for:!0},i.getPTOptions(s,l,"submenuIcon")),null,16,["class"]))],64)):p("",!0)],16,ze)),[[d]])],16,Ee),i.isItemVisible(s)&&i.isItemGroup(s)?(r(),c("div",u({key:0,class:t.cx("overlay"),ref_for:!0},t.ptm("overlay")),[g("div",u({class:t.cx("grid"),ref_for:!0},t.ptm("grid")),[(r(!0),c(v,null,C(s.items,function(b){return r(),c("div",u({key:i.getItemKey(b),class:t.cx("column",{processedItem:s}),ref_for:!0},t.ptm("column")),[(r(!0),c(v,null,C(b,function(h){return r(),I(m,{key:i.getSubListKey(h),id:i.getSubListId(h),style:Q(t.sx("submenu",!0,{processedItem:s})),role:"menu",menuId:n.menuId,focusedItemId:n.focusedItemId,submenu:h,items:h.items,templates:n.templates,level:n.level+1,mobileActive:n.mobileActive,pt:t.pt,unstyled:t.unstyled,onItemClick:e[0]||(e[0]=function(L){return t.$emit("item-click",L)}),onItemMouseenter:e[1]||(e[1]=function(L){return t.$emit("item-mouseenter",L)})},null,8,["id","style","menuId","focusedItemId","submenu","items","templates","level","mobileActive","pt","unstyled"])}),128))],16)}),128))],16)],16)):p("",!0)],16,Me)):p("",!0),i.isItemVisible(s)&&i.getItemProp(s,"separator")?(r(),c("li",u({key:1,id:i.getItemId(s),class:[t.cx("separator"),i.getItemProp(s,"class")],style:i.getItemProp(s,"style"),role:"separator",ref_for:!0},t.ptm("separator")),null,16,Ve)):p("",!0)],64)}),128))],16,Ke)}N.render=Fe;var U={name:"MegaMenu",extends:Ae,inheritAttrs:!1,emits:["focus","blur"],outsideClickListener:null,resizeListener:null,matchMediaListener:null,container:null,menubar:null,searchTimeout:null,searchValue:null,data:function(){return{id:this.$attrs.id,mobileActive:!1,focused:!1,focusedItemInfo:{index:-1,key:"",parentKey:""},activeItem:null,dirty:!1,query:null,queryMatches:!1}},watch:{"$attrs.id":function(e){this.id=e||F()},activeItem:function(e){f(e)?(this.bindOutsideClickListener(),this.bindResizeListener()):(this.unbindOutsideClickListener(),this.unbindResizeListener())}},mounted:function(){this.id=this.id||F(),this.bindMatchMediaListener()},beforeUnmount:function(){this.mobileActive=!1,this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindMatchMediaListener()},methods:{getItemProp:function(e,n){return e?B(e[n]):void 0},getItemLabel:function(e){return this.getItemProp(e,"label")},isItemDisabled:function(e){return this.getItemProp(e,"disabled")},isItemVisible:function(e){return this.getItemProp(e,"visible")!==!1},isItemGroup:function(e){return f(this.getItemProp(e,"items"))},isItemSeparator:function(e){return this.getItemProp(e,"separator")},getProccessedItemLabel:function(e){return e?this.getItemLabel(e.item):void 0},isProccessedItemGroup:function(e){return e&&f(e.items)},toggle:function(e){var n=this;this.mobileActive?(this.mobileActive=!1,P.clear(this.menubar),this.hide()):(this.mobileActive=!0,P.set("menu",this.menubar,this.$primevue.config.zIndex.menu),setTimeout(function(){n.show()},1)),this.bindOutsideClickListener(),e.preventDefault()},show:function(){this.focusedItemInfo={index:this.findFirstFocusedItemIndex(),level:0,parentKey:""},w(this.menubar)},hide:function(e,n){var a=this;this.mobileActive&&(this.mobileActive=!1,setTimeout(function(){w(a.$refs.menubutton)},0)),this.activeItem=null,this.focusedItemInfo={index:-1,key:"",parentKey:""},n&&w(this.menubar),this.dirty=!1},onFocus:function(e){if(this.focused=!0,this.focusedItemInfo.index===-1){var n=this.findFirstFocusedItemIndex(),a=this.findVisibleItem(n);this.focusedItemInfo={index:n,key:a.key,parentKey:a.parentKey}}this.$emit("focus",e)},onBlur:function(e){this.focused=!1,this.focusedItemInfo={index:-1,key:"",parentKey:""},this.searchValue="",this.dirty=!1,this.$emit("blur",e)},onKeyDown:function(e){if(this.disabled){e.preventDefault();return}var n=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"ArrowLeft":this.onArrowLeftKey(e);break;case"ArrowRight":this.onArrowRightKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"Space":this.onSpaceKey(e);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"PageDown":case"PageUp":case"Backspace":case"ShiftLeft":case"ShiftRight":break;default:!n&&W(e.key)&&this.searchItems(e,e.key);break}},onItemChange:function(e){var n=e.processedItem,a=e.isFocus;if(!T(n)){var o=n.index,i=n.key,m=n.parentKey,d=n.items,s=f(d);s&&(this.activeItem=n),this.focusedItemInfo={index:o,key:i,parentKey:m},s&&(this.dirty=!0),a&&w(this.menubar)}},onItemClick:function(e){var n=e.originalEvent,a=e.processedItem,o=this.isProccessedItemGroup(a),i=T(a.parent),m=this.isSelected(a);if(m){var d=a.index,s=a.key,l=a.parentKey;this.activeItem=null,this.focusedItemInfo={index:d,key:s,parentKey:l},this.dirty=!i,w(this.menubar)}else o?this.onItemChange(e):this.hide(n)},onItemMouseEnter:function(e){!this.mobileActive&&this.dirty&&this.onItemChange(e)},menuButtonClick:function(e){this.toggle(e)},menuButtonKeydown:function(e){(e.code==="Enter"||e.code==="NumpadEnter"||e.code==="Space")&&this.menuButtonClick(e)},onArrowDownKey:function(e){if(this.horizontal)if(f(this.activeItem)&&this.activeItem.key===this.focusedItemInfo.key)this.focusedItemInfo={index:-1,key:"",parentKey:this.activeItem.key};else{var n=this.findVisibleItem(this.focusedItemInfo.index),a=this.isProccessedItemGroup(n);a&&(this.onItemChange({originalEvent:e,processedItem:n}),this.focusedItemInfo={index:-1,key:n.key,parentKey:n.parentKey},this.searchValue="")}var o=this.focusedItemInfo.index!==-1?this.findNextItemIndex(this.focusedItemInfo.index):this.findFirstFocusedItemIndex();this.changeFocusedItemInfo(e,o),e.preventDefault()},onArrowUpKey:function(e){if(e.altKey&&this.horizontal){if(this.focusedItemInfo.index!==-1){var n=this.findVisibleItem(this.focusedItemInfo.index),a=this.isProccessedItemGroup(n);!a&&f(this.activeItem)&&(this.focusedItemInfo.index===0?(this.focusedItemInfo={index:this.activeItem.index,key:this.activeItem.key,parentKey:this.activeItem.parentKey},this.activeItem=null):this.changeFocusedItemInfo(e,this.findFirstItemIndex()))}e.preventDefault()}else{var o=this.focusedItemInfo.index!==-1?this.findPrevItemIndex(this.focusedItemInfo.index):this.findLastFocusedItemIndex();this.changeFocusedItemInfo(e,o),e.preventDefault()}},onArrowLeftKey:function(e){var n=this.findVisibleItem(this.focusedItemInfo.index),a=this.isProccessedItemGroup(n);if(a){if(this.horizontal){var o=this.focusedItemInfo.index!==-1?this.findPrevItemIndex(this.focusedItemInfo.index):this.findLastFocusedItemIndex();this.changeFocusedItemInfo(e,o)}}else{this.vertical&&f(this.activeItem)&&n.columnIndex===0&&(this.focusedItemInfo={index:this.activeItem.index,key:this.activeItem.key,parentKey:this.activeItem.parentKey},this.activeItem=null);var i=n.columnIndex-1,m=this.visibleItems.findIndex(function(d){return d.columnIndex===i});m!==-1&&this.changeFocusedItemInfo(e,m)}e.preventDefault()},onArrowRightKey:function(e){var n=this.findVisibleItem(this.focusedItemInfo.index),a=this.isProccessedItemGroup(n);if(a){if(this.vertical)if(f(this.activeItem)&&this.activeItem.key===n.key)this.focusedItemInfo={index:-1,key:"",parentKey:this.activeItem.key};else{var o=this.findVisibleItem(this.focusedItemInfo.index),i=this.isProccessedItemGroup(o);i&&(this.onItemChange({originalEvent:e,processedItem:o}),this.focusedItemInfo={index:-1,key:o.key,parentKey:o.parentKey},this.searchValue="")}var m=this.focusedItemInfo.index!==-1?this.findNextItemIndex(this.focusedItemInfo.index):this.findFirstFocusedItemIndex();this.changeFocusedItemInfo(e,m)}else{var d=n.columnIndex+1,s=this.visibleItems.findIndex(function(l){return l.columnIndex===d});s!==-1&&this.changeFocusedItemInfo(e,s)}e.preventDefault()},onHomeKey:function(e){this.changeFocusedItemInfo(e,this.findFirstItemIndex()),e.preventDefault()},onEndKey:function(e){this.changeFocusedItemInfo(e,this.findLastItemIndex()),e.preventDefault()},onEnterKey:function(e){if(this.focusedItemInfo.index!==-1){var n=M(this.menubar,'li[id="'.concat("".concat(this.focusedItemId),'"]')),a=n&&M(n,'a[data-pc-section="itemlink"]');a?a.click():n&&n.click();var o=this.visibleItems[this.focusedItemInfo.index],i=this.isProccessedItemGroup(o);!i&&this.changeFocusedItemInfo(e,this.findFirstFocusedItemIndex())}e.preventDefault()},onSpaceKey:function(e){this.onEnterKey(e)},onEscapeKey:function(e){f(this.activeItem)&&(this.focusedItemInfo={index:this.activeItem.index,key:this.activeItem.key},this.activeItem=null),e.preventDefault()},onTabKey:function(e){if(this.focusedItemInfo.index!==-1){var n=this.findVisibleItem(this.focusedItemInfo.index),a=this.isProccessedItemGroup(n);!a&&this.onItemChange({originalEvent:e,processedItem:n})}this.hide()},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var a=e.container&&!e.container.contains(n.target),o=!(e.target&&(e.target===n.target||e.target.contains(n.target)));a&&o&&e.hide()},document.addEventListener("click",this.outsideClickListener))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener),this.outsideClickListener=null)},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(n){X()||e.hide(n,!0),e.mobileActive=!1},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindMatchMediaListener:function(){var e=this;if(!this.matchMediaListener){var n=matchMedia("(max-width: ".concat(this.breakpoint,")"));this.query=n,this.queryMatches=n.matches,this.matchMediaListener=function(){e.queryMatches=n.matches,e.mobileActive=!1},this.query.addEventListener("change",this.matchMediaListener)}},unbindMatchMediaListener:function(){this.matchMediaListener&&(this.query.removeEventListener("change",this.matchMediaListener),this.matchMediaListener=null)},isItemMatched:function(e){var n;return this.isValidItem(e)&&((n=this.getProccessedItemLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase().startsWith(this.searchValue.toLocaleLowerCase()))},isValidItem:function(e){return!!e&&!this.isItemDisabled(e.item)&&!this.isItemSeparator(e.item)&&this.isItemVisible(e.item)},isValidSelectedItem:function(e){return this.isValidItem(e)&&this.isSelected(e)},isSelected:function(e){return f(this.activeItem)?this.activeItem.key===e.key:!1},findFirstItemIndex:function(){var e=this;return this.visibleItems.findIndex(function(n){return e.isValidItem(n)})},findLastItemIndex:function(){var e=this;return D(this.visibleItems,function(n){return e.isValidItem(n)})},findNextItemIndex:function(e){var n=this,a=e<this.visibleItems.length-1?this.visibleItems.slice(e+1).findIndex(function(o){return n.isValidItem(o)}):-1;return a>-1?a+e+1:e},findPrevItemIndex:function(e){var n=this,a=e>0?D(this.visibleItems.slice(0,e),function(o){return n.isValidItem(o)}):-1;return a>-1?a:e},findSelectedItemIndex:function(){var e=this;return this.visibleItems.findIndex(function(n){return e.isValidSelectedItem(n)})},findFirstFocusedItemIndex:function(){var e=this.findSelectedItemIndex();return e<0?this.findFirstItemIndex():e},findLastFocusedItemIndex:function(){var e=this.findSelectedItemIndex();return e<0?this.findLastItemIndex():e},findVisibleItem:function(e){return f(this.visibleItems)?this.visibleItems[e]:null},searchItems:function(e,n){var a=this;this.searchValue=(this.searchValue||"")+n;var o=-1,i=!1;return this.focusedItemInfo.index!==-1?(o=this.visibleItems.slice(this.focusedItemInfo.index).findIndex(function(m){return a.isItemMatched(m)}),o=o===-1?this.visibleItems.slice(0,this.focusedItemInfo.index).findIndex(function(m){return a.isItemMatched(m)}):o+this.focusedItemInfo.index):o=this.visibleItems.findIndex(function(m){return a.isItemMatched(m)}),o!==-1&&(i=!0),o===-1&&this.focusedItemInfo.index===-1&&(o=this.findFirstFocusedItemIndex()),o!==-1&&this.changeFocusedItemInfo(e,o),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){a.searchValue="",a.searchTimeout=null},500),i},changeFocusedItemInfo:function(e,n){var a=this.findVisibleItem(n);this.focusedItemInfo.index=n,this.focusedItemInfo.key=f(a)?a.key:"",this.scrollInView()},scrollInView:function(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1,n=e!==-1?"".concat(this.id,"_").concat(e):this.focusedItemId,a=M(this.menubar,'li[id="'.concat(n,'"]'));a&&a.scrollIntoView&&a.scrollIntoView({block:"nearest",inline:"start"})},createProcessedItems:function(e){var n=this,a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0,o=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},i=arguments.length>3&&arguments[3]!==void 0?arguments[3]:"",m=arguments.length>4?arguments[4]:void 0,d=[];return e&&e.forEach(function(s,l){var b=(i!==""?i+"_":"")+(m!==void 0?m+"_":"")+l,h={item:s,index:l,level:a,key:b,parent:o,parentKey:i,columnIndex:m!==void 0?m:o.columnIndex!==void 0?o.columnIndex:l};h.items=a===0&&s.items&&s.items.length>0?s.items.map(function(L,j){return n.createProcessedItems(L,a+1,h,b,j)}):n.createProcessedItems(s.items,a+1,h,b),d.push(h)}),d},containerRef:function(e){this.container=e},menubarRef:function(e){this.menubar=e?e.$el:void 0}},computed:{processedItems:function(){return this.createProcessedItems(this.model||[])},visibleItems:function(){var e=f(this.activeItem)?this.activeItem:null;return e&&e.key===this.focusedItemInfo.parentKey?e.items.reduce(function(n,a){return a.forEach(function(o){o.items.forEach(function(i){n.push(i)})}),n},[]):this.processedItems},horizontal:function(){return this.orientation==="horizontal"},vertical:function(){return this.orientation==="vertical"},focusedItemId:function(){return f(this.focusedItemInfo.key)?"".concat(this.id,"_").concat(this.focusedItemInfo.key):null}},components:{MegaMenuSub:N,BarsIcon:oe}},Te=["id"],De=["aria-haspopup","aria-expanded","aria-controls","aria-label"];function Be(t,e,n,a,o,i){var m=A("BarsIcon"),d=A("MegaMenuSub");return r(),c("div",u({ref:i.containerRef,id:o.id,class:t.cx("root")},t.ptmi("root")),[t.$slots.start?(r(),c("div",u({key:0,class:t.cx("start")},t.ptm("start")),[y(t.$slots,"start")],16)):p("",!0),y(t.$slots,t.$slots.button?"button":"menubutton",{id:o.id,class:z(t.cx("button")),toggleCallback:function(l){return i.menuButtonClick(l)}},function(){var s;return[t.model&&t.model.length>0?(r(),c("a",u({key:0,ref:"menubutton",role:"button",tabindex:"0",class:t.cx("button"),"aria-haspopup":!!(t.model.length&&t.model.length>0),"aria-expanded":o.mobileActive,"aria-controls":o.id,"aria-label":(s=t.$primevue.config.locale.aria)===null||s===void 0?void 0:s.navigation,onClick:e[0]||(e[0]=function(l){return i.menuButtonClick(l)}),onKeydown:e[1]||(e[1]=function(l){return i.menuButtonKeydown(l)})},t.ptm("button")),[y(t.$slots,t.$slots.buttonicon?"buttonicon":"menubuttonicon",{},function(){return[S(m,$(ee(t.ptm("buttonicon"))),null,16)]})],16,De)):p("",!0)]}),S(d,{ref:i.menubarRef,id:o.id+"_list",tabindex:t.disabled?-1:t.tabindex,role:"menubar","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-disabled":t.disabled||void 0,"aria-orientation":t.orientation,"aria-activedescendant":o.focused?i.focusedItemId:void 0,menuId:o.id,focusedItemId:o.focused?i.focusedItemId:void 0,items:i.processedItems,horizontal:i.horizontal,templates:t.$slots,activeItem:o.activeItem,mobileActive:o.mobileActive,level:0,pt:t.pt,unstyled:t.unstyled,onFocus:i.onFocus,onBlur:i.onBlur,onKeydown:i.onKeyDown,onItemClick:i.onItemClick,onItemMouseenter:i.onItemMouseEnter},null,8,["id","tabindex","aria-label","aria-labelledby","aria-disabled","aria-orientation","aria-activedescendant","menuId","focusedItemId","items","horizontal","templates","activeItem","mobileActive","pt","unstyled","onFocus","onBlur","onKeydown","onItemClick","onItemMouseenter"]),t.$slots.end?(r(),c("div",u({key:1,class:t.cx("end")},t.ptm("end")),[y(t.$slots,"end")],16)):p("",!0)],16,Te)}U.render=Be;const Oe={methods:{viewBlocks(t){document.querySelector(t).scrollIntoView({behavior:"smooth"})},async loadPaperCollection(t,e){this.loading=!0;let n;n="https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/meta_json/"+t+" - "+e+".json",await fetch(n).then(a=>{if(a.ok)return a.json()}).then(a=>{this.paperCollection=a}).catch(a=>{console.log(a)}).then(()=>{this.loading=!1})},constructPublicationItems(){let t=[{label:"Top Tier",icon:"pi pi-shield",items:[]},{label:"Software Engineering",icon:"pi pi-code",items:[]}];for(let e in this.paperStatis.byPublicationAndYear){let n;["IEEE S&P","ACM CCS","USENIX Sec","NDSS"].includes(e)?n=0:["ISSTA","ICSE"].includes(e)&&(n=1);const a=this.paperStatis.byPublicationAndYear[e];let o={label:e,items:[]};for(let i in a)o.items.push({label:i,command:()=>{this.paperSet=`${e} ${i} - ${a[i]} papers`,this.paperCollection=this.loadPaperCollection(e,i)}});o.items=o.items.reverse(),t[n].items.push([o])}this.items=t}},data(){return{paperStatis:me,paperCollection:[],loading:!1,paperSet:"Please select a publication first.",items:[]}},mounted(){this.constructPublicationItems()}},_e={class:"p-5"},Re={class:"grid"},Ge={class:"col-12"},Ne={class:"surface-card shadow-2 border-round p-4"},Ue={class:"p-4"},je={class:"text-xl text-900 font-medium my-2"},qe={class:"list-none p-0 mt-4"},He={class:"font-medium text-900 mb-2 mt-2"},Ze=["href"],We={class:"line-height-3 text-600"};function Xe(t,e,n,a,o,i){const m=U,d=G,s=te,l=_,b=ie;return r(),c("div",_e,[g("div",Re,[g("div",Ge,[g("div",Ne,[S(m,{model:o.items},null,8,["model"]),g("div",Ue,[g("div",je,k(o.paperSet),1),O(S(d,{class:"animate-duration-1000 animate-ease-in-out"},null,512),[[b,{enterClass:"animate-fadeinleft",leaveClass:"animate-fadeoutleft"}]]),g("ul",qe,[(r(!0),c(v,null,C(o.paperCollection,h=>(r(),c("li",{key:h.id},[g("div",He,[g("a",{class:"text-primary",href:h.paper,target:"_blank"},k(h.title),9,Ze)]),g("div",We,k(h.abstract),1),S(s)]))),128))]),o.loading?(r(),I(l,{key:0,mode:"indeterminate",style:{height:"6px"}})):p("",!0)])])])])])}const $e=ne(Oe,[["render",Xe]]);export{$e as default};
