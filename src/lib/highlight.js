const RE_SPECIAL = /[.*+?^${}()|[\]\\]/g;

/**
 * 把文本按 patterns 切成命中/未命中的片段。
 * 纯函数、不读全局状态 —— 原 useHighlight 从 getRuntimeSettings() 隐式取关键词，
 * 那个依赖让它没法单测。调用方自己把关键词传进来。
 *
 * @param {string} text
 * @param {Array<{text: string, cls?: string}>} patterns
 * @returns {Array<{text: string, hit: boolean, cls: string}>}
 */
export function highlightSegments(text, patterns) {
  const src = text == null ? '' : String(text);
  const list = (patterns || []).filter((p) => p && p.text != null && String(p.text) !== '');

  if (!src || !list.length) return [{ text: src, hit: false, cls: '' }];

  // 长的排前面，让 "fuzzing tool" 抢在 "fuzz" 之前匹配
  const sorted = [...list].sort((a, b) => String(b.text).length - String(a.text).length);
  const source = sorted.map((p) => String(p.text).replace(RE_SPECIAL, '\\$&')).join('|');
  const re = new RegExp(`(${source})`, 'gi');

  const segments = [];
  let last = 0;
  let m;

  while ((m = re.exec(src)) !== null) {
    if (m.index > last) segments.push({ text: src.slice(last, m.index), hit: false, cls: '' });

    // 按长度与内容找回是哪个 pattern 命中的，取它的 cls
    const lower = m[0].toLowerCase();
    const owner = sorted.find(
      (p) => String(p.text).length === m[0].length && String(p.text).toLowerCase() === lower
    );
    segments.push({ text: m[0], hit: true, cls: owner?.cls || 'hl' });

    last = re.lastIndex;
  }

  if (last < src.length) segments.push({ text: src.slice(last), hit: false, cls: '' });

  return segments.length ? segments : [{ text: src, hit: false, cls: '' }];
}
