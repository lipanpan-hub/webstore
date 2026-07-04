# 产品概述

webstore 是一个  nestjs+vue3 做的发卡网站，采用前后端分离架构
核心链路是 游客下单 → 支付回调 → 自动发货 → 订单查询
商品/卡密/库存管理  等站长管理操作 全部用CLI去操作 这样方便些 
数据库采用 Mongodb 




## 核心约定

- 后端 API 统一返回 `ApiResponse<T>` 结构：`{ code, message, data }`
- 前后端通过 `@webstore/shared` 共享类型，保证接口契约一致
