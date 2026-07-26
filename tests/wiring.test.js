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
});
