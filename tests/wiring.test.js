import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const PAIRS = [
  {
    name: 'search',
    script: 'src/scripts/paper-table.js',
    templates: ['src/pages/[lang]/search.astro', 'src/components/PaperRow.astro'],
  },
];

// 从 set:html={JSON.stringify({ … })} 里取顶层 key。用花括号配平而不是正则，
// 因为里面还嵌着 t(lang, 'x', { count: '__N__' }) 这种自带花括号的调用。
function embeddedKeys(src) {
  const keys = new Set();
  const marker = 'JSON.stringify({';
  let i = src.indexOf(marker);
  while (i !== -1) {
    let depth = 1;
    let j = i + marker.length;
    const start = j;
    while (j < src.length && depth > 0) {
      if (src[j] === '{') depth += 1;
      else if (src[j] === '}') depth -= 1;
      j += 1;
    }
    const body = src.slice(start, j - 1);
    let d = 0;
    for (const line of body.split('\n')) {
      const m = /^\s*(\w+)\s*:/.exec(line);
      if (m && d === 0) keys.add(m[1]);
      for (const ch of line) {
        if (ch === '{') d += 1;
        else if (ch === '}') d -= 1;
      }
    }
    i = src.indexOf(marker, j);
  }
  return keys;
}

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
