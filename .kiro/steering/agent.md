# 通用开发经验

## 在 node_modules / 被 gitignore 的目录中查找符号

- `grep_search` 默认遵守 `.gitignore`，`node_modules` 不会被扫描，"无匹配"不代表"不存在"。
- 搜被忽略目录：`grep_search`/`file_search` 传 `includeIgnoredFiles`，或用 `Get-ChildItem -Recurse` + `Select-String`。
- 判断依赖是否导出某能力，优先看 `package.json` 的 `exports` 字段与 `.d.ts` 类型定义，而非全文搜索。
