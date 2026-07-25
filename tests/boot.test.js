// tests/boot.test.js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// boot.js 在模块顶层就 document.addEventListener('astro:page-load', boot)。
// vi.resetModules() 只让下次 import 拿到新模块实例，**不会摘掉上一个实例已经
// 挂在 document 上的监听器** —— 不处理的话监听器会逐个用例累积（1→2→3…），
// 每次 dispatch 都会把之前所有模块实例的 boot 一起跑一遍。目前恰好无害
// （六个用例的 page 名互不相同），但这等于测试之间没有隔离，
// 而这套测试正是要给「后续 13 个任务共用的分派入口」当回归网 ——
// 网自己漏着不行。所以显式记录并在 afterEach 摘掉。
let pageLoadListeners = [];

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
    pageLoadListeners = [];
    // 必须在 freshBoot() 之前装好：boot.js 是在被 import 的那一刻注册监听器的
    const realAdd = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'astro:page-load') pageLoadListeners.push(fn);
      return realAdd(type, fn, opts);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const fn of pageLoadListeners) {
      document.removeEventListener('astro:page-load', fn);
    }
    pageLoadListeners = [];
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

  // 这两条用例共同构成一条断言，必须相邻且按声明顺序执行（vitest 默认如此）。
  // 这是有意的用例间耦合 —— 跨用例污染只能跨用例观测。
  //
  // 为什么不能用「数一下 pageLoadListeners 的长度」来守：pageLoadListeners
  // 每个 beforeEach 都被清空，而每个用例只调一次 freshBoot()，所以它恒等于
  // 1 —— 不管 afterEach 的摘除有没有生效。那种断言是同义反复，读起来像覆盖率、
  // 实际什么都不守，比没有测试更糟。
  //
  // 真正能观测到跨用例污染的办法是：前一个用例留下一个探针 init，后一个用例
  // 挂同样的 page 名再派发一次，断言探针没有被再调用。若 afterEach 的摘除被
  // 删掉，前一个模块实例的 boot 会跟着跑、命中它自己 PAGES 里的探针，
  // 计数变 2，测试当场红。
  let leakProbe;

  it('留下一个探针 init（与下一条共同构成隔离断言）', async () => {
    const { registerPage } = await freshBoot();
    leakProbe = vi.fn();
    registerPage('leak-probe', leakProbe);
    mountPage('leak-probe');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(leakProbe).toHaveBeenCalledTimes(1);
  });

  it('上一个用例的监听器不会在本用例里被触发（隔离断言）', async () => {
    // 新模块实例的 PAGES 是空的，没有 leak-probe。
    await freshBoot();
    // 故意挂上一个用例的 page 名：若上一个模块实例的监听器还挂在 document 上，
    // 它的 boot 会跑起来并在自己的 PAGES 里命中 leak-probe，把计数推到 2。
    mountPage('leak-probe');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(leakProbe).toHaveBeenCalledTimes(1); // 仍是 1 —— 没有被第二次调用
  });
});
