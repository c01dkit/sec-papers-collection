// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { DEFAULT_SETTINGS, MIRROR } from '@/lib/settings-schema.js';

async function freshStore({ withIDB = true } = {}) {
  // 每个用例一套干净的库与模块实例（store 内部缓存了 db promise）
  if (withIDB) globalThis.indexedDB = new IDBFactory();
  else delete globalThis.indexedDB;
  localStorage.clear();
  vi.resetModules();
  return import('@/scripts/settings-store.js');
}

describe('IndexedDB 可用时', () => {
  it('首次读取给默认值', async () => {
    const s = await freshStore();
    expect(await s.getSettings()).toEqual(DEFAULT_SETTINGS());
    expect(s.isPersistent()).toBe(true);
  });

  it('写入后能读回', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['fuzz', 'LLM'], theme: 'pine' });
    const got = await s.getSettings();
    expect(got.keywords).toEqual(['fuzz', 'LLM']);
    expect(got.theme).toBe('pine');
  });

  it('patch 是合并而非覆盖', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['a'] });
    await s.patchSettings({ rememberTheme: true });
    const got = await s.getSettings();
    expect(got.keywords).toEqual(['a']);
    expect(got.rememberTheme).toBe(true);
  });

  it('读取时对库里的脏数据做迁移', async () => {
    const s = await freshStore();
    await s.patchSettings({ theme: 'pine' });
    // 直接往库里塞一份旧格式数据，绕过 patchSettings
    await s.__writeRaw('app', { theme: 'green', llmApiKey: 'sk-1', keywords: 'oops' });
    const got = await s.getSettings();
    expect(got.theme).toBe('slate');
    expect(got).not.toHaveProperty('llmApiKey');
    expect(got.keywords).toEqual([]);
  });

  it('收藏能增删且顺序稳定', async () => {
    const s = await freshStore();
    expect(await s.getFavorites()).toEqual([]);
    const r1 = await s.toggleFavorite(42);
    expect(r1).toEqual({ favorites: [42], added: true });
    await s.toggleFavorite(7);
    expect(await s.getFavorites()).toEqual([42, 7]);
    const r2 = await s.toggleFavorite(42);
    expect(r2).toEqual({ favorites: [7], added: false });
  });

  it('设置与收藏互不干扰（同 store 不同 key）', async () => {
    const s = await freshStore();
    await s.toggleFavorite(1);
    await s.patchSettings({ keywords: ['x'] });
    expect(await s.getFavorites()).toEqual([1]);
    expect((await s.getSettings()).keywords).toEqual(['x']);
  });

  it('沿用现有 schema：库名 / store 名 / key 名一字不改', async () => {
    const s = await freshStore();
    await s.patchSettings({ theme: 'pine' });
    await s.toggleFavorite(1);

    const dbs = await globalThis.indexedDB.databases();
    expect(dbs.map((d) => d.name)).toContain('spc-settings');

    const db = await new Promise((res, rej) => {
      const req = globalThis.indexedDB.open('spc-settings');
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames]).toEqual(['config']);
    const keys = await new Promise((res, rej) => {
      const req = db.transaction('config').objectStore('config').getAllKeys();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    expect(keys.sort()).toEqual(['app', 'favorites']);
    db.close();
  });

  it('镜像五个键到 localStorage 供预绘制同步读取（没有 lang —— 那个键归 nav.js 管）', async () => {
    const s = await freshStore();
    await s.patchSettings({
      theme: 'oxblood',
      darkTheme: true,
      rememberDarkMode: true,
      rememberTheme: true,
      rememberLanguage: true,
    });
    expect(localStorage.getItem(MIRROR.accent)).toBe('oxblood');
    expect(localStorage.getItem(MIRROR.theme)).toBe('dark');
    expect(localStorage.getItem(MIRROR.rememberDark)).toBe('1');
    expect(localStorage.getItem(MIRROR.rememberAccent)).toBe('1');
    expect(localStorage.getItem(MIRROR.rememberLang)).toBe('1');
    expect(MIRROR).not.toHaveProperty('lang');
  });
});

