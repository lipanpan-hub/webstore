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
@lppx/ws-cli/0.0.0 win32-x64 node-v24.14.1
$ wsc --help [COMMAND]
USAGE
  $ wsc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`wsc hello PERSON`](#wsc-hello-person)
* [`wsc hello world`](#wsc-hello-world)
* [`wsc help [COMMAND]`](#wsc-help-command)
* [`wsc plugins`](#wsc-plugins)
* [`wsc plugins add PLUGIN`](#wsc-plugins-add-plugin)
* [`wsc plugins:inspect PLUGIN...`](#wsc-pluginsinspect-plugin)
* [`wsc plugins install PLUGIN`](#wsc-plugins-install-plugin)
* [`wsc plugins link PATH`](#wsc-plugins-link-path)
* [`wsc plugins remove [PLUGIN]`](#wsc-plugins-remove-plugin)
* [`wsc plugins reset`](#wsc-plugins-reset)
* [`wsc plugins uninstall [PLUGIN]`](#wsc-plugins-uninstall-plugin)
* [`wsc plugins unlink [PLUGIN]`](#wsc-plugins-unlink-plugin)
* [`wsc plugins update`](#wsc-plugins-update)

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

_See code: [src/commands/hello/index.ts](https://github.com/lipanpan-hub/ws-cli/blob/v0.0.0/src/commands/hello/index.ts)_

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

_See code: [src/commands/hello/world.ts](https://github.com/lipanpan-hub/ws-cli/blob/v0.0.0/src/commands/hello/world.ts)_

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

## `wsc plugins`

List installed plugins.

```
USAGE
  $ wsc plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ wsc plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.5.2/src/commands/plugins/index.ts)_

## `wsc plugins add PLUGIN`

Installs a plugin into wsc.

```
USAGE
  $ wsc plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into wsc.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the WSC_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the WSC_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ wsc plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ wsc plugins add myplugin

  Install a plugin from a github url.

    $ wsc plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ wsc plugins add someuser/someplugin
```

## `wsc plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ wsc plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ wsc plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.5.2/src/commands/plugins/inspect.ts)_

## `wsc plugins install PLUGIN`

Installs a plugin into wsc.

```
USAGE
  $ wsc plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into wsc.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the WSC_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the WSC_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ wsc plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ wsc plugins install myplugin

  Install a plugin from a github url.

    $ wsc plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ wsc plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.5.2/src/commands/plugins/install.ts)_

## `wsc plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ wsc plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ wsc plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.5.2/src/commands/plugins/link.ts)_

## `wsc plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ wsc plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ wsc plugins unlink
  $ wsc plugins remove

EXAMPLES
  $ wsc plugins remove myplugin
```

## `wsc plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ wsc plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.5.2/src/commands/plugins/reset.ts)_

## `wsc plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ wsc plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ wsc plugins unlink
  $ wsc plugins remove

EXAMPLES
  $ wsc plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.5.2/src/commands/plugins/uninstall.ts)_

## `wsc plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ wsc plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ wsc plugins unlink
  $ wsc plugins remove

EXAMPLES
  $ wsc plugins unlink myplugin
```

## `wsc plugins update`

Update installed plugins.

```
USAGE
  $ wsc plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.5.2/src/commands/plugins/update.ts)_
<!-- commandsstop -->
