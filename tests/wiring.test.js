import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const PAIRS = [
  {
    name: 'search',
    script: 'src/scripts/paper-table.js',
    templates: ['src/pages/[lang]/search.astro', 'src/components/PaperRow.astro'],
  },
  {
    name: 'abstract',
    script: 'src/scripts/abstract-view.js',
    templates: ['src/pages/[lang]/abstract.astro'],
  },
  {
    name: 'trends',
    script: 'src/scripts/trends-chart.js',
    templates: ['src/pages/[lang]/trends.astro'],
  },
  {
    name: 'timeline',
    script: 'src/scripts/timeline.js',
    templates: ['src/pages/[lang]/timeline.astro'],
  },
  {
    name: 'awards',
    script: 'src/scripts/awards-view.js',
    templates: ['src/pages/[lang]/awards.astro'],
  },
  {
    name: 'settings',
    script: 'src/scripts/settings-form.js',
    templates: ['src/pages/[lang]/settings.astro'],
  },
  // home 之前不在这张表里。补进来的**唯一**有牙齿的断言是下面那条作用域
  // 检查（.ph 那个 bug 正是它抓的）；前三条对 home 全是空转 ——
  // home-countdown.js 里没有 i18n.* 引用、DeadlineDemo.astro 里没有
  // JSON.stringify({ 块、脚本也不用 getElementById。写清楚是免得有人把这一行
  // 的绿色读成「首页倒计时的接线被守住了」：它的
  // data-countdown / data-ddl / data-days / data-days-label / data-passed-label /
  // data-placeholder / .unit 这套契约目前仍然只有 home-countdown.test.js
  // 的手写夹具在守，改名不会红。
  {
    name: 'home',
    script: 'src/scripts/home-countdown.js',
    templates: ['src/components/home/media/DeadlineDemo.astro'],
  },
  // 不是页面脚本（它跟 nav/theme/reveal 一样由 boot 无条件跑），但模板契约同样
  // 存在且同样细：#pageSb 这个 id 一旦在 BaseLayout 里改名，滑块就静默消失 ——
  // 页面照样能滚，只是永远看不见滚动条，没有任何报错。四条断言里只有
  // getElementById 那条对它有牙齿，够了。
  {
    name: 'page-scrollbar',
    script: 'src/scripts/page-scrollbar.js',
    templates: ['src/layouts/BaseLayout.astro'],
  },
];

// 从 set:html={JSON.stringify({ … })} 里取顶层 key。用花括号配平而不是正则，
// 因为里面还嵌着 t(lang, 'x', { count: '__N__' }) 这种自带花括号的调用。
function embeddedKeys(src) {
  const keys = new Set();
  const marker = 'JSON.stringify({';
  let i = src.indexOf(marker);
  while (i !== -1) {
    // 配平时必须跳过字符串字面量：文案里出现一个落单的 { 或 }，边界就会找错，
    // 于是这条测试从此静默漏检 —— 一条不会红的结构测试比没有测试更糟。
    let depth = 1;
    let j = i + marker.length;
    let quote = '';
    const start = j;
    while (j < src.length && depth > 0) {
      const ch = src[j];
      if (quote) {
        if (ch === '\\') j += 1;
        else if (ch === quote) quote = '';
      } else if (ch === "'" || ch === '"' || ch === '`') quote = ch;
      else if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      j += 1;
    }
    const body = src.slice(start, j - 1);
    let d = 0;
    let q = '';
    for (const line of body.split('\n')) {
      const m = /^\s*(\w+)\s*:/.exec(line);
      if (m && d === 0 && !q) keys.add(m[1]);
      for (let k = 0; k < line.length; k += 1) {
        const ch = line[k];
        if (q) {
          if (ch === '\\') k += 1;
          else if (ch === q) q = '';
        } else if (ch === "'" || ch === '"' || ch === '`') q = ch;
        else if (ch === '{') d += 1;
        else if (ch === '}') d -= 1;
      }
    }
    i = src.indexOf(marker, j);
  }
  return keys;
}