describe('并发写：读—改—写必须串行，不能丢更新', () => {
  it('两个并发 patchSettings，两处改动都要留下', async () => {
    const s = await freshStore();
    // 不 await 第一个就发第二个 —— 这正是连点两个按钮的样子
    const a = s.patchSettings({ darkTheme: true });
    const b = s.patchSettings({ theme: 'pine' });
    await Promise.all([a, b]);

    const got = await s.getSettings();
    expect(got.darkTheme).toBe(true);   // 没被 b 的旧快照覆盖
    expect(got.theme).toBe('pine');     // 也没被 a 覆盖
  });

  it('两个并发 toggleFavorite，两个 id 都要在', async () => {
    const s = await freshStore();
    await Promise.all([s.toggleFavorite(1), s.toggleFavorite(2)]);
    expect((await s.getFavorites()).sort()).toEqual([1, 2]);
  });

  it('hydrateSettings 与点击并发时，不把用户刚改的值回滚', async () => {
    const s = await freshStore();
    // 老用户的库：深色关、强调色是已废弃的 green
    await s.__writeRaw('app', { theme: 'green', darkTheme: false, rememberDarkMode: true });

    // **调用顺序很关键**：必须先发点击、后发水合。
    // 反过来写（先水合后点击）的话，水合的写入会先落盘、点击的写入后落盘，
    // 正确结果是靠顺序碰巧得到的 —— 即使把 serialize 拆掉这条也照样绿，
    // 那就是一条检测不到竞态的测试（实测直通状态下 10/10 全过）。
    // 先点击后水合才会让水合的旧快照最后落盘、盖掉用户的改动，
    // 也正是要防的那个真实场景（实测直通状态下 5/5 全红）。
    const c = s.patchSettings({ darkTheme: true, rememberDarkMode: true });
    const h = s.hydrateSettings();
    await Promise.all([c, h]);

    const got = await s.getSettings();
    expect(got.darkTheme).toBe(true);   // 用户的点击必须活下来
    expect(got.theme).toBe('slate');    // 迁移也必须生效
  });

  it('十个并发 toggleFavorite 全部保留，一个不丢', async () => {
    const s = await freshStore();
    const ids = [11, 22, 33, 44, 55, 66, 77, 88, 99, 100];
    await Promise.all(ids.map((i) => s.toggleFavorite(i)));
    expect((await s.getFavorites()).sort((a, b) => a - b)).toEqual(ids);
  });

  it('水合在前、点击在后同样不丢更新（对称性）', async () => {
    // 这条与上一条互为镜像。它**单独**并不能检测出竞态 ——
    // 实测把 serialize 拆掉后它 10/10 全过，因为这个顺序下水合的写入先落盘、
    // 点击的写入后落盘，正确结果是靠顺序碰巧得到的。
    // 留着它是为了记录「两种派发顺序都应当安全」这条性质：serialize 的 FIFO
    // 队列本身与派发顺序无关，将来若有人改成某种带偏向的实现，这条会跟着红。
    // 真正有鉴别力的是上一条（先点击后水合）。
    const s = await freshStore();
    await s.__writeRaw('app', { theme: 'green', darkTheme: false, rememberDarkMode: true });

    const h = s.hydrateSettings();
    const c = s.patchSettings({ darkTheme: true, rememberDarkMode: true });
    await Promise.all([h, c]);

    const got = await s.getSettings();
    expect(got.darkTheme).toBe(true);
    expect(got.theme).toBe('slate');
  });
});

describe('openDb 的失败不该拖垮整个会话', () => {
  it('一次瞬时失败之后，下一次调用会重新尝试', async () => {
    localStorage.clear();
    vi.resetModules();
    const real = new IDBFactory();
    let calls = 0;
    // 第一次 open 直接失败，之后恢复正常
    globalThis.indexedDB = {
      open: (...args) => {
        calls++;
        if (calls === 1) {
          const req = {};
          setTimeout(() => req.onerror && req.onerror(), 0);
          return req;
        }
        return real.open(...args);
      },
      databases: () => real.databases(),
    };
    const s = await import('@/scripts/settings-store.js');

    // 第一次读：失败 → 走内存兜底
    await expect(s.getSettings()).resolves.toBeTruthy();
    expect(s.isPersistent()).toBe(false);

    // 第二次写：应当重新 open 并真的落盘，而不是因为缓存了 rejected promise
    // 而整个会话都困在内存里
    await s.patchSettings({ theme: 'pine' });
    expect(calls).toBeGreaterThan(1);
    const raw = await s.__readRaw('app');
    expect(raw?.theme).toBe('pine');
  });
});

