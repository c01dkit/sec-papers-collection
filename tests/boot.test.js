// tests/boot.test.js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// boot.js 在模块顶层就绑定了 astro:page-load，所以每个用例都要重置模块，
// 否则上一个用例注册的页面和监听器会串进来。
async function freshBoot() {
  vi.resetModules();
  return import('@/scripts/boot.js');
}

function mountPage(name) {
  document.body.innerHTML =
    name === null ? '<main></main>' : `<main data-page="${name}"></main>`;
}

// boot() 是 async 的，事件派发后要把微任务与一轮宏任务都放干
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('boot 分派', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('data-page 命中已注册页面时，init 被调用一次', async () => {
    const { registerPage } = await freshBoot();
    const init = vi.fn();
    registerPage('search', init);
    mountPage('search');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('只触发匹配的那个页面，不误触其他已注册页面', async () => {
    const { registerPage } = await freshBoot();
    const search = vi.fn();
    const trends = vi.fn();
    registerPage('search', search);
    registerPage('trends', trends);
    mountPage('trends');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(trends).toHaveBeenCalledTimes(1);
    expect(search).not.toHaveBeenCalled();
  });

  it('data-page 未注册时不抛错', async () => {
    await freshBoot();
    mountPage('nobody-registered-this');

    document.dispatchEvent(new Event('astro:page-load'));
    await expect(settle()).resolves.toBeUndefined();
  });

  it('没有 data-page 属性时不抛错', async () => {
    await freshBoot();
    mountPage(null);

    document.dispatchEvent(new Event('astro:page-load'));
    await expect(settle()).resolves.toBeUndefined();
  });

  it('页面 init 抛错时被兜住并记录，不冒泡成未处理拒绝', async () => {
    const { registerPage } = await freshBoot();
    const err = new Error('页面初始化炸了');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerPage('broken', () => {
      throw err;
    });
    mountPage('broken');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(spy).toHaveBeenCalled();
    // 错误信息里要带上页面名，否则线上排查时看不出是哪个页面
    expect(spy.mock.calls[0].join(' ')).toContain('broken');
  });

  it('软导航重复触发时，init 每次都会跑（页面内容已被换掉）', async () => {
    const { registerPage } = await freshBoot();
    const init = vi.fn();
    registerPage('search', init);
    mountPage('search');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();
    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(init).toHaveBeenCalledTimes(2);
  });
});
