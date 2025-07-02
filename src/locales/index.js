import { createI18n } from 'vue-i18n'

// 导入语言文件
import en from './en.json'
import zh from './zh.json'

// 获取浏览器语言设置
function getDefaultLocale() {
  const locale = localStorage.getItem('locale')
  if (locale) {
    return locale
  }
  
  const browserLocale = navigator.language || navigator.userLanguage
  if (browserLocale.startsWith('zh')) {
    return 'zh'
  }
  return 'en'
}

// 创建事件发射器用于语言切换通知
export const languageEmitter = {
  callbacks: [],
  emit(locale) {
    this.callbacks.forEach(callback => callback(locale));
  },
  on(callback) {
    this.callbacks.push(callback);
  },
  off(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
};

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getDefaultLocale(), // 设置默认语言
  fallbackLocale: 'en', // 设置回退语言
  messages: {
    en,
    zh
  }
})

export default i18n
