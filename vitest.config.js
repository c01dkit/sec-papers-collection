import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node', // 需要 DOM 的文件用文件顶部 // @vitest-environment jsdom
    include: ['tests/**/*.test.js'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
