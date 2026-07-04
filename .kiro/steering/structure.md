# 项目结构

## 顶层布局

```
webstore/
├── package.json          # 根脚本入口（dev/build 命令通过 pnpm --filter 转发）
├── pnpm-workspace.yaml   # workspace 定义
├── tsconfig.base.json    # 公共 TS 编译配置，各包继承
└── packages/
    ├── server/           # NestJS 后端
    ├── web/              # Vue 前端
    └── shared/           # 共享类型库
```

## packages/server（后端）

```
server/
├── nest-cli.json         # NestJS CLI 配置，sourceRoot 为 src
├── tsconfig.json
└── src/
    ├── main.ts           # 应用入口，创建 Nest 实例、启用 CORS、监听 3000
    ├── app.module.ts     # 根模块，注册 controllers 与 providers
    ├── app.controller.ts # 控制器，处理路由
    └── app.service.ts    # 业务逻辑
```

- 遵循 NestJS 分层：Module 组织依赖，Controller 处理请求，Service 承载业务逻辑
- 通过构造函数注入依赖（如 `constructor(private readonly appService: AppService)`）
- 新增功能建议按领域拆分为独立模块（module/controller/service 一组）

## packages/web（前端）

```
web/
├── index.html            # HTML 入口
├── vite.config.ts        # Vite 配置，定义 @ 别名
├── tsconfig.json
└── src/
    ├── main.ts           # 应用入口，挂载 Vue 与路由
    ├── App.vue           # 根组件
    ├── env.d.ts          # 类型声明
    ├── router/index.ts   # 路由配置，页面组件懒加载
    └── views/            # 页面级组件
```

- 页面组件放在 `views/`，路由采用动态 `import()` 懒加载
- 新增可复用组件建议放在 `src/components/`（尚未创建）

## packages/shared（共享层）

```
shared/
├── tsconfig.json
└── src/index.ts          # 统一导出前后端共享类型
```

- 所有跨端复用的接口、类型集中在此，通过 `@webstore/shared` 引用
- 修改共享类型后，全量构建需先执行 `build:shared`

## 命名与组织约定

- 包名统一 `@webstore/{name}` 作用域
- 后端文件按职责命名：`*.module.ts` / `*.controller.ts` / `*.service.ts`
- 前端单文件组件使用 PascalCase（如 `Home.vue`）