describe('降级标志要能恢复', () => {
  it('瞬时失败后重试成功，isPersistent() 回到 true', async () => {
    localStorage.clear();
    vi.resetModules();
    const real = new IDBFactory();
    let calls = 0;
    globalThis.indexedDB = {
      open: (...args) => {
        calls++;
        if (calls === 1) {
          const req = {};
          setTimeout(() => req.onerror && req.onerror(), 0);
          return req;
        }
        return real.open(...args);
      },
      databases: () => real.databases(),
    };
    const s = await import('@/scripts/settings-store.js');

    await s.getSettings();
    expect(s.isPersistent()).toBe(false);   // 第一次失败，降级

    await s.patchSettings({ theme: 'pine' });
    // 重试成功、数据真的落盘了，标志就该收回来 ——
    // 否则 Task 19 的降级提示会永久挂着，等于对用户说假话
    expect(s.isPersistent()).toBe(true);
  });

  it('连接健康但事务失败后又成功，标志同样能收回 true', async () => {
    // 覆盖「连接开着、事务失败」这一类，配额耗尽是最典型的情形。
    // 只在 openDb 的 onsuccess 里置 true 的实现会让这条红 ——
    // 因为连接一直是同一个，不会重新 open。
    //
    // 制造方式：临时替换 IDBObjectStore.prototype.put，让**下一次** put 返回一个
    // 立即 onerror 的假请求。比包装 indexedDB.open 简单得多，也不用碰连接生命周期。
    const s = await freshStore();
    await s.patchSettings({ theme: 'slate' });
    expect(s.isPersistent()).toBe(true);

    const realPut = IDBObjectStore.prototype.put;
    let failOnce = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (failOnce) {
        failOnce = false;
        const req = {};
        setTimeout(() => req.onerror && req.onerror(), 0);
        return req;
      }
      return realPut.apply(this, args);
    };

    try {
      await s.patchSettings({ theme: 'pine' });
      expect(s.isPersistent()).toBe(false);   // 事务失败 → 降级

      await s.patchSettings({ theme: 'indigo' });
      expect(s.isPersistent()).toBe(true);    // 写又成功了 → 收回
    } finally {
      IDBObjectStore.prototype.put = realPut;
    }
  });

  it('clearFavorites 成功后也能收回标志 —— 它前面没有读操作', async () => {
    // 这条补的是一个真实的覆盖漏洞：patchSettings / toggleFavorite /
    // hydrateSettings 都会先读（getSettings/getFavorites → idbGet，那里已经会
    // 置 true），所以 idbPut 自己那行 persistent = true 在这三条路径上是被**遮住**的
    // —— 把它删掉，上面那条「事务失败后又成功」的测试照样绿。
    // clearFavorites 是唯一没有前置读的写函数，只有走它才能验到 idbPut 那行。
    const s = await freshStore();
    await s.toggleFavorite(1);

    const realPut = IDBObjectStore.prototype.put;
    let failOnce = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (failOnce) {
        failOnce = false;
        const req = {};
        setTimeout(() => req.onerror && req.onerror(), 0);
        return req;
      }
      return realPut.apply(this, args);
    };

    try {
      // 先让一次写失败，把标志打到 false
      await s.toggleFavorite(2);
      expect(s.isPersistent()).toBe(false);

      // clearFavorites 不读只写：成功后必须靠 idbPut 那行把标志收回来
      await s.clearFavorites();
      expect(s.isPersistent()).toBe(true);
    } finally {
      IDBObjectStore.prototype.put = realPut;
    }
  });

  it('连接开得起来也不足以清掉降级标志', async () => {
    // Step 0 删了两处 persistent = true：idbGet 的和 openDb 的。上一条测试盯住了
    // idbGet，openDb 那处却没人守 —— 把它加回去，全套测试照样全绿。补这条。
    // 语义上同理：连接健康完全不代表写得进去，配额耗尽时连接一直是好的。
    const s = await freshStore();

    const realPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      const req = {};
      setTimeout(() => req.onerror && req.onerror(), 0);
      return req;
    };

    try {
      await s.patchSettings({ theme: 'pine' });   // 写失败 → 标志落下
      expect(s.isPersistent()).toBe(false);
    } finally {
      IDBObjectStore.prototype.put = realPut;
    }

    // 丢掉缓存连接，下一次操作会重新 open。open 成功本身不该把标志抬回来。
    s.__reopenDb();
    await s.getSettings();                     // 触发重新 open + 一次成功的读
    expect(s.isPersistent()).toBe(false);

    // 只有一次真正成功的写才算数
    await s.patchSettings({ theme: 'indigo' });
    expect(s.isPersistent()).toBe(true);
  });

  it('只有读成功不足以清掉降级标志 —— 写不进就该一直显示降级', async () => {
    // 配额耗尽的典型形态就是「读得到、写不进」。设置页那句提示的意思是
    // 「你的偏好保存不了」，一次成功的读对这件事什么都没证明。
    const s = await freshStore();
    await s.patchSettings({ keywords: ['x'] });   // 先确保库里有东西可读

    const realPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      const req = {};
      setTimeout(() => req.onerror && req.onerror(), 0);
      return req;
    };

    try {
      await s.patchSettings({ theme: 'pine' });   // 写失败
      expect(s.isPersistent()).toBe(false);

      // 读是成功的（数据还在），但写仍然坏着 —— 标志必须保持 false
      await expect(s.getSettings()).resolves.toBeTruthy();
      expect(s.isPersistent()).toBe(false);

      await expect(s.getFavorites()).resolves.toEqual([]);
      expect(s.isPersistent()).toBe(false);
    } finally {
      IDBObjectStore.prototype.put = realPut;
    }
  });
});

