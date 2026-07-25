import { describe, it, expect } from 'vitest';
import { parseDeadlineDate, flattenDeadlines, pickUpcomingDeadlines } from '@/lib/deadlines.js';

const FIXTURE = [
  {
    publication: 'NDSS 2027',
    cycles: [
      {
        name: 'Cycle 1',
        ddls: [
          { value: '1', stage: 'Abstract registration', date: '2026-07-30' },
          { value: '2', stage: 'Paper submission', date: '2026-08-06' },
          { value: '3', stage: 'Reviews released', date: '2026-09-20' },
        ],
      },
    ],
  },
  {
    publication: 'IEEE S&P 2027',
    cycles: [
      {
        name: 'Cycle 2',
        ddls: [
          { value: '1', stage: 'Abstract registration', date: '2026-11-14' },
          { value: '2', stage: 'Interactive period', date: '2026-05-01 ~ 2026-05-10' },
          { value: '3', stage: 'To be announced', date: 'TBA' },
        ],
      },
    ],
  },
];

describe('parseDeadlineDate', () => {
  it('按本地时区解析，不发生 UTC 偏移', () => {
    // new Date('2026-06-04') 会被当成 UTC 午夜，在负时区会退到 6/3。必须按分量构造。
    expect(parseDeadlineDate('2026-06-04')).toEqual(new Date(2026, 5, 4));
  });

  it('区间取结束日', () => {
    expect(parseDeadlineDate('2026-05-01 ~ 2026-05-10')).toEqual(new Date(2026, 4, 10));
  });

  it('无法解析的返回 null', () => {
    expect(parseDeadlineDate('TBA')).toBeNull();
    expect(parseDeadlineDate('TBA, 2027')).toBeNull();
    expect(parseDeadlineDate('')).toBeNull();
    expect(parseDeadlineDate(undefined)).toBeNull();
  });
});

describe('flattenDeadlines', () => {
  it('展平成扁平列表并带上会议与周期名', () => {
    const flat = flattenDeadlines(FIXTURE);
    expect(flat[0]).toMatchObject({
      publication: 'NDSS 2027',
      cycle: 'Cycle 1',
      stage: 'Abstract registration',
      iso: '2026-07-30',
    });
  });

  it('跳过无法解析的日期', () => {
    const flat = flattenDeadlines(FIXTURE);
    expect(flat.some((d) => d.stage === 'To be announced')).toBe(false);
  });

  it('总条数 = 可解析的 ddl 数', () => {
    expect(flattenDeadlines(FIXTURE)).toHaveLength(5);   // 3 + 2（TBA 那条被跳过）
  });
});

describe('pickUpcomingDeadlines', () => {
  it('全是未来时按日期升序取前 3，placeholder 为 false', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 25));   // 2026-07-25
    expect(r.placeholder).toBe(false);
    expect(r.items).toHaveLength(3);
    expect(r.items.map((i) => i.iso)).toEqual(['2026-07-30', '2026-08-06', '2026-09-20']);
    expect(r.items.every((i) => i.past === false)).toBe(true);
  });

  it('天数按本地午夜差计算', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 25));
    expect(r.items[0].daysLeft).toBe(5);    // 07-25 → 07-30
    expect(r.items[1].daysLeft).toBe(12);   // 07-25 → 08-06
  });

  it('当天的截止日算未来，天数为 0', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 30));
    expect(r.items[0].iso).toBe('2026-07-30');
    expect(r.items[0].daysLeft).toBe(0);
    expect(r.items[0].past).toBe(false);
  });

  it('未来不足 3 条时，用最近的已过期项补齐并标 past', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 10, 1));   // 2026-11-01
    expect(r.placeholder).toBe(false);
    expect(r.items).toHaveLength(3);
    expect(r.items[0]).toMatchObject({ iso: '2026-11-14', past: false });
    // 补位的按「最近过期的排前面」
    expect(r.items[1]).toMatchObject({ iso: '2026-09-20', past: true });
    expect(r.items[2]).toMatchObject({ iso: '2026-08-06', past: true });
  });

  it('一条未来的都没有时给 placeholder，不返回负天数', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2027, 0, 1));
    expect(r.placeholder).toBe(true);
    expect(r.items).toEqual([]);
  });

  it('空数据给 placeholder', () => {
    expect(pickUpcomingDeadlines([], new Date())).toEqual({ items: [], placeholder: true });
    expect(pickUpcomingDeadlines(undefined, new Date())).toEqual({ items: [], placeholder: true });
  });

  it('want 可调', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 25), 2);
    expect(r.items).toHaveLength(2);
  });
});
