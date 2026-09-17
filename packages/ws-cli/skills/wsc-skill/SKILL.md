---
name: wsc-skill
description: 通过 wsc（@lppx/ws-cli）管理 webstore 商城后台，覆盖分类、商品、卡密库存、订单、支付方式、验证码配置与 CLI 配置档案。当用户要求用 wsc 或 ws-cli 查询订单、上下架商品、导入卡密、增删改后台资源或排查 wsc 调用问题时使用。不要用于商城前台下单购物。
---

# wsc 商城后台 CLI

`wsc` 是 webstore 的后台管理命令行（基于 oclif，npm 包名 `@lppx/ws-cli`），通过 HMAC-SHA256 签名的 HTTP 请求调用 webstore 服务端的 `/admin/*` 接口。所有交互与输出均为中文。

## 第 0 步：确认配置档案

除 config 命令外，所有命令都依赖当前配置档案中的 `baseUrl`、`keyId`、`secret`。

- 首次使用须由用户在**真实终端**执行 `wsc config set`（纯交互式，录入服务端地址与 API Key）。
- 查看配置文件路径与原始内容：`wsc config show`（别名 `wsc cf ls`、`wsc cf show`）。
- 配置文件 `config.yml` 的位置：
  - Windows —— `%LOCALAPPDATA%\ws-cli\config.yml`
  - macOS —— `~/Library/Preferences/ws-cli/config.yml`
  - Linux —— `~/.config/ws-cli/config.yml`
- 档案未配置时资源命令直接报错：`当前档案未配置 baseUrl、keyId 或 secret, 请先执行 wsc config set`。

## Agent 调用铁律

1. **非交互终端必须显式传全所有参数 flag**。任何缺参命令都会进入 inquirer 交互提示；在非 TTY 环境中提示会立即取消，输出 `已取消操作` 并以退出码 1 结束（不会挂起等待）。
2. **以下命令无法非交互执行，不要在脚本中调用**，应让用户在真实终端操作：
   - `wsc config set`、`wsc config edit`（只能交互/TUI 编辑）
   - `wsc payment add`（服务商选择与密钥录入无对应 flag）
   - `wsc captcha add`（同上）
   - `wsc payment update` / `wsc captcha update` 若要修改服务商的 config 字段，也只能走交互模式；用 flag 只能改名称、排序、启用状态。
3. **输出是中文纯文本，不是 JSON**（唯一例外 `wsc version --json`）。按行解析，资源 ID 通常位于每行开头。
4. **每次调用 stdout 第一行固定是配置文件路径**（init 钩子打印，例如 `C:\Users\...\ws-cli\config.yml`）；首次创建配置时还会多一行 `已创建默认配置文件: ...`。解析业务输出时跳过这些行。
5. 失败时退出码非 0，错误行为 `Error: ...`。常见错误：
   - `无法连接服务端 <url>: fetch failed` —— 服务端未启动或 baseUrl 错误。
   - `[401] ...` / `[403] ...` —— keyId/secret 错误或验签失败。
   - `[4xx] <服务端中文原因>` —— 业务校验失败，按 message 处理。
6. 含中文、空格、逗号的值必须加双引号，如 `-n "账号类"`、`-s "密1,密2,密3"`。PowerShell 中不要用 `&` 连接多条命令。
7. 不确定命令签名时先执行 `wsc <topic> <cmd> --help`，以本机安装版本的帮助为准。

## 命令参考

约定：`<id>` 等占位符替换为实际 ID；布尔值只接受小写 `true` / `false`。

### 配置（config）

- `wsc config show` —— 打印配置文件路径与完整 YAML 原文（别名 `cf ls`、`cf show`）。
- `wsc config set` —— 交互式设置当前档案的 baseUrl / keyId / secret（别名 `cf set`），仅终端可用。
- `wsc config edit` —— 内置 TUI 编辑配置文件；`-e` 改为选择系统外部编辑器。

### 分类（category）

- `wsc category list` —— 列出全部分类。输出行格式：`<id>  [sort=<权重>]  <名称>`
- `wsc category add -n <名称> [-s <排序权重>]` —— 新增分类。输出：`已添加分类: <id>  <名称>`

### 商品（product）

- `wsc product list` —— 列出全部商品。输出行：`<id>  <名称>  ￥<价格>  [on|off]  cat=<categoryId>`
- `wsc product add -c <分类ID> -n <名称> -p <价格> [-d <描述>]` —— 新增商品，**创建后默认下架**（off）。
- `wsc product shelf -i <商品ID> -s <on|off>` —— 上架 / 下架，`-s` 只接受 `on` 或 `off`。
- `wsc product detail -i <商品ID> -d <详情内容>` —— 设置商品详情；传 `-d ""` 清空详情。

