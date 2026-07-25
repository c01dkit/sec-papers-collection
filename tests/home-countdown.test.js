// tests/home-countdown.test.js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCountdown } from '@/scripts/home-countdown.js';

const PLACEHOLDER = '下一轮日期待公布';

// 这段 DOM 必须与 DeadlineDemo.astro 渲染出的结构一致 —— 两者一旦分叉，
// 测试会绿而线上会错，所以改动 DeadlineDemo 的结构时也要同步改这里。
const DAYS_LABEL = '天';
const PASSED_LABEL = '已截止';

// 结构必须与 DeadlineDemo.astro 一致。关键点：past 与非 past 用的是**同一套骨架**
// （data-days + unit），只有初始文案不同 —— 组件那边也是这么渲染的。
// 传 { ddl, past: true } 可以造出「构建时已过期」的初始状态。
function mount(rows) {
  document.body.innerHTML = `
    <div class="panel demo" data-countdown
         data-placeholder="${PLACEHOLDER}"
         data-days-label="${DAYS_LABEL}"
         data-passed-label="${PASSED_LABEL}">
      ${rows
        .map(
          (r) => `
        <div class="row${r.past ? ' past' : ''}" data-ddl="${r.ddl}">
          <div class="who"><div class="pub">${r.pub ?? 'V'}</div></div>
          <div class="num">
            <span data-days>${r.past ? PASSED_LABEL : '?'}</span>
            <span class="unit">${r.past ? '' : ' ' + DAYS_LABEL}</span>
          </div>
        </div>`
        )
        .join('')}
    </div>`;
  return document.querySelector('[data-countdown]');
}

const rowAt = (box, i) => box.querySelectorAll('[data-ddl]')[i];
const daysAt = (box, i) => rowAt(box, i).querySelector('[data-days]')?.textContent;
const numTextAt = (box, i) => rowAt(box, i).querySelector('.num').textContent.trim();
const isPastAt = (box, i) => rowAt(box, i).classList.contains('past');

describe('initCountdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('按访客本地的今天重算未来项的天数', () => {
    vi.setSystemTime(new Date(2026, 6, 25)); // 2026-07-25
    const box = mount([{ ddl: '2026-08-06' }]);
    initCountdown();
    expect(daysAt(box, 0)).toBe('12');
    expect(isPastAt(box, 0)).toBe(false);
  });

  it('当天的截止日算 0 天，不算过期', () => {
    vi.setSystemTime(new Date(2026, 7, 6));
    const box = mount([{ ddl: '2026-08-06' }]);
    initCountdown();
    expect(daysAt(box, 0)).toBe('0');
    expect(isPastAt(box, 0)).toBe(false);
  });

  it('构建时是未来、查看时已过期的行：标 past、显示破折号、绝不出现负数', () => {
    // 这正是构建时嵌入的天数会过期这件事本身
    vi.setSystemTime(new Date(2026, 8, 1)); // 2026-09-01
    const box = mount([{ ddl: '2026-08-06' }, { ddl: '2026-12-01' }]);
    initCountdown();
    expect(isPastAt(box, 0)).toBe(true);
    expect(numTextAt(box, 0)).toBe(PASSED_LABEL);
    expect(numTextAt(box, 0)).not.toMatch(/-\d/);
    expect(box.textContent).not.toMatch(/-\d+\s*天/);
    // 后面那条仍是未来，正常显示天数
    expect(isPastAt(box, 1)).toBe(false);
    expect(daysAt(box, 1)).toBe('91');
  });

  it('全部过期时整块换成占位文案', () => {
    vi.setSystemTime(new Date(2027, 0, 1));
    const box = mount([{ ddl: '2026-08-06' }, { ddl: '2026-09-20' }]);
    initCountdown();
    expect(box.textContent.trim()).toBe(PLACEHOLDER);
    expect(box.querySelectorAll('[data-ddl]')).toHaveLength(0);
  });

  it('区间日期取 ~ 之后的结束日 —— 与 parseDeadlineDate 保持一致', () => {
    // 守的是一处真实存在过的分歧：早先客户端自写正则取第一个日期匹配，
    // 而构建时取结束日，同一条截止日两处算出不同天数。
    // 今天在区间之内：取开始日会判成已过期，取结束日才是未来 5 天。
    vi.setSystemTime(new Date(2026, 7, 5)); // 2026-08-05
    const box = mount([{ ddl: '2026-08-01 ~ 2026-08-10' }]);
    initCountdown();
    expect(isPastAt(box, 0)).toBe(false);
    expect(daysAt(box, 0)).toBe('5');
  });

  it('data-ddl 解析不出日期时跳过该行且不抛错', () => {
    vi.setSystemTime(new Date(2026, 6, 25));
    const box = mount([{ ddl: 'TBA' }, { ddl: '2026-08-06' }]);
    expect(() => initCountdown()).not.toThrow();
    expect(daysAt(box, 0)).toBe('?'); // 原样保留
    expect(daysAt(box, 1)).toBe('12');
  });

  it('幂等：守卫生效后，即使时钟前进也不再重算', () => {
    // 光是「连调三次、值还一样」证明不了任何事：时钟不动时，重跑循环写回的是
    // 同一个值，把 dataset.bound 守卫整个删掉这条也照样绿 —— 那就是一条
    // 无法失败的测试。真正能falsify守卫的做法是在两次调用之间推进时钟：
    // 守卫在，第二次直接 return，显示值停在 12；守卫没了，会被改成 5。
    vi.setSystemTime(new Date(2026, 6, 25)); // 2026-07-25 → 距 08-06 十二天
    const box = mount([{ ddl: '2026-08-06' }]);
    initCountdown();
    expect(daysAt(box, 0)).toBe('12');

    vi.setSystemTime(new Date(2026, 7, 1)); // 2026-08-01 → 若重算会变成 5
    initCountdown();
    expect(daysAt(box, 0)).toBe('12');

    expect(box.querySelectorAll('[data-ddl]')).toHaveLength(1);
  });

  it('构建时已过期、查看时却是未来的行：天数与单位都要写回去', () => {
    // 构建服务器的「今天」与访客本地的「今天」最多能差约 26 小时，
    // 所以一行在构建时判为已过期、到访客那里又变成未来，是真实可达的。
    // 这条守的是：摘掉 .past 类的同时，天数和单位也必须一起写对 ——
    // 早先 past 行根本没有 [data-days] 元素，脚本改得了 class 却写不进文字，
    // 结果是「样式说未过期、文字还停在已截止」。
    vi.setSystemTime(new Date(2026, 7, 6)); // 2026-08-06 正是那一天
    const box = mount([{ ddl: '2026-08-06', past: true }]);
    initCountdown();

    expect(isPastAt(box, 0)).toBe(false);
    expect(daysAt(box, 0)).toBe('0');
    expect(numTextAt(box, 0)).toContain(DAYS_LABEL);
    expect(numTextAt(box, 0)).not.toContain(PASSED_LABEL);
  });

  it('页面上没有倒计时块时安全返回', () => {
    document.body.innerHTML = '<main></main>';
    expect(() => initCountdown()).not.toThrow();
  });
});
