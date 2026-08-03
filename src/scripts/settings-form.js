import { getSettings, patchSettings, getFavorites, clearFavorites, isPersistent } from './settings-store.js';
import { applyTheme } from './theme.js';
import { ACCENTS, FONT_SIZES, PAGE_WIDTHS } from '@/lib/settings-schema.js';

const fmt = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

let i18n = {};
let savedTimer;

// settings 与 i18n 一样放模块级，不放 initSettingsForm 的局部。
// 原因是下面那个 spc:settings-change 监听器只注册一次（挂在 window 上，
// 没有随 DOM 一起消失的宿主可依附），而 initSettingsForm 每次软导航都会重跑；
// 若 settings 是局部变量，那个一次性注册的监听器会永久闭包住**第一次**访问的
// 那个绑定，之后一直照着过期值重画。initSettingsForm 每次都会重新赋值它，
// 所以模块级在这里不构成软导航陈旧状态（那条教训见 paper-table.js:5-8）。
let settings = null;
let settingsListenerBound = false;

// 深色开关与强调色色块的**真相是 DOM**（<html data-theme> / <html data-accent>），
// 不是库里的字段。两个理由：
//   1. 顶栏的 ◑/◈ 直接改 DOM，走的是 theme.js，不经过本页任何代码；
//   2. rememberDarkMode 关掉时，预绘制脚本按系统偏好渲染，库里的 darkTheme
//      可能与页面实际相反 —— 这种情况下连首次加载显示的都是错的。
// 读 DOM 让这两项永远与用户眼睛看到的一致。其余三个 remember* 开关不受 DOM
// 影响，仍然读 settings。
const isDark = () => document.documentElement.dataset.theme === 'dark';

// msg 省略时显示通用的「已自动保存」；clearFavorites 之后传 i18n.cleared，
// 让一次破坏性操作得到一句专门的确认，而不是和其它字段改动共用同一句提示。
function flashSaved(msg) {
  const el = document.getElementById('stSaved');
  if (!el) return;
  el.textContent = msg || i18n.autoSaved;
  el.hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { el.hidden = true; }, 1600);
}

function renderKeywords(list, keywords, onRemove) {
  list.replaceChildren();
  for (const word of keywords) {
    const chip = document.createElement('span');
    chip.className = 'kw';
    chip.append(document.createTextNode(word));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.setAttribute('aria-label', fmt(i18n.remove, { __W__: word }));
    btn.addEventListener('click', () => onRemove(word));
    chip.appendChild(btn);
    list.appendChild(chip);
  }
}