describe('永不 reject：连恶意入参也不例外', () => {
  it('keywords 里塞一个字符串化会抛错的对象，patchSettings 仍然 resolve', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['fuzzing'] });
    const bad = {
      [Symbol.toPrimitive]() {
        throw new Error('boom');
      },
    };
    // 契约是永不 reject —— 宁可丢掉这次改动，也要保住已有设置
    await expect(s.patchSettings({ keywords: [bad] })).resolves.toBeTruthy();
    expect((await s.getSettings()).keywords).toEqual(['fuzzing']);
  });
});

describe('clearFavorites', () => {
  it('清空后为空数组，且不影响 app 记录', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['x'] });
    await s.toggleFavorite(5);
    expect(await s.clearFavorites()).toEqual([]);
    expect(await s.getFavorites()).toEqual([]);
    expect((await s.getSettings()).keywords).toEqual(['x']);
  });
});

describe('hydrateSettings —— 老用户数据的迁移与镜像', () => {
  it('把迁移后的形状写回库里，死字段真的消失', async () => {
    const s = await freshStore();
    // 造一条旧站格式的记录（含四个死字段与已废弃的 theme 值）：llmEndpoint/
    // llmApiKey 全站无消费方；language 从来没人写过、真正的语言记忆在 nav.js
    // 直接写的 spc-lang 里；showStatusDots 唯一消费方 PaperStats.vue 已随旧
    // Vue 应用一起删除。四者都该被当成死字段丢掉。
    await s.__writeRaw('app', {
      theme: 'green',
      language: 'zh',
      darkTheme: true,
      rememberDarkMode: true,
      rememberTheme: true,
      showStatusDots: true,
      llmEndpoint: 'https://api.example.com/v1/chat/completions',
      llmApiKey: 'sk-must-be-removed',
      keywords: ['fuzzing', 'C++'],
    });

    await s.hydrateSettings();

    // 直接读原始记录：迁移必须已落盘，不能只在内存里对
    const raw = await s.__readRaw('app');
    expect(raw).not.toHaveProperty('llmEndpoint');
    expect(raw).not.toHaveProperty('llmApiKey');
    expect(raw).not.toHaveProperty('language');
    expect(raw).not.toHaveProperty('showStatusDots');
    expect(raw.theme).toBe('slate');          // green 不在新 slug 列表里
    expect(raw.keywords).toEqual(['fuzzing', 'C++']);
    expect(raw.darkTheme).toBe(true);
  });

  it('填充 localStorage 镜像，供下次首绘同步读取', async () => {
    const s = await freshStore();
    await s.__writeRaw('app', {
      theme: 'pine',
      darkTheme: true,
      rememberDarkMode: true,
      rememberTheme: true,
      rememberLanguage: true,
    });
    expect(localStorage.getItem(MIRROR.accent)).toBeNull(); // 老用户没有镜像

    await s.hydrateSettings();

    expect(localStorage.getItem(MIRROR.accent)).toBe('pine');
    expect(localStorage.getItem(MIRROR.theme)).toBe('dark');
    expect(localStorage.getItem(MIRROR.rememberDark)).toBe('1');
  });

  it('不动收藏', async () => {
    const s = await freshStore();
    await s.__writeRaw('favorites', [1, 42, 7]);
    await s.hydrateSettings();
    expect(await s.getFavorites()).toEqual([1, 42, 7]); // 顺序也不动
  });

  it('库里本来是空的也不报错，写入默认值', async () => {
    const s = await freshStore();
    await expect(s.hydrateSettings()).resolves.toMatchObject({ theme: 'slate' });
  });

  it('IndexedDB 不可用时不 reject', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.hydrateSettings()).resolves.toBeTruthy();
  });
});

describe('IndexedDB 不可用时', () => {
  it('getSettings 不抛错，给默认值', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.getSettings()).resolves.toEqual(DEFAULT_SETTINGS());
    expect(s.isPersistent()).toBe(false);
  });

  it('patchSettings 不抛错，本会话内仍生效', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.patchSettings({ keywords: ['a'] })).resolves.toMatchObject({ keywords: ['a'] });
    expect((await s.getSettings()).keywords).toEqual(['a']);
  });

  it('主题与强调色仍镜像进 localStorage，体验不退化', async () => {
    const s = await freshStore({ withIDB: false });
    await s.patchSettings({ theme: 'pine' });
    expect(localStorage.getItem(MIRROR.accent)).toBe('pine');
  });

  it('收藏操作不抛错，退成本会话有效', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.toggleFavorite(5)).resolves.toEqual({ favorites: [5], added: true });
    expect(await s.getFavorites()).toEqual([5]);
  });
});
