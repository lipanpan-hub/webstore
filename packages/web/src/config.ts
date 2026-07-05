// 全局运行时配置，集中读取 Vite 环境变量，缺失时回退默认值
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'
