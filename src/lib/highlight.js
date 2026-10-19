const RE_SPECIAL = /[.*+?^${}()|[\]\\]/g;

/** 每个 pattern 各编译成一个带 g 的正则。字面量转义后大小写不敏感；RegExp 复制一份，不动调用方的对象。 */
function toGlobal(p) {
  if (p.re instanceof RegExp) {
    return new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : `${p.re.flags}g`);
  }
  return new RegExp(String(p.text).replace(RE_SPECIAL, '\\$&'), 'gi');
}

/** re 在 from 及之后的第一个非空命中；零宽命中（^、a*、\b 之类）跳过，不然会原地打转。 */
function nextHit(re, src, from) {
  re.lastIndex = from;
  for (;;) {
    const m = re.exec(src);
    if (!m) return null;
    if (m[0].length) return { start: m.index, end: m.index + m[0].length };
    if (m.index >= src.length) return null;
    re.lastIndex = m.index + 1;
  }
}

/**
 * 把文本按 patterns 切成命中/未命中的片段。
 * 纯函数、不读全局状态 —— 原 useHighlight 从 getRuntimeSettings() 隐式取关键词，
 * 那个依赖让它没法单测。调用方自己把关键词传进来。
 *
 * pattern 是字面量 `{ text }`（大小写不敏感），或检索页正则模式下的 `{ re }`。
 * 每个 pattern 单独扫描，而不是拼成一个 `(a|b|c)` 大正则：用户正则里的捕获组会让
 * 拼接后的分组编号整体错位，`(\w)\1` 这样的反向引用就指到别的组上去了。
 * 取舍规则与原先的大正则一致：最左的命中优先；同起点取更长的（"fuzzing tool" 抢在
 * "fuzz" 之前）；同起点同长度取排在前面的 pattern（检索词排在关键词前，cls 归它）。
 *
 * @param {string} text
 * @param {Array<{text?: string, re?: RegExp, cls?: string}>} patterns
 * @returns {Array<{text: string, hit: boolean, cls: string}>}
 */
export function highlightSegments(text, patterns) {
  const src = text == null ? '' : String(text);
  const list = (patterns || []).filter(
    (p) => p && (p.re instanceof RegExp || (p.text != null && String(p.text) !== '')),
  );

  if (!src || !list.length) return [{ text: src, hit: false, cls: '' }];

  const scanners = list.map((p) => ({ re: toGlobal(p), cls: p.cls || 'hl', hit: undefined }));

  const segments = [];
  let pos = 0;

  while (pos < src.length) {
    let best = null;
    for (const s of scanners) {
      // 上一轮找到的命中若仍在 pos 之后，就还有效；被别的命中吞掉的（start < pos）要从 pos 重找，
      // 否则 'aa' 在 "xaaa" 里被 'xa' 挡掉 [1,3] 之后，[2,4] 那一处就丢了
      if (s.hit === undefined || (s.hit && s.hit.start < pos)) s.hit = nextHit(s.re, src, pos);
      const h = s.hit;
      if (h && (!best || h.start < best.start || (h.start === best.start && h.end > best.end))) {
        best = { ...h, cls: s.cls };
      }
    }
    if (!best) break;

    if (best.start > pos) segments.push({ text: src.slice(pos, best.start), hit: false, cls: '' });
    segments.push({ text: src.slice(best.start, best.end), hit: true, cls: best.cls });
    pos = best.end;
  }

  if (pos < src.length) segments.push({ text: src.slice(pos), hit: false, cls: '' });

  return segments.length ? segments : [{ text: src, hit: false, cls: '' }];
}
