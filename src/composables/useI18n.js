import { watch } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * 使用国际化的页面标题
 * @param {string} titleKey - 翻译键
 * @param {string} suffix - 后缀（可选）
 */
export function usePageTitle(titleKey, suffix = ' - Sec Papers') {
  const { t, locale } = useI18n();
  
  const updateTitle = () => {
    document.title = t(titleKey) + suffix;
  };
  
  // 初始设置标题
  updateTitle();
  
  // 监听语言变化
  watch(locale, updateTitle);
  
  return {
    updateTitle
  };
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @param {string} locale - 语言代码
 */
export function formatDate(date, locale = 'en') {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', options);
}

/**
 * 获取当前语言的 RTL 方向
 * @param {string} locale - 语言代码
 */
export function getTextDirection(locale) {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(locale) ? 'rtl' : 'ltr';
}
