// 策略模式：抽象验证码校验器，屏蔽各服务商差异，新增服务商只需实现本接口
export interface CaptchaVerifier {
  // 校验前端提交的验证码参数，通过返回 true。可用性优先：网关异常时应放行（返回 true）
  verify(token: Record<string, string>): Promise<boolean>
}
