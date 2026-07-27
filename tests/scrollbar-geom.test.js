import { describe, it, expect } from 'vitest';
import { thumbLayout, scrollFromDrag, MIN_THUMB } from '@/lib/scrollbar-geom.js';

// 一个好算的基准场景：视口 1000、文档 4000，两端各留 100。
// 滑轨 = 1000 - 200 = 800；滑块 = 800 * (1000/4000) = 200；travel = 600；
// 可滚动距离 = 3000。
const BASE = { viewport: 1000, content: 4000, inset: 100 };

describe('thumbLayout', () => {
  it('内容不足一屏时返回 null —— 调用方据此整条藏掉', () => {
    expect(thumbLayout({ viewport: 800, content: 800, scrollY: 0 })).toBeNull();
    expect(thumbLayout({ viewport: 800, content: 500, scrollY: 0 })).toBeNull();
  });

  it('留白吃光滑轨时也返回 null，而不是画一根负长度的滑块', () => {
    expect(thumbLayout({ viewport: 200, content: 4000, scrollY: 0, inset: 100 })).toBeNull();
  });

  it('入参缺失（NaN）时返回 null，不把 NaN 写进样式', () => {
    expect(thumbLayout({ viewport: NaN, content: 4000, scrollY: 0 })).toBeNull();
    expect(thumbLayout({ viewport: 1000, content: NaN, scrollY: 0 })).toBeNull();
  });

  it('滑块长度按滑轨（而非视口）等比缩放', () => {
    expect(thumbLayout({ ...BASE, scrollY: 0 }).height).toBe(200);
  });

  it('滚到顶时 offset 为 0 —— CSS 的 top 已经把上端留白算进去了，不能再加一次', () => {
    // 这一条是这个模块存在的理由。offset 若误加 inset，滚到顶的滑块会掉到
    // 200px 处，看起来像「顶部凭空多出一段滚不到的区域」。
    expect(thumbLayout({ ...BASE, scrollY: 0 }).offset).toBe(0);
  });

  it('滚到底时滑块正好停在滑轨末端，下端留白原样保留', () => {
    const g = thumbLayout({ ...BASE, scrollY: 3000 });
    expect(g.offset).toBe(g.travel);
    expect(g.travel).toBe(600);
    // 视口坐标里滑块底边 = inset + offset + height = 100 + 600 + 200 = 900，
    // 离视口下缘正好还剩 100 —— 与上端留白对称。
    expect(BASE.inset + g.offset + g.height).toBe(BASE.viewport - BASE.inset);
  });

  it('滚到中间时 offset 与滚动比例成正比', () => {
    expect(thumbLayout({ ...BASE, scrollY: 1500 }).offset).toBe(300);
  });

  it('scrollY 越界（回弹、负值）时 offset 被夹在滑轨内', () => {
    expect(thumbLayout({ ...BASE, scrollY: -200 }).offset).toBe(0);
    expect(thumbLayout({ ...BASE, scrollY: 99999 }).offset).toBe(600);
  });

  it('文档极长时滑块不短于 MIN_THUMB，否则抓不住也读不出剩余量', () => {
    const g = thumbLayout({ viewport: 1000, content: 5_000_000, scrollY: 0, inset: 100 });
    expect(g.height).toBe(MIN_THUMB);
    expect(g.travel).toBe(800 - MIN_THUMB);
  });

  it('滑轨比 MIN_THUMB 还短时，滑块退到占满滑轨、travel 归零（而不是溢出滑轨）', () => {
    const g = thumbLayout({ viewport: 120, content: 100_000, scrollY: 50_000, inset: 50 });
    expect(g.height).toBe(20); // 滑轨 = 120 - 100
    expect(g.travel).toBe(0);
    expect(g.offset).toBe(0);
  });

  it('inset 缺省为 0 —— 退化成「贴着视口两端」的普通滑块', () => {
    const g = thumbLayout({ viewport: 1000, content: 4000, scrollY: 3000 });
    expect(g.height).toBe(250);
    expect(g.offset).toBe(750);
  });

  it('scrollable 与 travel 直接喂给 scrollFromDrag，两者口径一致', () => {
    const g = thumbLayout({ ...BASE, scrollY: 0 });
    expect(g.scrollable).toBe(3000);
    // 把滑块从顶端拖到末端（travel 像素），应当正好滚到底
    expect(scrollFromDrag({ startScroll: 0, deltaY: g.travel, ...g })).toBe(g.scrollable);
  });
});

describe('scrollFromDrag', () => {
  const G = { travel: 600, scrollable: 3000 };

  it('位移按 scrollable/travel 放大', () => {
    expect(scrollFromDrag({ startScroll: 0, deltaY: 60, ...G })).toBe(300);
    expect(scrollFromDrag({ startScroll: 600, deltaY: -60, ...G })).toBe(300);
  });

  it('结果夹在 [0, scrollable] 内 —— 拖出视口不会滚到负数或超出文档', () => {
    expect(scrollFromDrag({ startScroll: 0, deltaY: -9999, ...G })).toBe(0);
    expect(scrollFromDrag({ startScroll: 0, deltaY: 9999, ...G })).toBe(3000);
  });

  it('travel 为 0（滑块占满滑轨）时原地不动，不产生除零', () => {
    const r = scrollFromDrag({ startScroll: 1234, deltaY: 500, travel: 0, scrollable: 3000 });
    expect(r).toBe(1234);
  });
});
