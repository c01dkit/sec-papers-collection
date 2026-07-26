import { getSettings, patchSettings, getFavorites, clearFavorites, isPersistent } from './settings-store.js';
import { applyTheme } from './theme.js';
import { ACCENTS } from '@/lib/settings-schema.js';

const fmt = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

let i18n = {};
let savedTimer;

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

  let settings = await getSettings();
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

  // ── 强调色 ──────────────────────────────────────────
  const paintAccent = () => {
    for (const btn of document.querySelectorAll('[data-accent-pick]')) {
      btn.setAttribute('aria-checked', btn.dataset.accentPick === settings.theme ? 'true' : 'false');
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
      btn.setAttribute('aria-pressed', settings[btn.dataset.toggle] ? 'true' : 'false');
    }
  };
  for (const btn of document.querySelectorAll('[data-toggle]')) {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.toggle;
      const next = !settings[key];
      // 深色开关要立刻作用到页面，不能等下次刷新
      if (key === 'darkTheme') {
        applyTheme(next ? 'dark' : 'light', document.documentElement.dataset.accent);
        await save({ darkTheme: next, rememberDarkMode: true });
      } else {
        await save({ [key]: next });
      }
      paintToggles();
    });
  }
  paintToggles();

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