// helper 自己也要被测。它要是在一般情况下解析错了，上面三条断言会永远绿，
// 而它们本该是 Task 14–19 复用的防线。
describe('embeddedKeys', () => {
  it('取出顶层 key', () => {
    const src = "set:html={JSON.stringify({\n  a: 1,\n  b: 2,\n})}";
    expect([...embeddedKeys(src)].sort()).toEqual(['a', 'b']);
  });

  it('不把嵌套对象里的 key 当成顶层', () => {
    const src = "set:html={JSON.stringify({\n  a: t(l, 'k', { count: 1 }),\n  b: 2,\n})}";
    expect([...embeddedKeys(src)].sort()).toEqual(['a', 'b']);
  });

  it('字符串里落单的花括号不影响配平', () => {
    const src = "set:html={JSON.stringify({\n  a: '有个 { 在文案里',\n  b: 2,\n})}";
    expect([...embeddedKeys(src)].sort()).toEqual(['a', 'b']);
  });
});

describe.each(PAIRS)('$name 页：脚本与模板的接线', ({ script, templates }) => {
  const js = readFileSync(script, 'utf8');
  const tpl = templates.map((f) => readFileSync(f, 'utf8')).join('\n');

  it('脚本引用的每个 i18n key 都被模板内嵌了', () => {
    const used = [...new Set([...js.matchAll(/i18n\.(\w+)/g)].map((m) => m[1]))].sort();
    const embedded = embeddedKeys(tpl);
    expect(used.filter((k) => !embedded.has(k))).toEqual([]);
  });

  it('模板内嵌的每个 i18n key 都真的有人用 —— 不留死文案', () => {
    const used = new Set([...js.matchAll(/i18n\.(\w+)/g)].map((m) => m[1]));
    expect([...embeddedKeys(tpl)].filter((k) => !used.has(k)).sort()).toEqual([]);
  });

  it('脚本 getElementById 的每个 id 都在模板里存在', () => {
    const want = [...new Set([...js.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]))].sort();
    const have = new Set([...tpl.matchAll(/id="([^"{]+)"/g)].map((m) => m[1]));
    expect(want.filter((id) => !have.has(id))).toEqual([]);
  });

  it('脚本 createElement 出来的类名，不能只由配对模板的 scoped <style> 提供样式', () => {
    // Astro 的 scoped <style> 只作用于**本文件模板里写出的**元素（编译成
    // `.x[data-astro-cid-…]`）。脚本用 createElement 造的元素永远拿不到那个
    // scope 属性，于是规则一条都命中不了，元素渲染成完全无样式的裸内容。
    //
    // 这个坑在本次迁移里踩了四次（Task 13 两轮、Task 17、以及 DeadlineDemo 的
    // .ph —— 最后那个在三轮任务级复审里都没被看见，因为构建期那条
    // picked.placeholder 分支在现有数据下从不成立，线上存在的 .ph 只有脚本造的
    // 那一个）。所以立一道机械的绊线。
    //
    // 规则本身很干净：`.className = '…'` 一定发生在 createElement 出来的新元素上
    // （需要 is:global），而 `classList.add/remove/toggle` 是往**已有**元素上加类
    // （scoped 完全正确 —— 比如 timeline 的 .step.past、DeadlineDemo 的 .row.past）。
    // 所以只看前者，不看后者，一条豁免名单都不需要。
    //
    // 为什么按配对逐个查、不做全站类名比对：类名只在同一个 scope 里才会互相
    // 影响。ClosingBand 自己模板里的 .ttl 与 abstract-view.js 造的 .ttl 撞名
    // 但互不相干 —— 全站比对会报 9 个假阳性，一个真的都没有。
    const created = new Set();
    for (const m of js.matchAll(/\.className\s*=\s*'([^']+)'/g)) {
      for (const cls of m[1].split(/\s+/)) created.add(cls);
    }

    // 只留 scoped 块（没有 is:global / is:inline 的那些），并把声明体挖掉，
    // 免得声明里出现的 .5rem 之类被当成选择器。
    let selectors = '';
    for (const m of tpl.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)) {
      if (/is:global|is:inline/.test(m[1])) continue;
      selectors += m[2].replace(/\{[^{}]*\}/g, '{}') + '\n';
    }

    const offenders = [...created].filter((cls) =>
      new RegExp(`\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(selectors)
    );
    expect(offenders.sort()).toEqual([]);
  });
});
