import { highlightSegments } from '@/lib/highlight.js';
import { getSettings } from './settings-store.js';
import { DATA_BASE } from '@/lib/cdn.js';
import { readAbstractParams, writeAbstractParams } from '@/lib/abstract-url.js';
import { parseTag } from '@/lib/tags.js';
import { writeSearchParams } from '@/lib/search-url.js';

let i18n = {};
// 当前语言的 码 -> 名（#abTax），与检索页的 #ptTax 同一份构造。
let tax = { types: {}, topics: {} };
let keywords = [];
// 摘要页用到的两项设置（abstractLang / abstractSwitch）。与 keywords 一样，
// 每次 init 从库里重读 —— 设置页改完软导航回来就是新值，不需要监听广播。
let prefs = { abstractLang: 'page', abstractSwitch: true };
let inFlight = 0;   // 请求序号，防止慢请求覆盖快请求的结果

const fmt = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

function highlightInto(el, text) {
  const frag = document.createDocumentFragment();
  for (const seg of highlightSegments(text, keywords.map((k) => ({ text: k, cls: 'hl' })))) {
    if (!seg.hit) frag.appendChild(document.createTextNode(seg.text));
    else {
      const b = document.createElement('b');
      b.className = seg.cls;
      b.textContent = seg.text;
      frag.appendChild(b);
    }
  }
  el.replaceChildren(frag);
}

/**
 * 一篇论文两种语言的摘要文本，缺的那种是空串。
 * 英文来自源站，中文是 LLM 译写（meta_json 的 abstract_zh），历史数据里
 * 少量论文没有中文，个别源站没给英文。
 */
function abstractsOf(p) {
  const clean = (s) => (typeof s === 'string' ? s.trim() : '');
  return { en: clean(p.abstract), zh: clean(p.abstract_zh) };
}

/** 设置要求的初始语言；那一种没有就退到有的那一种；都没有给 null。 */
function initialLang(texts) {
  const want = prefs.abstractLang === 'page' ? i18n.pageLang : prefs.abstractLang;
  const first = want === 'zh' ? 'zh' : 'en';
  const other = first === 'zh' ? 'en' : 'zh';
  if (texts[first]) return first;
  if (texts[other]) return other;
  return null;
}

/**
 * 标题行 + 摘要。切换按钮只在两种语言都有、且设置开着时出现：
 * 只有一种语言时按钮点了没反应，那种控件宁可不画（全站「不呈现无法工作的
 * 控件」的约定）。设置关掉按钮时初始语言照样生效，只是不能逐篇改。
 */
function renderAbstractBlock(li, p) {
  const texts = abstractsOf(p);
  let cur = initialLang(texts);

  const abs = document.createElement('p');
  const paint = () => {
    if (!cur) {
      abs.className = 'abs abs--none';
      abs.removeAttribute('lang');
      abs.textContent = i18n.noAbstract;
      return;
    }
    abs.className = 'abs';
    // hyphens: auto 按 lang 断字；中文段落挂 zh-CN 免得被按英文规则处理
    abs.lang = cur === 'zh' ? 'zh-CN' : 'en';
    highlightInto(abs, texts[cur]);
  };

  if (prefs.abstractSwitch && texts.en && texts.zh) {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'lsw';
    sw.title = i18n.langSwitch;
    sw.setAttribute('aria-label', i18n.langSwitch);
    const zh = document.createElement('span');
    zh.dataset.l = 'zh';
    zh.textContent = i18n.langZh;
    const en = document.createElement('span');
    en.dataset.l = 'en';
    en.textContent = i18n.langEn;
    sw.append(zh, en);
    const paintSwitch = () => {
      zh.classList.toggle('on', cur === 'zh');
      en.classList.toggle('on', cur === 'en');
      sw.dataset.lang = cur;
    };
    sw.addEventListener('click', () => {
      cur = cur === 'zh' ? 'en' : 'zh';
      paint();
      paintSwitch();
    });
    paintSwitch();
    li.querySelector('.trow').appendChild(sw);
  }

  paint();
  li.appendChild(abs);
}

/**
 * 标题行与摘要之间的「#主题 #类型 #奖项」。主题 / 类型是去检索页按该码筛选的链接
 * （URL 用 writeSearchParams 拼，与检索页读 URL 的规则同出一处）；奖项是 awards.json
 * 的原始英文名（meta_json 的 awards 字段），不是链接。未分类主题 00、待分析类型 0 不出标签；
 * 一个都没有时返回 null，不留一条空行。
 * awards 不是数组时（CDN 上还是加这个字段之前的旧数据）当作没有。
 */
function buildTags(p) {
  const tag = parseTag(p.tag);
  const chips = [];
  const link = (kind, code, names, params) => {
    const a = document.createElement('a');
    a.className = `tg tg--${kind}`;
    a.href = i18n.searchHref + writeSearchParams(params);
    a.textContent = `#${names[code] ?? code}`;
    chips.push(a);
  };
  if (tag.topic !== '00') link('topic', tag.topic, tax.topics, { topics: [tag.topic] });
  if (tag.type !== '0') link('type', tag.type, tax.types, { types: [tag.type] });
  for (const name of Array.isArray(p.awards) ? p.awards : []) {
    const span = document.createElement('span');
    span.className = 'tg tg--award';
    span.textContent = `#${name}`;
    chips.push(span);
  }
  if (!chips.length) return null;
  const row = document.createElement('div');
  row.className = 'tags';
  row.append(...chips);
  return row;
}

