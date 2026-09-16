// 配置文件类型定义

import type {ConfigFile, NamedProfile} from './config-manager.js'

// 单个配置档案: 在通用 NamedProfile 之上扩展 ws-cli 的工作参数(工作目录 / 服务端地址 / API Key)
export interface Profile extends NamedProfile {
  apiKey?: string
  baseUrl?: string
  documentsPath?: string
}

// 顶层配置: 通用多档案结构在 vptool 档案上的特化
export type Config = ConfigFile<Profile>
