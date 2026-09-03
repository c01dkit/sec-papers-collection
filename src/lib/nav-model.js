// 核心内容 6 项，全部平铺 —— 一次点击直达，不需要下拉。
export const CORE_NAV = [
  { slug: 'search', key: 'menu.search' },
  { slug: 'topics', key: 'menu.topics' },
  { slug: 'trends', key: 'menu.trends' },
  { slug: 'abstract', key: 'menu.abstract' },
  { slug: 'timeline', key: 'menu.submissionTimeline' },
  { slug: 'awards', key: 'menu.awards' },
];

// 非核心内容收进右侧「其他 ▾」，与语言、明暗按钮同区。
export const MISC_NAV = [
  { slug: 'sites', key: 'menu.moreSites' },
  { slug: 'about', key: 'menu.about' },
  { slug: 'settings', key: 'menu.settings' },
];

export function isActive(pathname, lang, slug) {
  const norm = String(pathname || '').replace(/\/+$/, '');
  return norm === `/${lang}/${slug}`;
}
