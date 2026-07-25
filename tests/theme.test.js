import { describe, it, expect } from 'vitest';
import { nextTheme, cycleAccent } from '@/scripts/theme.js';
import { ACCENTS } from '@/lib/settings-schema.js';

describe('nextTheme', () => {
  it('明暗互换', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });

  it('脏值一律当作 light，切到 dark', () => {
    expect(nextTheme(undefined)).toBe('dark');
    expect(nextTheme('sepia')).toBe('dark');
  });
});

describe('cycleAccent', () => {
  it('按固定顺序向前轮转', () => {
    expect(cycleAccent('slate')).toBe('indigo');
    expect(cycleAccent('pine')).toBe('slate'); // 末尾回到开头
  });

  it('能反向轮转', () => {
    expect(cycleAccent('slate', -1)).toBe('pine');
  });

  it('脏值从第一个开始', () => {
    expect(cycleAccent('purple')).toBe(ACCENTS[0]);
  });
});
