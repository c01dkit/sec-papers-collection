import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const tokens = fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8');
const global = fs.readFileSync(path.resolve('src/styles/global.css'), 'utf8');

const ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
const THEMES = ['light', 'dark'];

describe('tokens.css', () => {
  it('明暗两套语义色都定义齐全', () => {
    const vars = ['--bg', '--band', '--panel', '--ink', '--muted', '--faint', '--hairline', '--hairline-soft', '--hl-bg', '--mx-top-rgb', '--mx-se-rgb', '--mx-empty'];
    for (const theme of THEMES) {
      const block = tokens.match(new RegExp(`\\[data-theme=['"]?${theme}['"]?\\]\\s*\\{([^}]*)\\}`));
      expect(block, `缺少 data-theme=${theme} 区块`).toBeTruthy();
      for (const v of vars) {
        expect(block[1], `${theme} 缺少 ${v}`).toContain(v + ':');
      }
    }
  });

  it('4 个强调色在明暗下各有一组 --accent / --accent-soft', () => {
    for (const theme of THEMES) {
      for (const accent of ACCENTS) {
        const re = new RegExp(
          `\\[data-theme=['"]?${theme}['"]?\\]\\[data-accent=['"]?${accent}['"]?\\]\\s*\\{([^}]*)\\}`
        );
        const block = tokens.match(re);
        expect(block, `缺少 ${theme}/${accent} 组合`).toBeTruthy();
        expect(block[1]).toContain('--accent:');
        expect(block[1]).toContain('--accent-soft:');
      }
    }
  });
});

// 这两条纪律要覆盖整个 src/，不能只查 tokens.css 与 global.css ——
// 违规最可能出现的地方是后续任务里 .astro 组件内的 <style> 块。
// 现在 src/ 下还没有 .astro 组件，这个守卫先立在这里，随组件到位自动开始生效。
function styleSources() {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(astro|css)$/.test(e.name)) out.push(p);
    }
  };
  walk(path.resolve('src'));
  return out;
}

describe('视觉纪律', () => {
  it('src/ 下任何样式都不使用 box-shadow', () => {
    const offenders = styleSources().filter((f) => /box-shadow/.test(fs.readFileSync(f, 'utf8')));
    expect(offenders.map((f) => path.relative(process.cwd(), f))).toEqual([]);
  });

  it('px 字面量圆角不超过 2px', () => {
    // 只查 px 字面量。药丸形开关轨道（rem）与圆形滑块（50%）是「形状即语义」的
    // 表单控件，按 Global Constraints 第 3 条豁免，所以不查 rem/%。
    // 这是一道绊线而非证明：它拦住「随手写个 8px 圆角」这类最常见的破例。
    const offenders = [];
    for (const f of styleSources()) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/border-radius:\s*([\d.]+)px/g)) {
        if (Number(m[1]) > 2) offenders.push(`${path.relative(process.cwd(), f)}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
