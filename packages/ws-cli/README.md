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
* [`wsc cf edit`](#wsc-cf-edit)
* [`wsc cf ls`](#wsc-cf-ls)
* [`wsc cf show`](#wsc-cf-show)
* [`wsc config edit`](#wsc-config-edit)
* [`wsc config show`](#wsc-config-show)
* [`wsc hello PERSON`](#wsc-hello-person)
* [`wsc hello world`](#wsc-hello-world)
* [`wsc help [COMMAND]`](#wsc-help-command)
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

## `wsc hello PERSON`

Say hello

```
USAGE
  $ wsc hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ wsc hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/hello/index.ts)_

## `wsc hello world`

Say hello world

```
USAGE
  $ wsc hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ wsc hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/lipanpan-hub/webstore/blob/v0.1.1/src/commands/hello/world.ts)_

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
