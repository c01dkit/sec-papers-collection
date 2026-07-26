import { highlightSegments } from '@/lib/highlight.js';
import { getSettings } from './settings-store.js';
import { DATA_BASE } from '@/lib/cdn.js';

let i18n = {};
let keywords = [];
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

    const ttl = document.createElement('span');
    ttl.className = 'ttl';
    highlightInto(ttl, p.title);
    li.appendChild(ttl);

    if (p.paper && p.paper !== '#') {
      const a = document.createElement('a');
      a.className = 'ext';
      a.href = p.paper;
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = i18n.openPaper;
      a.textContent = '↗';
      li.appendChild(a);
    }

    const abs = document.createElement('p');
    if (p.abstract && p.abstract.trim()) {
      abs.className = 'abs';
      highlightInto(abs, p.abstract.trim());
    } else {
      abs.className = 'abs abs--none';
      abs.textContent = i18n.noAbstract;
    }
    li.appendChild(abs);

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

export async function initAbstractView() {
  const picker = document.querySelector('.picker');
  const box = document.getElementById('abResult');
  if (!picker || !box || picker.dataset.bound) return;
  picker.dataset.bound = '1';

  i18n = JSON.parse(document.getElementById('abI18n').textContent);
  keywords = (await getSettings()).keywords;

  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('.yr');
    if (!btn) return;
    picker.querySelectorAll('.yr[aria-pressed="true"]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    load(box, btn.dataset.venue, btn.dataset.year);
  });
}
