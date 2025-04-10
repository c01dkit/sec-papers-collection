import{B as R,ar as F,as as T,l as S,a as i,c as l,m as u,x as U,j as k,a4 as b,b as s,t as c,i as h,g as D,k as M,G as O,_ as L,r as H,o as q,F as x,y as w,a3 as C,f as _,aF as A,p as W,e as G,s as X}from"./index-DPRLEnKl.js";import{U as I}from"./index-Cu-nzgsh.js";var J={root:function(a){var e=a.instance;return["p-step",{"p-step-active":e.active,"p-disabled":e.isStepDisabled}]},header:"p-step-header",number:"p-step-number",title:"p-step-title"},K=R.extend({name:"step",classes:J}),E={name:"StepperSeparator",hostName:"Stepper",extends:S};function Q(t,a,e,d,v,n){return i(),l("span",u({class:t.cx("separator")},t.ptm("separator")),null,16)}E.render=Q;var Y={name:"BaseStep",extends:S,props:{value:{type:[String,Number],default:void 0},disabled:{type:Boolean,default:!1},asChild:{type:Boolean,default:!1},as:{type:[String,Object],default:"DIV"}},style:K,provide:function(){return{$pcStep:this,$parentInstance:this}}},j={name:"Step",extends:Y,inheritAttrs:!1,inject:{$pcStepper:{default:null},$pcStepList:{default:null},$pcStepItem:{default:null}},data:function(){return{isSeparatorVisible:!1}},mounted:function(){if(this.$el&&this.$pcStepList){var a=F(this.$el,T(this.$pcStepper.$el,'[data-pc-name="step"]')),e=T(this.$pcStepper.$el,'[data-pc-name="step"]').length;this.isSeparatorVisible=a!==e-1}},methods:{getPTOptions:function(a){var e=a==="root"?this.ptmi:this.ptm;return e(a,{context:{active:this.active,disabled:this.isStepDisabled}})},onStepClick:function(){this.$pcStepper.updateValue(this.activeValue)}},computed:{active:function(){return this.$pcStepper.isStepActive(this.activeValue)},activeValue:function(){var a;return this.$pcStepItem?(a=this.$pcStepItem)===null||a===void 0?void 0:a.value:this.value},isStepDisabled:function(){return!this.active&&(this.$pcStepper.isStepDisabled()||this.disabled)},id:function(){var a;return"".concat((a=this.$pcStepper)===null||a===void 0?void 0:a.id,"_step_").concat(this.activeValue)},ariaControls:function(){var a;return"".concat((a=this.$pcStepper)===null||a===void 0?void 0:a.id,"_steppanel_").concat(this.activeValue)},a11yAttrs:function(){return{root:{role:"presentation","aria-current":this.active?"step":void 0,"data-pc-name":"step","data-pc-section":"root","data-p-disabled":this.isStepDisabled,"data-p-active":this.active},header:{id:this.id,role:"tab",taindex:this.disabled?-1:void 0,"aria-controls":this.ariaControls,"data-pc-section":"header",disabled:this.isStepDisabled,onClick:this.onStepClick}}}},components:{StepperSeparator:E}},Z=["id","tabindex","aria-controls","disabled"];function ee(t,a,e,d,v,n){var m=U("StepperSeparator");return t.asChild?h(t.$slots,"default",{key:1,class:O(t.cx("root")),active:n.active,value:t.value,a11yAttrs:n.a11yAttrs,activateCallback:n.onStepClick}):(i(),k(M(t.as),u({key:0,class:t.cx("root"),"aria-current":n.active?"step":void 0,role:"presentation","data-p-active":n.active,"data-p-disabled":n.isStepDisabled},n.getPTOptions("root")),{default:b(function(){return[s("button",u({id:n.id,class:t.cx("header"),role:"tab",type:"button",tabindex:n.isStepDisabled?-1:void 0,"aria-controls":n.ariaControls,disabled:n.isStepDisabled,onClick:a[0]||(a[0]=function(){return n.onStepClick&&n.onStepClick.apply(n,arguments)})},n.getPTOptions("header")),[s("span",u({class:t.cx("number")},n.getPTOptions("number")),c(n.activeValue),17),s("span",u({class:t.cx("title")},n.getPTOptions("title")),[h(t.$slots,"default")],16)],16,Z),v.isSeparatorVisible?(i(),k(m,{key:0})):D("",!0)]}),_:3},16,["class","aria-current","data-p-active","data-p-disabled"]))}j.render=ee;var te={root:function(a){var e=a.instance;return["p-stepitem",{"p-stepitem-active":e.isActive}]}},ae=R.extend({name:"stepitem",classes:te}),ne={name:"BaseStepItem",extends:S,props:{value:{type:[String,Number],default:void 0}},style:ae,provide:function(){return{$pcStepItem:this,$parentInstance:this}}},z={name:"StepItem",extends:ne,inheritAttrs:!1,inject:["$pcStepper"],computed:{isActive:function(){var a;return((a=this.$pcStepper)===null||a===void 0?void 0:a.d_value)===this.value}}},se=["data-p-active"];function ie(t,a,e,d,v,n){return i(),l("div",u({class:t.cx("root"),"data-p-active":n.isActive},t.ptmi("root")),[h(t.$slots,"default")],16,se)}z.render=ie;var re=function(a){var e=a.dt;return`
.p-steplist {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style-type: none;
    overflow-x: auto;
}

.p-step {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: `.concat(e("stepper.step.gap"),`;
    padding: `).concat(e("stepper.step.padding"),`;
}

.p-step:last-of-type {
    flex: initial;
}

.p-step-header {
    border: 0 none;
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    transition: background `).concat(e("stepper.transition.duration"),", color ").concat(e("stepper.transition.duration"),", border-color ").concat(e("stepper.transition.duration"),", outline-color ").concat(e("stepper.transition.duration"),", box-shadow ").concat(e("stepper.transition.duration"),`;
    border-radius: `).concat(e("stepper.step.header.border.radius"),`;
    outline-color: transparent;
    background: transparent;
    padding: `).concat(e("stepper.step.header.padding"),`;
    gap: `).concat(e("stepper.step.header.gap"),`;
}

.p-step-header:focus-visible {
    box-shadow: `).concat(e("stepper.step.header.focus.ring.shadow"),`;
    outline: `).concat(e("stepper.step.header.focus.ring.width")," ").concat(e("stepper.step.header.focus.ring.style")," ").concat(e("stepper.step.header.focus.ring.color"),`;
    outline-offset: `).concat(e("stepper.step.header.focus.ring.offset"),`;
}

.p-stepper.p-stepper-readonly .p-step {
    cursor: auto;
}

.p-step-title {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    color: `).concat(e("stepper.step.title.color"),`;
    font-weight: `).concat(e("stepper.step.title.font.weight"),`;
    transition: background `).concat(e("stepper.transition.duration"),", color ").concat(e("stepper.transition.duration"),", border-color ").concat(e("stepper.transition.duration"),", box-shadow ").concat(e("stepper.transition.duration"),", outline-color ").concat(e("stepper.transition.duration"),`;
}

.p-step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    color: `).concat(e("stepper.step.number.color"),`;
    border: 2px solid `).concat(e("stepper.step.number.border.color"),`;
    background: `).concat(e("stepper.step.number.background"),`;
    min-width: `).concat(e("stepper.step.number.size"),`;
    height: `).concat(e("stepper.step.number.size"),`;
    line-height: `).concat(e("stepper.step.number.size"),`;
    font-size: `).concat(e("stepper.step.number.font.size"),`;
    z-index: 1;
    border-radius: `).concat(e("stepper.step.number.border.radius"),`;
    position: relative;
    font-weight: `).concat(e("stepper.step.number.font.weight"),`;
}

.p-step-number::after {
    content: " ";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: `).concat(e("stepper.step.number.border.radius"),`;
    box-shadow: `).concat(e("stepper.step.number.shadow"),`;
}

.p-step-active .p-step-header {
    cursor: default;
}

.p-step-active .p-step-number {
    background: `).concat(e("stepper.step.number.active.background"),`;
    border-color: `).concat(e("stepper.step.number.active.border.color"),`;
    color: `).concat(e("stepper.step.number.active.color"),`;
}

.p-step-active .p-step-title {
    color: `).concat(e("stepper.step.title.active.color"),`;
}

.p-step:not(.p-disabled):focus-visible {
    outline: `).concat(e("focus.ring.width")," ").concat(e("focus.ring.style")," ").concat(e("focus.ring.color"),`;
    outline-offset: `).concat(e("focus.ring.offset"),`;
}

.p-step:has(~ .p-step-active) .p-stepper-separator {
    background: `).concat(e("stepper.separator.active.background"),`;
}

.p-stepper-separator {
    flex: 1 1 0;
    background: `).concat(e("stepper.separator.background"),`;
    width: 100%;
    height: `).concat(e("stepper.separator.size"),`;
    transition: background `).concat(e("stepper.transition.duration"),", color ").concat(e("stepper.transition.duration"),", border-color ").concat(e("stepper.transition.duration"),", box-shadow ").concat(e("stepper.transition.duration"),", outline-color ").concat(e("stepper.transition.duration"),`;
}

.p-steppanels {
    padding: `).concat(e("stepper.steppanels.padding"),`;
}

.p-steppanel {
    background: `).concat(e("stepper.steppanel.background"),`;
    color: `).concat(e("stepper.steppanel.color"),`;
}

.p-stepper:has(.p-stepitem) {
    display: flex;
    flex-direction: column;
}

.p-stepitem {
    display: flex;
    flex-direction: column;
    flex: initial;
}

.p-stepitem.p-stepitem-active {
    flex: 1 1 auto;
}

.p-stepitem .p-step {
    flex: initial;
}

.p-stepitem .p-steppanel-content {
    width: 100%;
    padding: `).concat(e("stepper.steppanel.padding"),`;
    margin-inline-start: 1rem;
}

.p-stepitem .p-steppanel {
    display: flex;
    flex: 1 1 auto;
}

.p-stepitem .p-stepper-separator {
    flex: 0 0 auto;
    width: `).concat(e("stepper.separator.size"),`;
    height: auto;
    margin: `).concat(e("stepper.separator.margin"),`;
    position: relative;
    left: calc(-1 * `).concat(e("stepper.separator.size"),`);
}

.p-stepitem .p-stepper-separator:dir(rtl) {
    left: calc(-9 * `).concat(e("stepper.separator.size"),`);
}

.p-stepitem:has(~ .p-stepitem-active) .p-stepper-separator {
    background: `).concat(e("stepper.separator.active.background"),`;
}

.p-stepitem:last-of-type .p-steppanel {
    padding-inline-start: `).concat(e("stepper.step.number.size"),`;
}
`)},oe={root:function(a){var e=a.props;return["p-stepper p-component",{"p-readonly":e.linear}]},separator:"p-stepper-separator"},pe=R.extend({name:"stepper",theme:re,classes:oe}),le={name:"BaseStepper",extends:S,props:{value:{type:[String,Number],default:void 0},linear:{type:Boolean,default:!1}},style:pe,provide:function(){return{$pcStepper:this,$parentInstance:this}}},P={name:"Stepper",extends:le,inheritAttrs:!1,emits:["update:value"],data:function(){return{id:this.$attrs.id,d_value:this.value}},watch:{"$attrs.id":function(a){this.id=a||I()},value:function(a){this.d_value=a}},mounted:function(){this.id=this.id||I()},methods:{updateValue:function(a){this.d_value!==a&&(this.d_value=a,this.$emit("update:value",a))},isStepActive:function(a){return this.d_value===a},isStepDisabled:function(){return this.linear}}};function ce(t,a,e,d,v,n){return i(),l("div",u({class:t.cx("root"),role:"tablist"},t.ptmi("root")),[t.$slots.start?h(t.$slots,"start",{key:0}):D("",!0),h(t.$slots,"default"),t.$slots.end?h(t.$slots,"end",{key:1}):D("",!0)],16)}P.render=ce;const de={getData(){return[{publication:"IEEE S&P 2025",timezone:"23:59:59 AoE (UTC-12)",url:"https://sp2025.ieee-security.org/cfpapers.html",date:"May 12-15, 2025",place:"The Hyatt Regency San Francisco, San Francisco, CA, USA",cycles:[{name:"Cycle 1",ddls:[{value:"1",stage:"Paper submission deadline",date:"2024-06-06"},{value:"2",stage:"Early-reject notification",date:"2024-07-22"},{value:"3",stage:"Rebuttal period (interactive)",date:"2024-08-19 ~ 2024-08-30"},{value:"4",stage:"Rebuttal text due",date:"2024-08-26"},{value:"5",stage:"Acceptance notification",date:"2024-09-09"},{value:"6",stage:"Camera-ready deadline",date:"2024-10-18"}]},{name:"Cycle 2",ddls:[{value:"1",stage:"Paper submission deadline",date:"2024-11-14"},{value:"2",stage:"Early-reject notification",date:"2025-01-20"},{value:"3",stage:"Rebuttal period (interactive)",date:"2025-02-17 ~ 2025-02-28"},{value:"4",stage:"Rebuttal text due",date:"2025-02-24"},{value:"5",stage:"Acceptance notification",date:"2025-03-10"},{value:"6",stage:"Camera-ready deadline",date:"2025-04-18"}]}]},{publication:"IEEE S&P 2026",timezone:"23:59:59 AoE (UTC-12)",url:"https://sp2026.ieee-security.org/cfpapers.html",date:"May 18-21, 2026",place:"The Hilton San Francisco Union Square, San Francisco, CA, USA",cycles:[{name:"Cycle 1",ddls:[{value:"1",stage:"Paper submission deadline",date:"2025-06-05"},{value:"2",stage:"Early-reject notification",date:"2025-07-21"},{value:"3",stage:"Rebuttal period (interactive)",date:"2025-08-18 ~ 2025-08-29"},{value:"4",stage:"Rebuttal text due",date:"2025-08-25"},{value:"5",stage:"Acceptance notification",date:"2025-09-09"},{value:"6",stage:"Camera-ready deadline",date:"2025-10-17"}]},{name:"Cycle 2",ddls:[{value:"1",stage:"Paper submission deadline",date:"2025-11-13"},{value:"2",stage:"Early-reject notification",date:"2026-01-19"},{value:"3",stage:"Rebuttal period (interactive)",date:"2026-02-16 ~ 2026-02-27"},{value:"4",stage:"Rebuttal text due",date:"2026-02-23"},{value:"5",stage:"Acceptance notification",date:"2026-03-19"},{value:"6",stage:"Camera-ready deadline",date:"2026-04-17"}]}]},{publication:"USENIX Security 2025",timezone:"Not clearly specified",url:"https://www.usenix.org/conference/usenixsecurity25/call-for-papers",date:"August 13-15, 2025",place:"Seattle Convention Center in Seattle, WA, USA",cycles:[{name:"Cycle 1",ddls:[{value:"1",stage:"Paper submission deadline",date:"2024-09-04"},{value:"2",stage:"Early-reject notification",date:"2024-10-15"},{value:"3",stage:"Rebuttal period",date:"2024-11-18 ~ 2024-11-25"},{value:"4",stage:"Notification to authors",date:"2024-12-11"},{value:"5",stage:"Shepherding/revision period",date:"2024-12-12 ~ 2025-01-16"},{value:"6",stage:"Artifacts due for availability verification",date:"2025-01-16"},{value:"7",stage:"Shepherding/revision author notification",date:"2025-01-23"},{value:"8",stage:"Final papers due",date:"2025-01-30"}]},{name:"Cycle 2",ddls:[{value:"1",stage:"Paper submission deadline",date:"2025-01-22"},{value:"2",stage:"Early-reject notification",date:"2025-03-04"},{value:"3",stage:"Rebuttal period",date:"2025-04-07 ~ 2025-04-14"},{value:"4",stage:"Notification to authors",date:"2025-04-30"},{value:"5",stage:"Shepherding/revision period",date:"2025-05-01 ~ 2025-05-29"},{value:"6",stage:"Artifacts due for availability verification",date:"2025-05-29"},{value:"7",stage:"Shepherding/revision author notification",date:"2025-06-05"},{value:"8",stage:"Final papers due",date:"2025-06-12"}]}]},{publication:"CCS 2025",timezone:"11:59 PM AoE (UTC-12)",url:"https://www.sigsac.org/ccs/CCS2025/call-for-papers/",date:"October 13-17, 2025",place:"Taipei, Taiwan, China",cycles:[{name:"Cycle 1",ddls:[{value:"1",stage:"Abstract submission deadline",date:"2025-01-02"},{value:"2",stage:"Full paper submission deadline",date:"2025-01-09"},{value:"3",stage:"Notification of early-rejection papers",date:"2025-02-10"},{value:"4",stage:"Author rebuttal period",date:"2025-03-03"},{value:"5",stage:"Rebuttal deadline",date:"2025-03-06"},{value:"6",stage:"Author notification",date:"2025-03-28"}]},{name:"Cycle 2",ddls:[{value:"1",stage:"Abstract submission deadline",date:"2025-04-07"},{value:"2",stage:"Full paper submission deadline",date:"2025-04-14"},{value:"3",stage:"Notification of early-rejection papers",date:"2025-05-16"},{value:"4",stage:"Author rebuttal period",date:"2025-06-05"},{value:"5",stage:"Rebuttal deadline",date:"2025-06-08"},{value:"6",stage:"Author notification",date:"2025-07-01"}]}]},{publication:"NDSS 2025",timezone:"11:59 PM AoE (UTC-12)",url:"https://www.ndss-symposium.org/ndss2025/submissions/call-for-papers/",date:"February 24-28",place:"Wyndham San Diego Bayside, San Diego, California, USA",cycles:[{name:"Summer Cycle",ddls:[{value:"1",stage:"Paper submission deadline",date:"2024-04-17"},{value:"2",stage:"Early reject/Round 2 notification and Round 1 reviews",date:"2024-05-21"},{value:"3",stage:"Author rebuttal",date:"2024-06-10 ~ 2024-06-13"},{value:"4",stage:"Interactive discussion with reviewers",date:"2024-06-10 ~ 2024-06-18"},{value:"5",stage:"Author notification",date:"2024-06-20"},{value:"6",stage:"Resubmission of Major Revision papers, Minor Revision decision",date:"2024-08-07"},{value:"7",stage:"Author notification for Major Revision",date:"2024-08-29"},{value:"8",stage:"Camera Ready deadline",date:"2024-09-12"}]},{name:"Fall Cycle",ddls:[{value:"1",stage:"Paper submission deadline",date:"2024-07-10"},{value:"2",stage:"Early reject/Round 2 notification and Round 1 reviews",date:"2024-08-20"},{value:"3",stage:"Author rebuttal",date:"2024-09-09 ~ 2024-09-13"},{value:"4",stage:"Interactive discussion with reviewers",date:"2024-09-09 ~ 2024-09-17"},{value:"5",stage:"Author notification",date:"2024-09-19"},{value:"6",stage:"Resubmission of Major Revision papers, Minor Revision decision",date:"2024-10-30"},{value:"7",stage:"Author notification for Major Revision",date:"2024-11-21"},{value:"8",stage:"Camera Ready deadline",date:"2024-12-05"}]}]}]},getSubmissionTimeline(){return Promise.resolve(this.getData())}},g=t=>(W("data-v-c251a208"),t=t(),G(),t),ue={class:"card"},ve=g(()=>s("p",{class:"mb-4"}," NOTE 1: The following deadlines are manually extracted from websites, rather than crawling. Therefore, please refer to the official websites for the accuracy. ",-1)),fe=g(()=>s("p",{class:"mb-4"}," NOTE 2: The approaching deadlines are automatically highlighted with no considerations in the timezone, resulting in a deviation around 1 day . ",-1)),he={class:"flex flex-row justify-between"},me=["onClick"],ge=g(()=>s("i",{class:"pi pi-external-link"},null,-1)),be={class:"font-semibold"},Se={class:"flex flex-col gap-2 pb-2"},ye=g(()=>s("i",{class:"pi pi-calendar"},null,-1)),$e=g(()=>s("i",{class:"pi pi-map-marker"},null,-1)),xe={class:"flex flex-row"},we={class:"font-semibold"},Ce={class:"flex flex-col text-left"},_e={__name:"SubmissionTimeline",setup(t){const a=H([]);q(()=>{de.getSubmissionTimeline().then(n=>{a.value=n})});function e(n){const m=new Date;m.setHours(0,0,0,0);const f=[];n.forEach(r=>{const{value:p,stage:y,date:$}=r;if($.includes("~")){const[N,V]=$.split("~").map(B=>B.trim());f.push({value:p,stage:y,date:d(new Date(N))}),f.push({value:p,stage:y,date:d(new Date(V))})}else f.push({value:p,stage:y,date:d(new Date($))})});const o=f.filter(r=>r.date>=m).sort((r,p)=>r.date-p.date)[0];return o?o.value:null}function d(n){return n.setHours(0,0,0,0),n}function v(n){window.open(n,"_blank")}return(n,m)=>{const f=X;return i(),l("div",ue,[ve,fe,(i(!0),l(x,null,w(a.value,o=>(i(),l("div",{key:o.publication},[s("div",he,[s("h1",{class:"hover:cursor-pointer w-1/4 mb-4",onClick:r=>v(o.url)},[C(c(o.publication)+" ",1),ge],8,me),s("span",be,"Timezone: "+c(o.timezone),1)]),s("div",Se,[s("span",null,[ye,C(" "+c(o.date),1)]),s("span",null,[$e,C(" "+c(o.place),1)])]),s("div",xe,[(i(!0),l(x,null,w(o.cycles,r=>(i(),l("div",{key:r.publication,class:"w-1/2"},[s("span",we,c(r.name),1),_(A(P),{value:e(r.ddls),linear:""},{default:b(()=>[(i(!0),l(x,null,w(r.ddls,p=>(i(),k(A(z),{value:p.value,key:p.value},{default:b(()=>[_(A(j),null,{default:b(()=>[s("div",Ce,[s("span",null,c(p.date),1),s("span",null,c(p.stage),1)])]),_:2},1024)]),_:2},1032,["value"]))),128))]),_:2},1032,["value"])]))),128))]),_(f)]))),128))])}}},De=L(_e,[["__scopeId","data-v-c251a208"]]);export{De as default};
