// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
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
    await s.patchSettings({ showStatusDots: true });
    const got = await s.getSettings();
    expect(got.keywords).toEqual(['a']);
    expect(got.showStatusDots).toBe(true);
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

  it('镜像六个键到 localStorage 供预绘制同步读取', async () => {
    const s = await freshStore();
    await s.patchSettings({ theme: 'oxblood', darkTheme: true, language: 'zh', rememberDarkMode: true });
    expect(localStorage.getItem(MIRROR.accent)).toBe('oxblood');
    expect(localStorage.getItem(MIRROR.theme)).toBe('dark');
    expect(localStorage.getItem(MIRROR.lang)).toBe('zh');
    expect(localStorage.getItem(MIRROR.rememberDark)).toBe('1');
  });
});

describe('hydrateSettings —— 老用户数据的迁移与镜像', () => {
  it('把迁移后的形状写回库里，死字段真的消失', async () => {
    const s = await freshStore();
    // 造一条旧站格式的记录（含两个死字段与已废弃的 theme 值）
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
    expect(raw.theme).toBe('slate');          // green 不在新 slug 列表里
    expect(raw.keywords).toEqual(['fuzzing', 'C++']);
    expect(raw.showStatusDots).toBe(true);
    expect(raw.darkTheme).toBe(true);
  });

  it('填充 localStorage 镜像，供下次首绘同步读取', async () => {
    const s = await freshStore();
    await s.__writeRaw('app', {
      theme: 'pine',
      language: 'zh',
      darkTheme: true,
      rememberDarkMode: true,
      rememberTheme: true,
      rememberLanguage: true,
    });
    expect(localStorage.getItem(MIRROR.accent)).toBeNull(); // 老用户没有镜像

    await s.hydrateSettings();

    expect(localStorage.getItem(MIRROR.accent)).toBe('pine');
    expect(localStorage.getItem(MIRROR.theme)).toBe('dark');
    expect(localStorage.getItem(MIRROR.lang)).toBe('zh');
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
