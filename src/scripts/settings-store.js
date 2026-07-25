import { DEFAULT_SETTINGS, migrateSettings, MIRROR } from '@/lib/settings-schema.js';

// 这三个常量是硬约束：现有用户的收藏与关键词在这个库里，改一个字就丢数据
const DB_NAME = 'spc-settings';
const STORE = 'config';
const DB_VERSION = 1;

const KEY_APP = 'app';
const KEY_FAV = 'favorites';

let dbPromise = null;
let persistent = true;

// IndexedDB 不可用时的会话内兜底，保证 UI 行为一致
const memory = { [KEY_APP]: null, [KEY_FAV]: null };

export function isPersistent() {
  return persistent;
}

function openDb() {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    persistent = false;
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
  return dbPromise;
}

function idbGet(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbPut(key, value) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        // structuredClone 剥掉任何不可克隆的包装，避免 DataCloneError
        let plain;
        try {
          plain = structuredClone(value);
        } catch {
          plain = JSON.parse(JSON.stringify(value));
        }
        const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put({ key, value: plain });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

/** 仅供测试：绕过迁移直接写入原始值，用来模拟库里的旧格式数据。 */
export async function __writeRaw(key, value) {
  try {
    await idbPut(key, value);
  } catch {
    memory[key] = value;
  }
}

/** 仅供测试：绕过迁移直接读回原始记录，用来断言写回确实落盘了。 */
export async function __readRaw(key) {
  try {
    return await idbGet(key);
  } catch {
    return memory[key];
  }
}

function mirror(settings) {
  try {
    localStorage.setItem(MIRROR.theme, settings.darkTheme ? 'dark' : 'light');
    localStorage.setItem(MIRROR.accent, settings.theme);
    localStorage.setItem(MIRROR.lang, settings.language);
    localStorage.setItem(MIRROR.rememberDark, settings.rememberDarkMode ? '1' : '0');
    localStorage.setItem(MIRROR.rememberAccent, settings.rememberTheme ? '1' : '0');
    localStorage.setItem(MIRROR.rememberLang, settings.rememberLanguage ? '1' : '0');
  } catch {
    /* 隐私模式下 localStorage 也可能抛错；镜像失败不影响主流程 */
  }
}

export async function getSettings() {
  try {
    const raw = await idbGet(KEY_APP);
    return migrateSettings(raw);
  } catch {
    persistent = false;
    return migrateSettings(memory[KEY_APP]);
  }
}

export async function patchSettings(partial) {
  const current = await getSettings();
  const next = migrateSettings({ ...current, ...partial });
  try {
    await idbPut(KEY_APP, next);
  } catch {
    persistent = false;
    memory[KEY_APP] = next;
  }
  mirror(next);
  return next;
}

export async function getFavorites() {
  try {
    const raw = await idbGet(KEY_FAV);
    return Array.isArray(raw) ? raw : [];
  } catch {
    persistent = false;
    return Array.isArray(memory[KEY_FAV]) ? memory[KEY_FAV] : [];
  }
}

export async function toggleFavorite(id) {
  const current = await getFavorites();
  const idx = current.indexOf(id);
  const added = idx < 0;
  // 保持插入顺序：不排序，让收藏列表反映用户添加的先后
  const next = added ? [...current, id] : current.filter((x) => x !== id);
  try {
    await idbPut(KEY_FAV, next);
  } catch {
    persistent = false;
    memory[KEY_FAV] = next;
  }
  return { favorites: next, added };
}

/**
 * 把 IndexedDB 里的持久设置「水合」到运行时。页面加载后调用一次。
 *
 * 为什么必须有这一步：预绘制脚本只读 localStorage 镜像，而**老用户的浏览器里
 * 只有 IndexedDB、没有镜像** —— 旧站从来不写 spc-* 这些键。没有水合的话，
 * 一个存了几年深色偏好的老用户在新站首次访问时会被无声忽略，直到他再点一次
 * 开关。旧站是在 App.vue 的 onMounted 里读库并 applySettingsToRuntime 的，
 * 新站必须有等价物，否则就是功能退化。
 *
 * 做三件事：
 *   1. 读出来（getSettings 内部已跑过 migrateSettings）；
 *   2. 把迁移后的形状**写回**库里 —— 这才真正清掉 llmEndpoint 这类死字段，
 *      否则它们会一直躺在用户库里；
 *   3. 填充 localStorage 镜像，供**下次**首绘同步读取。
 *
 * 主题的实际应用不在这里做（那属于 theme.js），本函数只返回设置。
 *
 * 代价要如实说明：升级后的**第一次**加载会有一次可见的主题跳变
 * （系统默认 → 存储值），因为此时镜像还是空的而 IndexedDB 是异步的。
 * 此后镜像已就位，不再跳。一次跳变换回用户的偏好，好过静默丢掉它。
 */
export async function hydrateSettings() {
  const settings = await getSettings();
  try {
    await idbPut(KEY_APP, settings);   // 把迁移结果落盘
  } catch {
    persistent = false;
    memory[KEY_APP] = settings;
  }
  mirror(settings);
  return settings;
}

export async function clearFavorites() {
  try {
    await idbPut(KEY_FAV, []);
  } catch {
    persistent = false;
    memory[KEY_FAV] = [];
  }
  return [];
}
