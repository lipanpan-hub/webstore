# 通用开发经验

## 在 node_modules / 被 gitignore 的目录中查找符号

- `grep_search` 默认遵守 `.gitignore`，`node_modules` 不会被扫描，"无匹配"不代表"不存在"。
- 搜被忽略目录：`grep_search`/`file_search` 传 `includeIgnoredFiles`，或用 `Get-ChildItem -Recurse` + `Select-String`。
- 判断依赖是否导出某能力，优先看 `package.json` 的 `exports` 字段与 `.d.ts` 类型定义，而非全文搜索。

## Node ESM 下导入 CommonJS 包的默认导出

- 项目为 `"type": "module"` + `module: ESNext`，编译后是原生 ESM，`import X from 'cjs-pkg'` 中 `X` 等于该包的 `module.exports` 整体对象，**Node 不识别 `__esModule`**。
- 若 CJS 包用 `exports.default = Class` 导出，则真正的类在 `X.default`；有的包会多层包裹（`module.exports.default.default`），需逐层解包。
- 排查手段：写一次性 probe 脚本打印 `Object.keys(mod)`、`typeof mod.default`、`typeof mod.default.default`，据实际运行时结构取构造器，别只信 `.d.ts`（类型层与运行时层可能不一致）。
- 稳健写法：循环向下取 `.default` 直到拿到 `function`；类型仍用默认导入做 `typeof` 保留类型提示。
- 命名导出（如 `Xxx.RequestModel`）用命名空间 `import * as ns` 后 `ns.Xxx` 访问最稳（运行时枚举属性，不依赖 cjs-lexer 静态分析）。
- 引用「间接依赖」（transitive dep）必须在自己包的 `package.json` 显式声明，否则 pnpm 严格 node_modules 下无法解析。
