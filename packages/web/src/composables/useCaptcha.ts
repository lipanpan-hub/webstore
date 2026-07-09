import { ref, computed } from 'vue'
import type { CaptchaConfigView } from '@webstore/shared'
import { API_BASE } from '@/config'

const ALIYUN_SDK = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'
const GEETEST_SDK = 'https://static.geetest.com/v4/gt4.js'

// 外观模式：封装两家验证码服务商的脚本加载、控件初始化与令牌获取，购买表单只依赖下方简洁接口
export function useCaptcha() {
  const config = ref<CaptchaConfigView | null>(null)
  // 验证码控件产出的校验令牌，随下单请求提交给服务端二次核验
  const token = ref<Record<string, string> | null>(null)
  let geetest: GeetestInstance | null = null

  // 是否需要人机验证：仅当后端启用了验证码服务商时为真
  const required = computed(() => config.value !== null)
  // 是否已通过验证：无需验证或已获取令牌
  const passed = computed(() => !required.value || token.value !== null)

  async function load(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/captcha`)
      const body = await res.json()
      config.value = body.code === 200 ? body.data : null
    } catch {
      config.value = null
    }
  }

  // 在预留的容器与按钮上初始化验证码控件，需在对应 DOM 就绪后调用
  async function mount(elementId: string, buttonId: string): Promise<void> {
    if (!config.value) return
    if (config.value.provider === 'aliyun') await mountAliyun(config.value.params, elementId, buttonId)
    else await mountGeetest(config.value.params)
  }

  //#region 阿里云验证码2.0
  async function mountAliyun(
    params: Record<string, string>,
    elementId: string,
    buttonId: string,
  ): Promise<void> {
    window.AliyunCaptchaConfig = { region: params.region || 'cn', prefix: params.prefix }
    await loadScript(ALIYUN_SDK)
    window.initAliyunCaptcha?.({
      SceneId: params.sceneId,
      mode: 'popup',
      element: `#${elementId}`,
      button: `#${buttonId}`,
      // 校验通过即捕获参数供下单时提交，令牌真伪由服务端二次核验
      captchaVerifyCallback: async (captchaVerifyParam: string) => {
        token.value = { captchaVerifyParam }
        return { captchaResult: true }
      },
      onBizResultCallback: () => {},
      getInstance: () => {},
      language: 'cn',
    })
  }
  //#endregion

  //#region 极验 gt4
  async function mountGeetest(params: Record<string, string>): Promise<void> {
    await loadScript(GEETEST_SDK)
    window.initGeetest4?.({ captchaId: params.captchaId, product: 'bind' }, (instance) => {
      geetest = instance
      instance.onSuccess(() => {
        token.value = instance.getValidate()
      })
    })
  }
  //#endregion

  // 唤起验证码：极验需手动弹出，阿里云由绑定按钮自动触发
  function trigger(): void {
    if (config.value?.provider === 'geetest') geetest?.showBox()
  }

  // 重置令牌，供校验失败后重新验证
  function reset(): void {
    token.value = null
    geetest?.reset()
  }

  return { config, token, required, passed, load, mount, trigger, reset }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`加载验证码脚本失败: ${src}`))
    document.head.appendChild(script)
  })
}
