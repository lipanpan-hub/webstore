# webstore

基于 NestJS + Vue3 + MongoDB 的自动发卡站，前后端分离。核心链路：**游客下单 → 支付回调 → 自动发货（卡密）→ 订单查询**。

商品、分类、卡密库存、支付方式、验证码配置等站长操作全部通过 CLI 完成，站点本身不含后台管理界面。

## 技术栈

- 后端：NestJS 11（ESM）、Mongoose 9、nest-commander（CLI）
- 前端：Vue 3.5 + Vue Router 4 + Vite 6
- 共享层：`@webstore/shared` 集中定义前后端接口契约类型
- 包管理：pnpm workspace（monorepo）

## 目录结构

```
webstore/
├── package.json            # 根脚本入口，命令经 pnpm --filter 转发
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── packages/
    ├── server/             # NestJS 后端 + CLI
    ├── web/                # Vue 前端
    └── shared/             # 共享类型
```

后端按领域分模块：`catalog`（首页目录）、`category`、`product`、`card`（卡密库存）、`order`、`payment`、`captcha`，`commands/` 存放 CLI 命令，与 HTTP 层共享同一批 Service。

## 快速开始

前置：Node（支持 ESM 与 `--loader` 的版本）、pnpm、可用的 MongoDB。

```bash
pnpm install
cp packages/server/.env.example packages/server/.env   # 按需修改
pnpm dev            # 同时启动后端(3000) 与前端(5174)
```

单独启动：`pnpm dev:server` / `pnpm dev:web`。

生产构建与运行：

```bash
pnpm build:all      # shared → server → web，顺序不可调换
node packages/server/dist/main.js
```

## 环境变量

后端 `packages/server/.env`：

- `MONGO_URI` MongoDB 连接地址
- `PAYMENT_NOTIFY_BASE_URL` 支付网关回调本服务的**公网**地址，本地调试需配隧道地址
- `WEB_BASE_URL` 前端站点地址，跳转类支付付款后同步跳回
- `LOG_LEVEL` 日志等级，逗号分隔，如 `log,error,warn`

前端 `packages/web/.env`：

- `VITE_API_BASE` 后端 API 地址

## 站长 CLI

开发态直接跑 TS，生产态跑构建产物：

```bash
pnpm cli <命令>          # ts-node，开发用
pnpm cli:prod <命令>     # dist 产物，部署用
```

命令组与子命令（缺少参数时会进入交互式询问，商品/分类支持模糊搜索选择）：

- `category` — `add` 添加分类、`list` 列出分类
- `product` — `add` 添加商品（默认下架）、`shelf` 上下架、`detail` 编辑详情、`list` 列表
- `card` — `add` 导入卡密、`stock` 查库存、`del` 删单条、`clear` 批量清理
- `payment` — `add` / `update` / `remove` / `list` 支付方式及服务商配置
- `captcha` — `add` / `update` / `remove` / `list` 验证码配置

典型初始化顺序：

```bash
pnpm cli category add
pnpm cli product add
pnpm cli card add
pnpm cli product shelf
pnpm cli payment add
```

## HTTP API

所有响应统一为 `ApiResponse<T>`：`{ code, message, data }`。

- `GET /catalog` — 首页目录，分类下挂载上架商品（含库存）
- `GET /products` — 上架商品列表；`GET /products/:id` — 商品详情
- `GET /cards/stock/:productId` — 指定商品库存数
- `GET /payments` — 启用中的支付方式（公开字段，不含密钥）
- `GET /captcha` — 启用中的验证码公开配置，未启用返回 `data: null`
- `POST /orders` — 下单：校验验证码 → 锁库存 → 发起支付，返回 `payMode`（`qrcode` / `redirect`）与 `payPayload`、`accessToken`
- `GET /orders/:id/status?token=` — 轮询支付状态，需带下单返回的 `accessToken`，已支付时附带卡密
- `POST /orders/query` — 游客凭邮箱 + 订单密码查询历史订单及卡密
- `ALL /orders/notify/:paymentId` — 支付网关回调入口，路径带支付方式 ID 以选择对应网关解析

订单确认采取「回调优先、轮询兜底」：回调解析出订单号后主动向网关查询真实状态，确认成功才发货；同时有定时清扫任务处理超时订单并释放锁定库存。

## 支付与验证码扩展

支付与验证码采用同构设计：**注册表 + 策略 + 工厂**。

- 支付：`payment.provider.ts` 声明各服务商所需字段，`gateway/` 下为各网关实现，`payment-gateway.factory.ts` 分发。已内置支付宝、微信支付、Stripe、Creem、易支付（其中 Creem 使用官方 SDK 并支持 webhook 验签）。
- 验证码：`captcha.provider.ts` 声明字段（`isPublic` 标记可下发前端的参数），`verifier/` 下为各实现。已内置阿里云验证码 2.0、极验 4 代。验证码未启用或服务商接口异常时放行下单，仅明确返回校验失败才拦截。

新增一个服务商的步骤：在注册表补字段定义 → 新建实现类 → 工厂加分支 → 在 `@webstore/shared` 的联合类型里加上新值。

配置全部存在 MongoDB（`payment_methods` / `captcha_settings`），通过 CLI 维护，不写进代码或环境变量。

## 约定

- 全仓库使用 LF 行尾
- 后端文件按职责命名：`*.module.ts` / `*.controller.ts` / `*.service.ts` / `*.schema.ts`
- 前端页面组件放 `views/`，路由懒加载；单文件组件用 PascalCase
- 修改 `shared` 类型后，全量构建须先 `pnpm build:shared`
