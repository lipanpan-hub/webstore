

- 后端项目中已经添加了 creem sdk 所以creem相关代码 能用sdk完成的优先使用sdk 


- 验证码模块沿用支付模块同构设计：注册表(captcha.provider.ts 定义各服务商字段) + 策略(verifier 接口/实现) + 工厂(verifier factory)；配置存 Mongo(captcha_settings)，站长用 `cli captcha add|update|remove|list` 管理，前端 `GET /captcha` 只拿公开参数(isPublic 字段)。
- 下单在 OrderService.createOrder 开头调用 CaptchaService.verify(input.captcha)，未启用服务商时放行；服务商接口异常一律放行(可用性优先)，仅明确 false 才拦截。
- 阿里云验证码 SDK `@alicloud/captcha20230305@1.1.4` 依赖 `@alicloud/openapi-core`(Config 来源)，已在 server 显式声明该依赖；Client 构造器运行时在 `module.exports.default.default`，见 agent.md 互操作说明。
- 新增服务商步骤：CAPTCHA_PROVIDERS 加字段定义 → 新建 verifier 实现 → factory 加分支 → shared 的 CaptchaProvider 联合类型加值。
