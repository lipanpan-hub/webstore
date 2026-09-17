@lppx/ws-cli
=================

a cli for webstore


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@lppx/ws-cli.svg)](https://npmjs.org/package/@lppx/ws-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@lppx/ws-cli.svg)](https://npmjs.org/package/@lppx/ws-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @lppx/ws-cli
$ wsc COMMAND
running command...
$ wsc (--version)
@lppx/ws-cli/0.1.1 win32-x64 node-v24.14.1
$ wsc --help [COMMAND]
USAGE
  $ wsc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`wsc autocomplete [SHELL]`](#wsc-autocomplete-shell)
* [`wsc captcha add`](#wsc-captcha-add)
* [`wsc captcha list`](#wsc-captcha-list)
* [`wsc captcha remove`](#wsc-captcha-remove)
* [`wsc captcha update`](#wsc-captcha-update)
* [`wsc card add`](#wsc-card-add)
* [`wsc card clear`](#wsc-card-clear)
* [`wsc card del`](#wsc-card-del)
* [`wsc card list`](#wsc-card-list)
* [`wsc card stock`](#wsc-card-stock)
* [`wsc category add`](#wsc-category-add)
* [`wsc category list`](#wsc-category-list)
* [`wsc cf edit`](#wsc-cf-edit)
* [`wsc cf ls`](#wsc-cf-ls)
* [`wsc cf set`](#wsc-cf-set)
* [`wsc cf show`](#wsc-cf-show)
* [`wsc config edit`](#wsc-config-edit)
* [`wsc config set`](#wsc-config-set)
* [`wsc config show`](#wsc-config-show)
* [`wsc help [COMMAND]`](#wsc-help-command)
* [`wsc order get`](#wsc-order-get)
* [`wsc order list`](#wsc-order-list)
* [`wsc payment add`](#wsc-payment-add)
* [`wsc payment list`](#wsc-payment-list)
* [`wsc payment remove`](#wsc-payment-remove)
* [`wsc payment update`](#wsc-payment-update)
* [`wsc product add`](#wsc-product-add)
* [`wsc product detail`](#wsc-product-detail)
* [`wsc product list`](#wsc-product-list)
* [`wsc product shelf`](#wsc-product-shelf)
* [`wsc version`](#wsc-version)

## `wsc autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ wsc autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ wsc autocomplete

  $ wsc autocomplete bash

  $ wsc autocomplete zsh

  $ wsc autocomplete powershell

  $ wsc autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v4.0.0/src/commands/autocomplete/index.ts)_

## `wsc captcha add`

添加验证码配置（选择服务商并录入参数）

```
USAGE
  $ wsc captcha add [-s <value>]

FLAGS
  -s, --sort=<value>  排序权重(多个启用时数值小者优先)

DESCRIPTION
  添加验证码配置（选择服务商并录入参数）

EXAMPLES
  $ wsc captcha add -s 1
```

_See code: [src/commands/captcha/add.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/captcha/add.ts)_

## `wsc captcha list`

列出所有验证码配置及参数

```
USAGE
  $ wsc captcha list

DESCRIPTION
  列出所有验证码配置及参数

EXAMPLES
  $ wsc captcha list
```

_See code: [src/commands/captcha/list.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/captcha/list.ts)_

## `wsc captcha remove`

删除验证码配置（缺参时交互选择）

```
USAGE
  $ wsc captcha remove [-i <value>]

FLAGS
  -i, --id=<value>  验证码配置 ID

DESCRIPTION
  删除验证码配置（缺参时交互选择）

EXAMPLES
  $ wsc captcha remove -i <captchaId>
```

_See code: [src/commands/captcha/remove.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/captcha/remove.ts)_

## `wsc captcha update`

更新验证码配置（缺参时交互询问）

```
USAGE
  $ wsc captcha update [-i <value>] [-s <value>] [-e <value>]

FLAGS
  -e, --enabled=<value>  是否启用 true|false
  -i, --id=<value>       验证码配置 ID
  -s, --sort=<value>     排序权重(多个启用时数值小者优先)

DESCRIPTION
  更新验证码配置（缺参时交互询问）

EXAMPLES
  $ wsc captcha update -i <captchaId> -e true

  $ wsc captcha update -i <captchaId> -s 2
```

_See code: [src/commands/captcha/update.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/captcha/update.ts)_

## `wsc card add`

为商品导入卡密库存（缺参时交互询问）

```
USAGE
  $ wsc card add [-p <value>] [-s <value>]

FLAGS
  -p, --product=<value>  商品 ID
  -s, --secrets=<value>  卡密, 逗号分隔

DESCRIPTION
  为商品导入卡密库存（缺参时交互询问）

EXAMPLES
  $ wsc card add -p <productId> -s "密1,密2,密3"
```

_See code: [src/commands/card/add.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/card/add.ts)_

## `wsc card clear`

批量删除某商品卡密（缺参时交互询问）

```
USAGE
  $ wsc card clear [-p <value>] [-s <value>]

FLAGS
  -p, --product=<value>  商品 ID
  -s, --status=<value>   删除范围: unsold | sold, 缺省全部

DESCRIPTION
  批量删除某商品卡密（缺参时交互询问）

EXAMPLES
  $ wsc card clear -p <productId> -s unsold
```

_See code: [src/commands/card/clear.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/card/clear.ts)_

## `wsc card del`

删除单条卡密（缺参时交互选择）

```
USAGE
  $ wsc card del [-i <value>]

FLAGS
  -i, --id=<value>  卡密 ID

DESCRIPTION
  删除单条卡密（缺参时交互选择）

EXAMPLES
  $ wsc card del -i <cardId>
```

_See code: [src/commands/card/del.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/card/del.ts)_

## `wsc card list`

列出商品的所有卡密（缺参时交互询问）

```
USAGE
  $ wsc card list [-p <value>]

FLAGS
  -p, --product=<value>  商品 ID

DESCRIPTION
  列出商品的所有卡密（缺参时交互询问）

EXAMPLES
  $ wsc card list -p <productId>
```

_See code: [src/commands/card/list.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/card/list.ts)_

## `wsc card stock`

查询商品卡密库存数量（缺参时交互询问）

```
USAGE
  $ wsc card stock [-p <value>]

FLAGS
  -p, --product=<value>  商品 ID

DESCRIPTION
  查询商品卡密库存数量（缺参时交互询问）

EXAMPLES
  $ wsc card stock -p <productId>
```

_See code: [src/commands/card/stock.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/card/stock.ts)_

## `wsc category add`

添加商品分类（缺参时交互询问）

```
USAGE
  $ wsc category add [-n <value>] [-s <value>]

FLAGS
  -n, --name=<value>  分类名称
  -s, --sort=<value>  排序权重

DESCRIPTION
  添加商品分类（缺参时交互询问）

EXAMPLES
  $ wsc category add -n "账号类" -s 1
```

_See code: [src/commands/category/add.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/category/add.ts)_

## `wsc category list`

列出所有分类

```
USAGE
  $ wsc category list

DESCRIPTION
  列出所有分类

EXAMPLES
  $ wsc category list
```

_See code: [src/commands/category/list.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/category/list.ts)_

## `wsc cf edit`

编辑用户配置文件, 默认启动内置 TUI 编辑器, 也可选择系统中的外部编辑器

```
USAGE
  $ wsc cf edit [-e]

FLAGS
  -e, --editor  交互式选择系统中可用的外部编辑器进行编辑

DESCRIPTION
  编辑用户配置文件, 默认启动内置 TUI 编辑器, 也可选择系统中的外部编辑器

ALIASES
  $ wsc cf edit

EXAMPLES
  $ wsc cf edit

  $ wsc cf edit --editor
```

## `wsc cf ls`

列出所有的配置

```
USAGE
  $ wsc cf ls

DESCRIPTION
  列出所有的配置

ALIASES
  $ wsc cf ls
  $ wsc cf show

EXAMPLES
  $ wsc cf ls
```

## `wsc cf set`

交互式设置当前配置档案的 API Key 与服务端地址(baseUrl)

```
USAGE
  $ wsc cf set

DESCRIPTION
  交互式设置当前配置档案的 API Key 与服务端地址(baseUrl)

ALIASES
  $ wsc cf set

EXAMPLES
  $ wsc cf set
```

## `wsc cf show`

列出所有的配置

```
USAGE
  $ wsc cf show

DESCRIPTION
  列出所有的配置

ALIASES
  $ wsc cf ls
  $ wsc cf show

EXAMPLES
  $ wsc cf show
```

## `wsc config edit`

编辑用户配置文件, 默认启动内置 TUI 编辑器, 也可选择系统中的外部编辑器

```
USAGE
  $ wsc config edit [-e]

FLAGS
  -e, --editor  交互式选择系统中可用的外部编辑器进行编辑

DESCRIPTION
  编辑用户配置文件, 默认启动内置 TUI 编辑器, 也可选择系统中的外部编辑器

ALIASES
  $ wsc cf edit

EXAMPLES
  $ wsc config edit

  $ wsc config edit --editor
```

_See code: [src/commands/config/edit.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/config/edit.ts)_

## `wsc config set`

交互式设置当前配置档案的 API Key 与服务端地址(baseUrl)

```
USAGE
  $ wsc config set

DESCRIPTION
  交互式设置当前配置档案的 API Key 与服务端地址(baseUrl)

ALIASES
  $ wsc cf set

EXAMPLES
  $ wsc config set
```

_See code: [src/commands/config/set.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/config/set.ts)_

## `wsc config show`

列出所有的配置

```
USAGE
  $ wsc config show

DESCRIPTION
  列出所有的配置

ALIASES
  $ wsc cf ls
  $ wsc cf show

EXAMPLES
  $ wsc config show
```

_See code: [src/commands/config/show.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/config/show.ts)_

## `wsc help [COMMAND]`

Display help for wsc.

```
USAGE
  $ wsc help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for wsc.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.3.0/src/commands/help.ts)_

## `wsc order get`

查询订单详情

```
USAGE
  $ wsc order get -i <value>

FLAGS
  -i, --id=<value>  (required) 订单 ID

DESCRIPTION
  查询订单详情

EXAMPLES
  $ wsc order get -i <orderId>
```

_See code: [src/commands/order/get.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/order/get.ts)_

## `wsc order list`

查询订单列表

```
USAGE
  $ wsc order list

DESCRIPTION
  查询订单列表

EXAMPLES
  $ wsc order list
```

_See code: [src/commands/order/list.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/order/list.ts)_

## `wsc payment add`

添加支付方式（选择服务商并录入配置）

```
USAGE
  $ wsc payment add [-n <value>] [-s <value>]

FLAGS
  -n, --name=<value>  支付方式名称
  -s, --sort=<value>  排序权重

DESCRIPTION
  添加支付方式（选择服务商并录入配置）

EXAMPLES
  $ wsc payment add -n "支付宝" -s 1
```

_See code: [src/commands/payment/add.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/payment/add.ts)_

## `wsc payment list`

列出所有支付方式及服务商配置

```
USAGE
  $ wsc payment list

DESCRIPTION
  列出所有支付方式及服务商配置

EXAMPLES
  $ wsc payment list
```

_See code: [src/commands/payment/list.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/payment/list.ts)_

## `wsc payment remove`

删除支付方式（缺参时交互选择）

```
USAGE
  $ wsc payment remove [-i <value>]

FLAGS
  -i, --id=<value>  支付方式 ID

DESCRIPTION
  删除支付方式（缺参时交互选择）

EXAMPLES
  $ wsc payment remove -i <paymentId>
```

_See code: [src/commands/payment/remove.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/payment/remove.ts)_

## `wsc payment update`

更新支付方式与服务商配置（缺参时交互询问）

```
USAGE
  $ wsc payment update [-i <value>] [-n <value>] [-s <value>] [-e <value>]

FLAGS
  -e, --enabled=<value>  是否启用 true|false
  -i, --id=<value>       支付方式 ID
  -n, --name=<value>     支付方式名称
  -s, --sort=<value>     排序权重

DESCRIPTION
  更新支付方式与服务商配置（缺参时交互询问）

EXAMPLES
  $ wsc payment update -i <paymentId> -e false

  $ wsc payment update -i <paymentId> -n "新名称" -s 2
```

_See code: [src/commands/payment/update.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/payment/update.ts)_

## `wsc product add`

添加商品（默认下架，缺参时交互询问）

```
USAGE
  $ wsc product add [-c <value>] [-n <value>] [-p <value>] [-d <value>]

FLAGS
  -c, --category=<value>  所属分类 ID
  -d, --desc=<value>      商品描述
  -n, --name=<value>      商品名称
  -p, --price=<value>     商品价格

DESCRIPTION
  添加商品（默认下架，缺参时交互询问）

EXAMPLES
  $ wsc product add -c <categoryId> -n "商品名" -p 9.9
```

_See code: [src/commands/product/add.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/product/add.ts)_

## `wsc product detail`

编辑商品详情内容（缺参时交互询问）

```
USAGE
  $ wsc product detail [-i <value>] [-d <value>]

FLAGS
  -d, --detail=<value>  商品详情内容, 传空字符串则清空
  -i, --id=<value>      商品 ID

DESCRIPTION
  编辑商品详情内容（缺参时交互询问）

EXAMPLES
  $ wsc product detail -i <productId> -d "<详情内容>"
```

_See code: [src/commands/product/detail.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/product/detail.ts)_

## `wsc product list`

列出所有商品

```
USAGE
  $ wsc product list

DESCRIPTION
  列出所有商品

EXAMPLES
  $ wsc product list
```

_See code: [src/commands/product/list.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/product/list.ts)_

## `wsc product shelf`

商品上架 / 下架（缺参时交互询问）

```
USAGE
  $ wsc product shelf [-i <value>] [-s <value>]

FLAGS
  -i, --id=<value>      商品 ID
  -s, --status=<value>  目标状态 on|off

DESCRIPTION
  商品上架 / 下架（缺参时交互询问）

EXAMPLES
  $ wsc product shelf -i <productId> -s on
```

_See code: [src/commands/product/shelf.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/product/shelf.ts)_

## `wsc version`

```
USAGE
  $ wsc version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/3.0.1/src/commands/version.ts)_
<!-- commandsstop -->