export async function initSettingsForm() {
  const warn = document.getElementById('stWarn');
  const kwList = document.getElementById('kwList');
  if (!kwList || kwList.dataset.bound) return;
  kwList.dataset.bound = '1';

  i18n = JSON.parse(document.getElementById('stI18n').textContent);

  settings = await getSettings();
  if (!isPersistent() && warn) warn.hidden = false;

  // 只在打开页面那一刻查一次 isPersistent() 是不够的：hydrateAndApply() 在
  // theme.js 里是 fire-and-forget，它自己的落盘写入这时候大概率还没跑完/
  // 还没失败，于是上面那次检查几乎总是看到「尚无失败证据」的乐观初值，
  // 提示条不会出现 —— 之后哪怕用户点多少次开关、每次都写不进去，也没有代码
  // 再看第二眼。实测：配额耗尽场景下，即使连续两次用户操作都写入失败，
  // 提示条在整个页面生命周期里一次都不会显示。
  // 所以每次真正发生写操作之后都要重新核对一次：写失败就现在挂出来，
  // 写又恢复正常了（isPersistent() 收回 true）也要把提示收回去，
  // 不能让它在配额恢复之后继续挂着说谎。
  const syncWarn = () => {
    if (warn) warn.hidden = isPersistent();
  };

  const save = async (patch) => {
    settings = await patchSettings(patch);
    syncWarn();
    flashSaved();
    return settings;
  };

  // ── 字号 ────────────────────────────────────────────
  // 与强调色同理，真相是 DOM（<html data-fontsize>，预绘制脚本按镜像写好）。
  const paintFontSize = () => {
    const cur = document.documentElement.dataset.fontsize || 'large';
    for (const btn of document.querySelectorAll('[data-fontsize-pick]')) {
      btn.setAttribute('aria-checked', btn.dataset.fontsizePick === cur ? 'true' : 'false');
    }
  };
  for (const btn of document.querySelectorAll('[data-fontsize-pick]')) {
    btn.addEventListener('click', async () => {
      const size = btn.dataset.fontsizePick;
      if (!FONT_SIZES.includes(size)) return;
      document.documentElement.dataset.fontsize = size;
      await save({ fontSize: size });
      paintFontSize();
    });
  }
  paintFontSize();

  // ── 版心宽度 ────────────────────────────────────────
  const paintPageWidth = () => {
    const cur = document.documentElement.dataset.pagewidth || 'medium';
    for (const btn of document.querySelectorAll('[data-pagewidth-pick]')) {
      btn.setAttribute('aria-checked', btn.dataset.pagewidthPick === cur ? 'true' : 'false');
    }
  };
  for (const btn of document.querySelectorAll('[data-pagewidth-pick]')) {
    btn.addEventListener('click', async () => {
      const width = btn.dataset.pagewidthPick;
      if (!PAGE_WIDTHS.includes(width)) return;
      document.documentElement.dataset.pagewidth = width;
      await save({ pageWidth: width });
      paintPageWidth();
    });
  }
  paintPageWidth();

  // ── 强调色 ──────────────────────────────────────────
  const paintAccent = () => {
    const cur = document.documentElement.dataset.accent;
    for (const btn of document.querySelectorAll('[data-accent-pick]')) {
      btn.setAttribute('aria-checked', btn.dataset.accentPick === cur ? 'true' : 'false');
    }
  };
  for (const btn of document.querySelectorAll('[data-accent-pick]')) {
    btn.addEventListener('click', async () => {
      const accent = btn.dataset.accentPick;
      if (!ACCENTS.includes(accent)) return;
      applyTheme(document.documentElement.dataset.theme, accent);
      await save({ theme: accent, rememberTheme: true });
      paintAccent();
    });
  }
  paintAccent();

  // ── 开关 ────────────────────────────────────────────
  const paintToggles = () => {
    for (const btn of document.querySelectorAll('[data-toggle]')) {
      const key = btn.dataset.toggle;
      const on = key === 'darkTheme' ? isDark() : !!settings[key];
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  };
  for (const btn of document.querySelectorAll('[data-toggle]')) {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.toggle;
      // 深色开关要立刻作用到页面，不能等下次刷新
      if (key === 'darkTheme') {
        // next 同样从 DOM 推。用 !settings.darkTheme 的话，顶栏切过之后
        // settings 还是旧值，取反会算出「切到当前已经是的那个主题」——
        // 实测就是点了没反应（dark → dark），而开关自己翻了过去。
        const next = !isDark();
        applyTheme(next ? 'dark' : 'light', document.documentElement.dataset.accent);
        await save({ darkTheme: next, rememberDarkMode: true });
      } else {
        await save({ [key]: !settings[key] });
      }
      paintToggles();
    });
  }
  paintToggles();

  // 顶栏的 ◑/◈ 改完并落盘之后会广播权威结果（见 theme.js 的 persist）。
  // 收到就整份换掉并重画 —— 这一步管的是 remember* 那三个开关：
  // theme.js 会把 rememberDarkMode / rememberTheme 一并写成 true，
  // 而它们无法从 DOM 推出来。深色与强调色两项本来就读 DOM，不依赖这个事件。
  if (!settingsListenerBound) {
    settingsListenerBound = true;
    window.addEventListener('spc:settings-change', (e) => {
      if (!document.getElementById('kwList')) return;   // 已经不在设置页了
      if (e.detail) settings = e.detail;
      paintFontSize();
      paintPageWidth();
      paintAccent();
      paintToggles();
    });
  }

  // ── 关键词 ──────────────────────────────────────────
  const input = document.getElementById('kwInput');
  const addBtn = document.getElementById('kwAdd');

  const removeKeyword = async (word) => {
    await save({ keywords: settings.keywords.filter((k) => k !== word) });
    renderKeywords(kwList, settings.keywords, removeKeyword);
  };

  const addKeyword = async () => {
    const word = input.value.trim();
    if (!word) return;
    // 去重时忽略大小写：高亮本身就是大小写不敏感的，存两份没意义
    if (settings.keywords.some((k) => k.toLowerCase() === word.toLowerCase())) {
      input.value = '';
      return;
    }
    await save({ keywords: [...settings.keywords, word] });
    input.value = '';
    renderKeywords(kwList, settings.keywords, removeKeyword);
  };

  addBtn.addEventListener('click', addKeyword);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  });
  renderKeywords(kwList, settings.keywords, removeKeyword);

  // ── 收藏 ────────────────────────────────────────────
  const favDesc = document.getElementById('favDesc');
  const favClear = document.getElementById('favClear');
  const paintFav = async () => {
    const favs = await getFavorites();
    favDesc.textContent = fmt(i18n.favDesc, { __N__: String(favs.length) });
    favClear.disabled = favs.length === 0;
  };
  favClear.addEventListener('click', async () => {
    if (!window.confirm(i18n.confirm)) return;
    await clearFavorites();
    // clearFavorites 是写操作，不走上面的 save()，同样要在写完之后核对一次
    syncWarn();
    await paintFav();
    flashSaved(i18n.cleared);
  });
  await paintFav();
}
