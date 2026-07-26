export const CDN_DATA_BASE = 'https://cdn.c01dkit.com/sec-papers';

/**
 * 运行时数据基址 —— 全站唯一的 DEV/PROD 判断点。
 * DEV 下的 /data/** 由 astro.config.mjs 的开发中间件映射到 src/assets/data/**。
 * 旧代码里 Search.vue 用 import.meta.env.PROD、ViewAbstract.vue 用 process.env.NODE_ENV
 * 且硬编码了 /src/assets/... 路径，两处分叉制造过多次「开发环境加载失败」的 bug。
 */
export const DATA_BASE = import.meta.env.DEV ? '/data' : CDN_DATA_BASE;
