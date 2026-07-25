import zh from './zh.json';
import en from './en.json';

export const LOCALES = ['zh', 'en'];
export const DEFAULT_LOCALE = 'zh';

const MESSAGES = { zh, en };

function lookup(tree, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), tree);
}

function interpolate(msg, vars) {
  return msg.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole
  );
}

export function t(lang, key, vars) {
  // 未知语言码（不是 zh/en）整体回退到默认语言的文案树。
  //
  // 但**已知语言缺 key 时绝不跨语言回退**：en 漏一条文案就抛错、让 astro build
  // 当场失败。曾经这里多一行 `?? lookup(MESSAGES[DEFAULT_LOCALE], key)`，
  // 后果是 en 缺 key 时静默返回中文 —— 英文页面渲染出中文散文，构建照样通过。
  // 那比渲染出裸 key 更糟，也更难被发现。
  const tree = MESSAGES[lang] ?? MESSAGES[DEFAULT_LOCALE];
  const msg = lookup(tree, key);
  if (typeof msg !== 'string') {
    throw new Error(`i18n: missing key "${key}" (lang=${lang})`);
  }
  return vars ? interpolate(msg, vars) : msg;
}

export function collectKeys(tree, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...collectKeys(v, key));
    else out.push(key);
  }
  return out;
}
