/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// 阿里云验证码2.0 与极验 gt4 通过动态脚本挂载到 window 的全局方法
interface Window {
  AliyunCaptchaConfig?: { region: string; prefix: string }
  initAliyunCaptcha?: (options: Record<string, unknown>) => void
  initGeetest4?: (
    config: { captchaId: string; product: string },
    callback: (captcha: GeetestInstance) => void,
  ) => void
}

interface GeetestInstance {
  showBox: () => void
  onSuccess: (handler: () => void) => void
  onError: (handler: () => void) => void
  onClose: (handler: () => void) => void
  getValidate: () => Record<string, string>
  reset: () => void
}
