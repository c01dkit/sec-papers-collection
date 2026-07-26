import { seriesStyle } from '@/lib/chart-palette.js';

let charts = [];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function options() {
  const tick = cssVar('--faint');
  const grid = cssVar('--hairline-soft');
  const text = cssVar('--muted');
  return {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: text, boxWidth: 18, boxHeight: 2, usePointStyle: false } },
      tooltip: {
        backgroundColor: cssVar('--panel'),
        titleColor: cssVar('--ink'),
        bodyColor: text,
        borderColor: cssVar('--hairline'),
        borderWidth: 1,
        cornerRadius: 2,
        displayColors: true,
      },
    },
    scales: {
      x: { ticks: { color: tick }, grid: { color: grid, drawTicks: false }, border: { color: grid } },
      y: {
        beginAtZero: true,
        ticks: { color: tick, precision: 0 },
        grid: { color: grid, drawTicks: false },
        border: { color: grid },
      },
    },
  };
}

export async function initTrendsChart() {
  const dataEl = document.getElementById('trendData');
  if (!dataEl || dataEl.dataset.bound) return;
  dataEl.dataset.bound = '1';

  // Chart.js 只在这一页需要，动态 import 让其余 8 个页面不背这 ~60KB
  const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler } =
    await import('chart.js');
  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler);

  const groups = JSON.parse(dataEl.textContent);

  const build = () => {
    for (const c of charts) c.destroy();
    charts = [];
    for (const g of groups) {
      const canvas = document.querySelector(`canvas[data-chart="${g.category}"]`);
      if (!canvas) continue;
      charts.push(
        new Chart(canvas, {
          type: 'line',
          data: {
            labels: g.years,
            datasets: g.series.map((s, i) => ({
              label: s.label,
              data: s.data,
              fill: false,
              tension: 0.35,
              borderWidth: 1.6,
              pointRadius: 0,
              pointHitRadius: 12,
              spanGaps: false,   // null 处断线，如实反映该年没办
              ...seriesStyle(i, cssVar),
            })),
          },
          options: options(),
        })
      );
    }
  };

  build();

  // 明暗切换后重建：Chart.js 把颜色烤进了实例，改 CSS 变量不会让它自己更新
  if (!window.__spcTrendThemeObserver) {
    window.__spcTrendThemeObserver = new MutationObserver(() => {
      if (charts.length) build();
    });
    window.__spcTrendThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-accent'],
    });
  }

  // 软导航离开本页时销毁，避免 canvas 泄漏
  document.addEventListener(
    'astro:before-swap',
    () => {
      for (const c of charts) c.destroy();
      charts = [];
    },
    { once: true }
  );
}