### 卡密库存（card）

- `wsc card stock -p <商品ID>` —— 查询可售库存数量。输出：`商品 <pid> 当前库存: <数量>`
- `wsc card list -p <商品ID>` —— 列出某商品全部卡密。输出行：`<id>  <密文>  [unsold|locked|sold]`
  - 状态含义：unsold 可售 / locked 下单锁定中 / sold 已售出。
- `wsc card add -p <商品ID> -s <密1,密2,...>` —— 批量导入卡密，逗号分隔，自动 trim 并忽略空段。
- `wsc card del -i <卡密ID>` —— 删除单条卡密。
- `wsc card clear -p <商品ID> [-s <unsold|sold>]` —— 批量删除；省略 `-s` 删除该商品全部卡密。

### 订单（order）

- `wsc order list` —— 列出全部订单，每个订单输出三行：
  - 第 1 行：`<orderId>  [<待支付|已支付|已失效>]  <商品名> x<数量>  ￥<总额>`
  - 第 2 行：`    邮箱: <email>    支付方式: <provider>`
  - 第 3 行：`    创建: <时间>    支付: <时间或 ->`
- `wsc order get -i <订单ID>` —— 查询单条订单详情，`-i` 必填。
- 注意订单标识字段是 `orderId`（业务订单号），不是内部 `_id`。

### 支付方式（payment）

- `wsc payment list` —— 列出全部支付方式；每个方式输出标题行加若干配置字段行，敏感字段自动打码。
- `wsc payment add [-n <名称>] [-s <排序权重>]` —— 服务商与配置仍需交互录入，**agent 不要调用**。
- `wsc payment update -i <支付方式ID> [-n <新名称>] [-s <权重>] [-e <true|false>]` —— 至少带一个修改项 flag 才不会进入交互。ID 不存在时报 `支付方式不存在: <id>`。
- `wsc payment remove -i <支付方式ID>` —— 删除支付方式。
- 服务商 provider 取值：alipay / wechat / stripe / creem / epay（仅在交互列表中选择）。

### 验证码配置（captcha）

- `wsc captcha list` —— 列出全部验证码配置，输出风格同 payment list，敏感字段打码。
- `wsc captcha add [-s <排序权重>]` —— 服务商与配置需交互录入，**agent 不要调用**。
- `wsc captcha update -i <配置ID> [-s <权重>] [-e <true|false>]` —— 排序权重数值小者优先。
- `wsc captcha remove -i <配置ID>` —— 删除验证码配置。
- 服务商 provider 取值：aliyun / geetest（仅在交互列表中选择）。

### 其他

- `wsc version [--json] [--verbose]` —— 版本信息。
- `wsc help [COMMAND]` —— 查看帮助。
- `wsc autocomplete [bash|zsh|powershell]` —— 安装 shell 补全。

## 推荐工作流

所有 ID 一律先查后用，禁止臆造。

1. **新商品上架**：`category list`（没有就 `category add`）→ `product add -c <分类ID> -n <名称> -p <价格>` → `card add -p <商品ID> -s "..."` 导入库存 → `product shelf -i <商品ID> -s on`。
2. **补货**：`product list` 找商品 → `card stock -p <商品ID>` 确认库存 → `card add -p <商品ID> -s "..."`。
3. **订单客服**：`order list` 找订单 → `order get -i <orderId>` 看详情。
4. **停用 / 删除支付方式**：`payment list` 拿 ID → `payment update -i <ID> -e false`（停用）或 `payment remove -i <ID>`（删除）。
5. **删除某商品历史卡密**：`card list -p <商品ID>` 确认范围 → `card clear -p <商品ID> -s sold`（仅删已售）或不带 `-s`（全删）。

## 排障

- 需要详细调试信息时，设置环境变量 `SPIDER_LOG_LEVEL=debug` 后重跑命令（如 PowerShell `$env:SPIDER_LOG_LEVEL='debug'`）。
- 日志文件：`<配置目录>/logs/app-*.log`，按天滚动，默认保留 14 天。
- 控制台 / 文件 / 数据库三类日志的开关与级别在 `<配置目录>/logger.json`（首次运行自动生成）。
- 网络类错误先确认 webstore 服务端进程已启动且 baseUrl 指向正确地址，再检查 keyId / secret。
