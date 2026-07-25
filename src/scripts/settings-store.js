import { DEFAULT_SETTINGS, migrateSettings, MIRROR } from '@/lib/settings-schema.js';

// 这三个常量是硬约束：现有用户的收藏与关键词在这个库里，改一个字就丢数据
const DB_NAME = 'spc-settings';
const STORE = 'config';
const DB_VERSION = 1;

const KEY_APP = 'app';
const KEY_FAV = 'favorites';

let dbPromise = null;

/**
 * 「存储当前是否真的在持久化」。
 *
 * 语义刻意定成**「最近一次实际读写是否成功」**，而不是「连接是否打开过」：
 * 连接开着而事务失败是真实存在的情形（配额耗尽最典型），此时数据并没有落盘，
 * 标志必须为 false；反过来配额腾出来、写又成功了，标志也必须能收回 true。
 * 早先只在 openDb 的 onsuccess 里置 true，于是这类「连接健康、事务失败」
 * 一旦发生就再也恢复不了 —— Task 19 的「存储降级」提示会一直挂着，
 * 而其实早就在正常保存了。名字承诺了什么，就得真的是那个意思。
 */
let persistent = true;

// IndexedDB 不可用时的会话内兜底，保证 UI 行为一致
const memory = { [KEY_APP]: null, [KEY_FAV]: null };

/**
 * 所有**写**操作串行化。
 *
 * patchSettings 与 toggleFavorite 都是「读—改—写」：先读出当前值，合并，再写回。
 * 两个并发调用会各自读到同一个旧值，后写的那个把先写的那个覆盖掉 ——
 * 用户刚点的设置被静默丢掉，而 DOM 已经改了，于是界面与存储不一致。
 * 这不是理论问题：initTheme() 里 hydrateAndApply() 是 fire-and-forget，
 * 紧接着就绑定了主题/强调色两个按钮，所以「水合还在飞、用户已经点了」
 * 几乎每次加载都存在这个窗口；连点两个按钮也会撞上。
 *
 * 用一条 promise 链把写操作排成队。读操作不排队（没必要，也会拖慢）。
 * 排队后无论水合与点击谁先谁后，结果都正确：先水合则点击读到迁移后的值，
 * 先点击则水合读到点击后的值。
 */
let writeQueue = Promise.resolve();

function serialize(fn) {
  // 前一个失败也不能卡住后一个，所以 then 的两个分支都跑 fn
  const run = writeQueue.then(fn, fn);
  // 队列自身永不 reject，否则一次失败会让后续所有写操作都走 rejected 分支
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

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
    req.onsuccess = () => {
      const db = req.result;
      // 开成功就把降级标志收回来。否则一次瞬时故障之后，即使重试成功、
      // 数据其实又在持久化了，isPersistent() 仍会一直返回 false，
      // Task 19 的「存储降级」提示会永久挂着 —— 那是在对用户说假话。
      persistent = true;
      // 连接被外部关掉（onversionchange、用户清了站点数据）时要让缓存失效，
      // 否则 dbPromise 会一直指向一个死连接：后续每次操作都失败并落到内存兜底，
      // 数据不丢但再也不会重试。这和 openDb 失败后清缓存是同一类问题。
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
  // 失败时不要把这个 rejected promise 永久缓存下来 —— 那会让一次瞬时故障
  // （onerror / onblocked）把**整个会话**降级到内存兜底，即使原因早已消失。
  // 清掉缓存让下次调用重新尝试。注意不要把 .catch() 的返回值赋回 dbPromise，
  // 否则调用方拿到的就是已被吞掉错误的 resolved promise 了。
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function idbGet(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => {
          persistent = true;   // 语义见 persistent 声明处的说明
          resolve(req.result ? req.result.value : null);
        };
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
        req.onsuccess = () => {
          persistent = true;   // 语义见 persistent 声明处的说明
          resolve();
        };
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
  }
  // 兜底路径也要包住 migrateSettings：契约是永不 reject，而 patchSettings 与
  // hydrateSettings 都直接 await 这个函数、外面没有 try，
  // 所以这里漏出去的异常会一路穿透到调用方。
  try {
    return migrateSettings(memory[KEY_APP]);
  } catch {
    return DEFAULT_SETTINGS();
  }
}

export async function patchSettings(partial) {
  return serialize(async () => {
    const current = await getSettings();

    let next;
    try {
      next = migrateSettings({ ...current, ...partial });
    } catch {
      // partial 里若有值在字符串化时抛错（keywords 里塞了个 toString 会抛的对象），
      // 宁可丢掉这次改动也要保住已有设置 —— 契约是永不 reject。
      return current;
    }

    try {
      await idbPut(KEY_APP, next);
    } catch {
      persistent = false;
      memory[KEY_APP] = next;
    }
    mirror(next);
    return next;
  });
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
  return serialize(async () => {
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
  });
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
  return serialize(async () => {
    const settings = await getSettings();
    try {
      await idbPut(KEY_APP, settings);   // 把迁移结果落盘
    } catch {
      persistent = false;
      memory[KEY_APP] = settings;
    }
    mirror(settings);
    return settings;
  });
}

export async function clearFavorites() {
  return serialize(async () => {
    try {
      await idbPut(KEY_FAV, []);
    } catch {
      persistent = false;
      memory[KEY_FAV] = [];
    }
    return [];
  });
}
