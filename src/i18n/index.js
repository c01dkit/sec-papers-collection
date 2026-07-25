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
  const tree = MESSAGES[lang] ?? MESSAGES[DEFAULT_LOCALE];
  let msg = lookup(tree, key);
  if (typeof msg !== 'string') msg = lookup(MESSAGES[DEFAULT_LOCALE], key);
  if (typeof msg !== 'string') {
    // 构建期抛错，避免线上出现裸 key
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