function renderSkeleton(box) {
  box.replaceChildren();
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = i18n.loading;
  box.appendChild(p);
  for (let i = 0; i < 4; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'item';
    for (let j = 0; j < 3; j++) {
      const s = document.createElement('div');
      s.className = 'skel';
      s.style.width = j === 0 ? '62%' : '100%';
      wrap.appendChild(s);
    }
    box.appendChild(wrap);
  }
}

function renderPapers(box, venue, year, papers) {
  box.replaceChildren();

  const head = document.createElement('div');
  head.className = 'head';
  const h2 = document.createElement('h2');
  h2.className = 'srf';
  h2.textContent = `${venue} ${year}`;
  const n = document.createElement('span');
  n.className = 'n';
  n.textContent = fmt(i18n.count, { __N__: String(papers.length) });
  head.append(h2, n);
  box.appendChild(head);

  const ul = document.createElement('ul');
  ul.className = 'list';
  for (const p of papers) {
    const li = document.createElement('li');
    li.className = 'item';

    const trow = document.createElement('div');
    trow.className = 'trow';
    const tmain = document.createElement('span');
    tmain.className = 'tmain';

    const ttl = document.createElement('span');
    ttl.className = 'ttl';
    highlightInto(ttl, p.title);
    tmain.appendChild(ttl);

    if (p.paper && p.paper !== '#') {
      const a = document.createElement('a');
      a.className = 'ext';
      a.href = p.paper;
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = i18n.openPaper;
      a.textContent = '↗';
      tmain.appendChild(a);
    }
    trow.appendChild(tmain);
    li.appendChild(trow);

    const tags = buildTags(p);
    if (tags) li.appendChild(tags);

    renderAbstractBlock(li, p);

    ul.appendChild(li);
  }
  box.appendChild(ul);
}

function renderMessage(box, text) {
  box.replaceChildren();
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = text;
  box.appendChild(p);
}

async function load(box, venue, year) {
  const ticket = ++inFlight;
  renderSkeleton(box);
  try {
    // 文件名里有空格和 &，必须 encodeURIComponent
    const file = encodeURIComponent(`${venue} - ${year}.json`);
    const res = await fetch(`${DATA_BASE}/meta_json/${file}`);
    if (ticket !== inFlight) return;   // 已有更新的请求，丢弃本次结果
    if (!res.ok) {
      renderMessage(box, res.status === 404 ? i18n.noData : i18n.failed);
      return;
    }
    const papers = await res.json();
    if (ticket !== inFlight) return;
    if (!Array.isArray(papers) || !papers.length) {
      renderMessage(box, i18n.noData);
      return;
    }
    renderPapers(box, venue, year, papers);
  } catch (err) {
    if (ticket !== inFlight) return;
    console.warn('[abstract] 加载失败', err);
    renderMessage(box, i18n.failed);
  }
}

/**
 * 选中一个届次：chip 按下、加载论文、地址栏写回 ?pub=…&year=…。
 * replaceState 而不是 pushState：换届次是筛选而不是翻页，返回键该回到上一页，
 * 不是回到上一个届次（与检索页 syncUrl 同一取舍）。
 */
function select(picker, box, btn) {
  picker.querySelectorAll('.yr[aria-pressed="true"]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  btn.setAttribute('aria-pressed', 'true');
  const sel = { pub: btn.dataset.venue, year: btn.dataset.year };
  const next = location.pathname + writeAbstractParams(sel);
  if (next !== location.pathname + location.search) history.replaceState(history.state, '', next);
  load(box, sel.pub, sel.year);
}

/**
 * 地址栏里的届次对应的 chip；URL 指向不存在的届次（会议名写错、那年没办）
 * 时给 null —— 和检索页一样，URL 里认不出的值直接丢，不做「看不见的筛选」。
 */
function chipFromUrl(picker) {
  const sel = readAbstractParams(location.search);
  if (!sel) return null;
  return [...picker.querySelectorAll('.yr')].find(
    (b) => b.dataset.venue === sel.pub && b.dataset.year === sel.year,
  ) || null;
}

export async function initAbstractView() {
  const picker = document.querySelector('.picker');
  const box = document.getElementById('abResult');
  if (!picker || !box || picker.dataset.bound) return;
  picker.dataset.bound = '1';

  i18n = JSON.parse(document.getElementById('abI18n').textContent);
  tax = JSON.parse(document.getElementById('abTax')?.textContent || 'null') || { types: {}, topics: {} };
  const settings = await getSettings();
  keywords = settings.keywords;
  prefs = { abstractLang: settings.abstractLang, abstractSwitch: settings.abstractSwitch };

  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('.yr');
    if (btn) select(picker, box, btn);
  });

  // 深链（首页矩阵格子、分享出去的地址）：软导航时 astro:page-load 在新 URL 上
  // 触发，location.search 就是本页的。
  const initial = chipFromUrl(picker);
  if (initial) select(picker, box, initial);
}
